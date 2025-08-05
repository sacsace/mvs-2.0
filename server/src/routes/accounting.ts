import express, { Request, Response } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import logger from '../utils/logger';
import Transaction from '../models/Transaction';
import Company from '../models/Company';
import User from '../models/User';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

const router = express.Router();

// 매입/매출 통계 조회
router.get('/statistics', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const userRole = currentUser?.role;
    const companyId = currentUser?.company_id;

    if (!currentUser) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    // 권한 확인: root, audit, 또는 해당 회사 사용자만 접근 가능
    if (userRole !== 'root' && userRole !== 'audit' && !companyId) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    const { startDate, endDate, companyFilter } = req.query;
    
    // 날짜 범위 설정
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1); // 올해 1월 1일
    const end = endDate ? new Date(endDate as string) : new Date(); // 오늘

    // 회사 필터 설정
    let targetCompanyId = companyId;
    if (userRole === 'root' || userRole === 'audit') {
      if (companyFilter) {
        targetCompanyId = parseInt(companyFilter as string);
      }
    }

    // 기본 통계 쿼리 조건
    const whereCondition: any = {
      transaction_date: {
        [Op.between]: [start, end]
      }
    };

    if (targetCompanyId) {
      whereCondition.company_id = targetCompanyId;
    }

    // 1. 전체 매입/매출 통계
    const totalStats = await Transaction.findAll({
      where: whereCondition,
      attributes: [
        'transaction_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avg_amount']
      ],
      group: ['transaction_type'],
      raw: true
    }) as any[];

    // 2. 월별 통계
    const monthlyStats = await sequelize.query(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        transaction_type,
        COUNT(*) as count,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_amount
      FROM [transaction] 
      WHERE transaction_date BETWEEN ? AND ? ${targetCompanyId ? 'AND company_id = ?' : ''}
      GROUP BY strftime('%Y-%m', transaction_date), transaction_type
      ORDER BY month DESC, transaction_type
    `, {
      replacements: targetCompanyId ? [start, end, targetCompanyId] : [start, end],
      type: QueryTypes.SELECT
    }) as any[];

    // 3. 상태별 통계
    const statusStats = await Transaction.findAll({
      where: whereCondition,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount']
      ],
      group: ['status'],
      raw: true
    }) as any[];

    // 4. 협력업체별 통계 (상위 10개)
    const partnerStats = await sequelize.query(`
      SELECT 
        c.name as partner_name,
        t.transaction_type,
        COUNT(*) as count,
        SUM(t.total_amount) as total_amount
      FROM [transaction] t
      JOIN company c ON t.partner_company_id = c.company_id
      WHERE t.transaction_date BETWEEN ? AND ? ${targetCompanyId ? 'AND t.company_id = ?' : ''}
      GROUP BY t.partner_company_id, t.transaction_type
      ORDER BY total_amount DESC
      LIMIT 10
    `, {
      replacements: targetCompanyId ? [start, end, targetCompanyId] : [start, end],
      type: QueryTypes.SELECT
    }) as any[];

    // 5. 최근 거래 내역 (최근 10개)
    const recentTransactions = await Transaction.findAll({
      where: whereCondition,
      include: [
        {
          model: Company,
          as: 'partnerCompany',
          attributes: ['name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        }
      ],
      order: [['transaction_date', 'DESC']],
      limit: 10
    });

    // 6. 회사 목록 (root/audit 사용자용)
    let companies: any[] = [];
    if (userRole === 'root' || userRole === 'audit') {
      companies = await Company.findAll({
        where: { is_deleted: false },
        attributes: ['company_id', 'name'],
        order: [['name', 'ASC']]
      });
    }

    // 통계 데이터 정리
    const purchaseStats = totalStats.find(stat => stat.transaction_type === 'purchase') || { count: '0', total_amount: '0', avg_amount: '0' };
    const saleStats = totalStats.find(stat => stat.transaction_type === 'sale') || { count: '0', total_amount: '0', avg_amount: '0' };

    const result = {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        purchase: {
          count: parseInt(purchaseStats.count) || 0,
          total_amount: parseFloat(purchaseStats.total_amount) || 0,
          avg_amount: parseFloat(purchaseStats.avg_amount) || 0
        },
        sale: {
          count: parseInt(saleStats.count) || 0,
          total_amount: parseFloat(saleStats.total_amount) || 0,
          avg_amount: parseFloat(saleStats.avg_amount) || 0
        },
        net_profit: (parseFloat(saleStats.total_amount) || 0) - (parseFloat(purchaseStats.total_amount) || 0)
      },
      monthly: monthlyStats,
      status: statusStats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.count),
        total_amount: parseFloat(stat.total_amount)
      })),
      partners: partnerStats,
      recent: recentTransactions.map(t => ({
        id: t.id,
        transaction_type: t.transaction_type,
        total_amount: parseFloat(t.total_amount.toString()),
        transaction_date: t.transaction_date,
        status: t.status,
        partner_name: (t as any).partnerCompany?.name,
        creator: (t as any).creator?.username,
        description: t.description
      })),
      companies: companies.map(c => ({
        company_id: c.company_id,
        name: c.name
      }))
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('매입/매출 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '매입/매출 통계 조회 중 오류가 발생했습니다.'
    });
  }
});

// 거래 내역 조회 (필터링 가능)
router.get('/transactions', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const userRole = currentUser?.role;
    const companyId = currentUser?.company_id;

    if (!currentUser) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { 
      page = 1, 
      limit = 20, 
      transaction_type, 
      status, 
      startDate, 
      endDate, 
      companyFilter,
      partnerCompany 
    } = req.query;

    // 권한 확인
    if (userRole !== 'root' && userRole !== 'audit' && !companyId) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    let targetCompanyId = companyId;
    if (userRole === 'root' || userRole === 'audit') {
      if (companyFilter) {
        targetCompanyId = parseInt(companyFilter as string);
      }
    }

    // 필터 조건 구성
    const whereCondition: any = {};
    
    if (targetCompanyId) {
      whereCondition.company_id = targetCompanyId;
    }
    
    if (transaction_type) {
      whereCondition.transaction_type = transaction_type;
    }
    
    if (status) {
      whereCondition.status = status;
    }
    
    if (startDate && endDate) {
      whereCondition.transaction_date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    // 협력업체 필터
    let partnerWhereCondition = {};
    if (partnerCompany) {
      partnerWhereCondition = {
        name: {
          [Op.like]: `%${partnerCompany}%`
        }
      };
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // 거래 내역 조회
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Company,
          as: 'partnerCompany',
          where: partnerWhereCondition,
          attributes: ['name', 'coi']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        }
      ],
      order: [['transaction_date', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    const transactions = rows.map(t => ({
      id: t.id,
      transaction_type: t.transaction_type,
      amount: parseFloat(t.amount.toString()),
      total_amount: parseFloat(t.total_amount.toString()),
      tax_amount: t.tax_amount ? parseFloat(t.tax_amount.toString()) : null,
      currency: t.currency,
      transaction_date: t.transaction_date,
      due_date: t.due_date,
      status: t.status,
      description: t.description,
      invoice_number: t.invoice_number,
      partner_company: {
        name: (t as any).partnerCompany?.name,
        coi: (t as any).partnerCompany?.coi
      },
      creator: (t as any).creator?.username,
      created_at: t.created_at
    }));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total_pages: Math.ceil(count / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    logger.error('거래 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '거래 내역 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router; 