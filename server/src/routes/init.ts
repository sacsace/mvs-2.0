import { Router } from 'express';
import Company from '../models/Company';
import CompanyGst from '../models/CompanyGst';
import User from '../models/User';
import Role from '../models/Role';
import Permission from '../models/Permission';
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
    const { company, admin, gstData, menus, roles, permissions } = req.body;
    logger.info('Initializing system with comprehensive company, admin, and configuration data', { 
      companyName: company.name,
      adminUsername: admin.username,
      adminUserId: admin.userid 
    });

    // 기존 사용자 존재 여부 확인
    const existingUsers = await User.count({ where: { is_deleted: false } });
    if (existingUsers > 0) {
      await transaction.rollback();
      logger.warn('Initialization attempted but users already exist', { userCount: existingUsers });
      return res.status(400).json({
        success: false,
        message: '이미 사용자가 존재합니다. 시스템이 이미 초기화되었습니다.',
        error: 'ALREADY_INITIALIZED'
      });
    }

    // 1. 회사 정보 생성
    const newCompany = await Company.create({
      name: company.name,
      coi: company.business_number,
      representative_name: company.representative_name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      website: company.website,
      pan: company.pan,
      iec: company.iec,
      msme: company.msme,
      bank_name: company.bank_name,
      account_holder: company.account_holder,
      account_number: company.account_number,
      ifsc_code: company.ifsc_code,
      partner_type: company.partner_type,
      product_category: company.product_category,
      login_period_start: company.login_period_start,
      login_period_end: company.login_period_end,
    }, { transaction });

    logger.info('Company created successfully', { companyId: newCompany.company_id });

    // 2. GST 정보 생성
    if (Array.isArray(gstData) && gstData.length > 0) {
      const gstRows = gstData.map((gst: any) => ({
        company_id: newCompany.company_id,
        gst_number: gst.gst_number,
        address: gst.address,
        is_primary: gst.is_primary,
      }));
      await CompanyGst.bulkCreate(gstRows, { transaction });
      logger.info('GST data created successfully', { count: gstRows.length });
    }

    // 3. 관리자 계정 생성
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    const newUser = await User.create({
      userid: admin.userid,
      username: admin.username,
      password: hashedPassword,
      company_id: newCompany.company_id,
      role: 'admin',
      default_language: admin.default_language || 'ko',
    }, { transaction });

    logger.info('Admin user created successfully', { userId: newUser.id });

    // 4. 역할 데이터 저장
    if (Array.isArray(roles) && roles.length > 0) {
      const roleRows = roles.map((role: any) => ({
        name: role.name,
        name_en: role.name_en,
        description: role.description,
        description_en: role.description_en,
        level: role.level,
        company_access: role.company_access,
        is_active: true,
      }));
      await Role.bulkCreate(roleRows, { transaction });
      logger.info('Roles created successfully', { count: roleRows.length });
    }

    // 5. 권한 데이터 저장
    if (Array.isArray(permissions) && permissions.length > 0) {
      const permissionRows = permissions.map((permission: any) => ({
        name: permission.name,
        description: permission.description,
        level: permission.level,
        company_access: permission.company_access,
      }));
      await Permission.bulkCreate(permissionRows, { transaction });
      logger.info('Permissions created successfully', { count: permissionRows.length });
    }

    // 6. 메뉴 데이터 저장
    if (Array.isArray(menus) && menus.length > 0) {
      const menuRows = menus.map((menu: any) => ({
        name: menu.name,
        name_en: menu.name_en || menu.name,
        icon: menu.icon,
        order_num: menu.order,
        parent_id: menu.parent_id,
        url: menu.url || null,
        create_date: new Date(),
      }));
      await Menu.bulkCreate(menuRows, { transaction });
      logger.info('Menus created successfully', { count: menuRows.length });
    }

    await transaction.commit();
    logger.info('System initialization completed successfully with all components');
    res.json({ 
      success: true, 
      message: '시스템이 성공적으로 초기화되었습니다.',
      data: {
        company: {
          id: newCompany.company_id,
          name: newCompany.name
        },
        admin: {
          id: newUser.id,
          userid: newUser.userid,
          username: newUser.username
        }
      }
    });
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