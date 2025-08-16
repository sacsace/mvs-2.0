import express from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import config from '../config';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { userid, password } = req.body;
    logger.info('Login attempt');
    console.log('로그인 시도 userid:', userid);
    console.log('로그인 시도 password:', password);

    // 사용자 찾기
    const user = await User.findOne({
      where: {
        userid: userid,
        is_deleted: false
      }
    });
    console.log('DB에서 찾은 사용자:', user ? user.toJSON() : null);

    if (!user) {
      logger.warn('User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('입력 비밀번호:', password);
    console.log('DB 비밀번호(해시):', user.password);
    console.log('bcrypt 비교 결과:', isValidPassword);
    if (!isValidPassword) {
      logger.warn('Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // root 사용자가 아닌 경우 로그인 기간 체크
    if (user.role !== 'root') {
      try {
        // 사용자의 회사 정보 조회
        const [companyResult] = await sequelize.query(`
          SELECT login_period_start, login_period_end 
          FROM company 
          WHERE company_id = ? AND is_deleted = false
        `, {
          replacements: [user.company_id],
          type: QueryTypes.SELECT
        }) as any[];

        if (companyResult) {
          const { login_period_start, login_period_end } = companyResult;
          // 인도 시간 기준으로 현재 날짜 계산
          const now = new Date();
          const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // UTC+5:30 (인도 시간)
          const currentDate = indiaTime.toISOString().split('T')[0]; // YYYY-MM-DD 형식

          // 디버깅을 위한 로그 추가
          console.log('=== 로그인 기간 디버깅 ===');
          console.log('companyResult:', companyResult);
          console.log('login_period_start:', login_period_start, '타입:', typeof login_period_start);
          console.log('login_period_end:', login_period_end, '타입:', typeof login_period_end);
          console.log('UTC 시간:', now.toISOString());
          console.log('인도 시간:', indiaTime.toISOString());
          console.log('currentDate (인도 기준):', currentDate);

          // 로그인 기간이 설정되어 있는 경우 체크
          if (login_period_start || login_period_end) {
            // 시작일이 설정되어 있고 유효한 날짜인 경우 체크
            if (login_period_start && login_period_start !== 'Invalid date' && login_period_start !== null) {
              if (currentDate < login_period_start) {
                logger.warn('Login period not started', { user_id: user.id, login_period_start, current_date: currentDate });
                return res.status(403).json({
                  success: false,
                  message: '로그인 기간이 시작되지 않았습니다.',
                  login_period_start,
                  current_date: currentDate
                });
              }
            }

            // 종료일이 설정되어 있고 유효한 날짜인 경우 체크
            if (login_period_end && login_period_end !== 'Invalid date' && login_period_end !== null) {
              if (currentDate > login_period_end) {
                logger.warn('Login period expired', { user_id: user.id, login_period_end, current_date: currentDate });
                console.log('=== 로그인 기간 만료 응답 전송 ===');
                const responseData = {
                  success: false,
                  message: '로그인 기간이 만료되었습니다.',
                  login_period_end,
                  current_date: currentDate
                };
                console.log('응답 데이터:', responseData);
                console.log('상태 코드: 403');
                return res.status(403).json(responseData);
              }
            }
          }
        }
      } catch (error) {
        logger.error('Login period check error:', error);
        // 로그인 기간 체크 중 오류가 발생해도 로그인은 허용
      }
    }

    logger.info('Login successful');
    // JWT 토큰 발급
    const token = jwt.sign(
      {
        id: user.id,
        userid: user.userid,
        username: user.username,
        company_id: user.company_id,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    // 로그인 기간 만료 예정 확인 (root 사용자가 아닌 경우만)
    let expiryWarning = null;
    if (user.role !== 'root') {
      try {
        const [companyResult] = await sequelize.query(`
          SELECT login_period_end 
          FROM company 
          WHERE company_id = ? AND is_deleted = false
        `, {
          replacements: [user.company_id],
          type: QueryTypes.SELECT
        }) as any[];

        if (companyResult && companyResult.login_period_end) {
          const { login_period_end } = companyResult;
          const now = new Date();
          const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
          const currentDate = indiaTime.toISOString().split('T')[0];
          
          // 만료일까지 남은 일수 계산
          const endDate = new Date(login_period_end);
          const currentDateObj = new Date(currentDate);
          const diffTime = endDate.getTime() - currentDateObj.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          console.log('=== 만료 예정 확인 ===');
          console.log('로그인 종료일:', login_period_end);
          console.log('현재 날짜:', currentDate);
          console.log('남은 일수:', daysRemaining);
          
          // 5일 이하 남았으면 경고 메시지 생성
          if (daysRemaining <= 5 && daysRemaining > 0) {
            expiryWarning = {
              daysRemaining,
              expiryDate: login_period_end,
              message: `로그인 기간이 ${daysRemaining}일 후에 만료됩니다. (만료일: ${login_period_end})`
            };
            console.log('만료 예정 경고 생성:', expiryWarning);
          }
        }
      } catch (error) {
        console.error('만료 예정 확인 중 오류:', error);
      }
    }

    // 로그인 성공
    const response: any = {
      success: true,
      token,
      user: {
        id: user.id,
        userid: user.userid,
        username: user.username,
        company_id: user.company_id,
        role: user.role,
        default_language: user.default_language
      }
    };

    // 만료 예정 경고가 있으면 추가
    if (expiryWarning) {
      response.expiryWarning = expiryWarning;
    }

    res.json(response);
  } catch (error) {
    logger.error('Login error:', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

export default router; 