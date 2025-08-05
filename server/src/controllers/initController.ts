import { Request, Response } from 'express';
import sequelize from '../config/database';
import Company from '../models/Company';
import User from '../models/User';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

export const initializeSystem = async (req: Request, res: Response) => {
  try {
    const { company, user } = req.body;

    // 트랜잭션 시작
    const result = await sequelize.transaction(async (t) => {
      // 회사 생성
      const newCompany = await Company.create({
        name: company.name,
        is_deleted: false
      }, { transaction: t });

      // 관리자 사용자 생성
      const newUser = await User.create({
        username: user.username,
        password: user.password,
        company_id: newCompany.company_id,
        role: 'admin',
        is_deleted: false
      }, { transaction: t });

      return { company: newCompany, user: newUser };
    });

    res.json({
      success: true,
      message: '시스템이 성공적으로 초기화되었습니다.',
      data: {
        company: {
          id: result.company.company_id,
          name: result.company.name
        },
        user: {
          id: result.user.id,
          username: result.user.username
        }
      }
    });
  } catch (error) {
    logger.error('Error initializing system:', error);
    res.status(500).json({
      success: false,
      message: '시스템 초기화 중 오류가 발생했습니다.'
    });
  }
}; 