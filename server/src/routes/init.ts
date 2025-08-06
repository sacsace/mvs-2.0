import { Router } from 'express';
import Company from '../models/Company';
import User from '../models/User';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import Menu from '../models/Menu';

const router = Router();

// 헬스체크 엔드포인트
router.get('/health', (req, res) => {
  try {
    // 간단한 헬스체크 - 데이터베이스 연결 없이도 응답
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      message: 'Server is running successfully',
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      message: 'Server is running',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { company, admin, menus } = req.body;
    logger.info('Initializing system with company, admin, and menu data', { 
      companyName: company.name,
      adminUsername: admin.username 
    });

    // 1. 회사 정보 생성
    const newCompany = await Company.create({
      name: company.name,
      coi: company.business_number, // 사업자등록번호를 coi로 사용
      representative_name: company.representative_name,
      address: company.address,
      phone: company.phone,
      email: company.email,
    }, { transaction });

    logger.info('Company created successfully', { companyId: newCompany.company_id });

    // 2. 관리자 계정 생성
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    const newUser = await User.create({
      username: admin.username,
      password: hashedPassword,
      company_id: newCompany.company_id,
      role: 'admin',
    }, { transaction });

    logger.info('Admin user created successfully', { userId: newUser.id });

    // 3. 메뉴 데이터 저장
    if (Array.isArray(menus) && menus.length > 0) {
      const menuRows = menus.map((menu: any) => ({
        name: menu.name,
        icon: menu.icon,
        order_num: menu.order,
        parent_id: menu.parent_id,
        create_date: new Date(),
      }));
      await Menu.bulkCreate(menuRows, { transaction });
      logger.info('Menus created successfully', { count: menuRows.length });
    }

    await transaction.commit();
    logger.info('System initialization completed successfully');
    res.json({ success: true, message: '시스템이 성공적으로 초기화되었습니다.' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Initialization error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: '시스템 초기화 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 사용자 존재 여부 확인 API
router.get('/has-user', async (req, res) => {
  try {
    const count = await User.count({ where: { is_deleted: false } });
    res.json({ hasUser: count > 0 });
  } catch (error) {
    res.status(500).json({ hasUser: false, error: 'DB error' });
  }
});

export default router; 