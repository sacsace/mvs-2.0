import { Router } from 'express';
import User from '../models/User';
import Menu from '../models/Menu';
import Company from '../models/Company';
import MenuPermission from '../models/MenuPermission';
import { authenticateJWT } from '../utils/jwtMiddleware';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

const router = Router();

// 대시보드 통계 조회
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const companyId = req.user?.company_id;

    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    // 기본 통계 데이터 수집
    const stats: any = {};

    // 사용자 통계
    const userStats = await sequelize.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminUsers,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regularUsers
      FROM user 
      WHERE is_deleted = 0 ${userRole !== 'root' ? 'AND company_id = ?' : ''}
    `, {
      replacements: userRole !== 'root' ? [companyId] : [],
      type: QueryTypes.SELECT
    }) as any[];

    stats.users = {
      total: parseInt(userStats[0]?.totalUsers || '0'),
      admin: parseInt(userStats[0]?.adminUsers || '0'),
      regular: parseInt(userStats[0]?.regularUsers || '0')
    };

    // 메뉴 통계
    const menuStats = await sequelize.query(`
      SELECT 
        COUNT(*) as totalMenus,
        SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as topLevelMenus,
        SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as subMenus
      FROM menu
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    stats.menus = {
      total: parseInt(menuStats[0]?.totalMenus || '0'),
      topLevel: parseInt(menuStats[0]?.topLevelMenus || '0'),
      subMenus: parseInt(menuStats[0]?.subMenus || '0')
    };

    // 회사 통계
    const companyStats = await sequelize.query(`
      SELECT COUNT(*) as totalCompanies
      FROM company 
      WHERE is_deleted = 0
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    stats.companies = {
      total: parseInt(companyStats[0]?.totalCompanies || '0')
    };

    // 메뉴 권한 통계
    const permissionStats = await sequelize.query(`
      SELECT 
        COUNT(*) as totalPermissions,
        SUM(CASE WHEN can_read = 1 THEN 1 ELSE 0 END) as readPermissions,
        SUM(CASE WHEN can_create = 1 THEN 1 ELSE 0 END) as createPermissions,
        SUM(CASE WHEN can_update = 1 THEN 1 ELSE 0 END) as updatePermissions,
        SUM(CASE WHEN can_delete = 1 THEN 1 ELSE 0 END) as deletePermissions
      FROM menu_permission
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    stats.permissions = {
      total: parseInt(permissionStats[0]?.totalPermissions || '0'),
      read: parseInt(permissionStats[0]?.readPermissions || '0'),
      create: parseInt(permissionStats[0]?.createPermissions || '0'),
      update: parseInt(permissionStats[0]?.updatePermissions || '0'),
      delete: parseInt(permissionStats[0]?.deletePermissions || '0')
    };

    // 최근 활동 (최근 생성된 사용자)
    const recentUsers = await sequelize.query(`
      SELECT id, username, role, create_date
      FROM user 
      WHERE is_deleted = 0 ${userRole !== 'root' ? 'AND company_id = ?' : ''}
      ORDER BY create_date DESC 
      LIMIT 5
    `, {
      replacements: userRole !== 'root' ? [companyId] : [],
      type: QueryTypes.SELECT
    }) as any[];

    stats.recentUsers = recentUsers;

    // 매입/매출 통계 (invoice 테이블이 있는 경우)
    try {
      const invoiceStats = await sequelize.query(`
        SELECT 
          COUNT(*) as totalInvoices,
          SUM(CASE WHEN invoice_type = 'regular' THEN 1 ELSE 0 END) as regularInvoices,
          SUM(CASE WHEN invoice_type = 'e-invoice' THEN 1 ELSE 0 END) as eInvoices,
          SUM(CASE WHEN invoice_type = 'proforma' THEN 1 ELSE 0 END) as proformaInvoices,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftInvoices,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sentInvoices,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paidInvoices,
          SUM(total_amount) as totalAmount
        FROM invoice 
        WHERE 1=1 ${userRole !== 'root' ? 'AND company_id = ?' : ''}
      `, {
        replacements: userRole !== 'root' ? [companyId] : [],
        type: QueryTypes.SELECT
      }) as any[];

      stats.invoices = {
        total: parseInt(invoiceStats[0]?.totalInvoices || '0'),
        regular: parseInt(invoiceStats[0]?.regularInvoices || '0'),
        eInvoice: parseInt(invoiceStats[0]?.eInvoices || '0'),
        proforma: parseInt(invoiceStats[0]?.proformaInvoices || '0'),
        draft: parseInt(invoiceStats[0]?.draftInvoices || '0'),
        sent: parseInt(invoiceStats[0]?.sentInvoices || '0'),
        paid: parseInt(invoiceStats[0]?.paidInvoices || '0'),
        totalAmount: parseFloat(invoiceStats[0]?.totalAmount || '0')
      };
    } catch (error) {
      console.log('invoice 테이블이 없거나 오류 발생:', error);
      stats.invoices = {
        total: 0,
        regular: 0,
        eInvoice: 0,
        proforma: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        totalAmount: 0
      };
    }

    // 시스템 정보
    stats.system = {
      currentTime: new Date(),
      userRole: userRole,
      companyId: companyId
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('대시보드 통계 조회 중 오류:', error);
    res.status(500).json({ error: '대시보드 통계 조회 중 오류가 발생했습니다.' });
  }
});

export default router; 