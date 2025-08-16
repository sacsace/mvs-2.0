import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      company_id: decoded.company_id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// 로그인 기간 체크 미들웨어
export async function checkLoginPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user || user.role === 'root') {
      // root 사용자는 로그인 기간 제한 없음
      return next();
    }

    // 사용자의 회사 정보 조회
    const [companyResult] = await sequelize.query(`
      SELECT login_period_start, login_period_end 
      FROM company 
      WHERE company_id = ? AND is_deleted = false
    `, {
      replacements: [user.company_id],
      type: QueryTypes.SELECT
    }) as any[];

    if (!companyResult) {
      return res.status(403).json({ error: '회사 정보를 찾을 수 없습니다.' });
    }

    const { login_period_start, login_period_end } = companyResult;
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

    // 로그인 기간이 설정되어 있지 않으면 로그인 허용
    if (!login_period_start && !login_period_end) {
      return next();
    }

    // 시작일이 설정되어 있고 현재 날짜가 시작일보다 이전이면 로그인 차단
    if (login_period_start && currentDate < login_period_start) {
      return res.status(403).json({ 
        error: '로그인 기간이 시작되지 않았습니다.',
        login_period_start,
        current_date: currentDate
      });
    }

    // 종료일이 설정되어 있고 현재 날짜가 종료일보다 이후면 로그인 차단
    if (login_period_end && currentDate > login_period_end) {
      return res.status(403).json({ 
        error: '로그인 기간이 만료되었습니다.',
        login_period_end,
        current_date: currentDate
      });
    }

    next();
  } catch (error) {
    console.error('로그인 기간 체크 오류:', error);
    return res.status(500).json({ error: '로그인 기간 확인 중 오류가 발생했습니다.' });
  }
} 