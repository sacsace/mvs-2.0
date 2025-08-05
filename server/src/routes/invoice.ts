import express from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import Invoice from '../models/Invoice';
import Company from '../models/Company';
import User from '../models/User';
import { Op } from 'sequelize';
import logger from '../utils/logger';

const router = express.Router();

// JWT 인증을 위한 Request 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: number;
        username?: string;
        company_id?: number;
        role?: string;
      };
    }
  }
}

// 인보이스 목록 조회
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    
    let whereCondition: any = {};
    
    // root나 audit가 아닌 경우 자신의 회사 인보이스만 조회
    if (userRole !== 'root' && userRole !== 'audit') {
      whereCondition.company_id = userCompanyId;
    }
    
    const invoices = await Invoice.findAll({
      where: whereCondition,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['company_id', 'name']
        },
        {
          model: Company,
          as: 'partnerCompany',
          attributes: ['company_id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'userid']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json(invoices);
  } catch (error) {
    logger.error('인보이스 목록 조회 중 오류:', error);
    res.status(500).json({ error: '인보이스 목록을 불러오는데 실패했습니다.' });
  }
});

// 인보이스 상세 조회
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['company_id', 'name']
        },
        {
          model: Company,
          as: 'partnerCompany',
          attributes: ['company_id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'userid']
        }
      ]
    });
    
    if (!invoice) {
      return res.status(404).json({ error: '인보이스를 찾을 수 없습니다.' });
    }
    
    // 권한 확인: root나 audit가 아니고, 자신의 회사 인보이스가 아닌 경우 접근 불가
    if (userRole !== 'root' && userRole !== 'audit' && invoice.company_id !== userCompanyId) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    res.json(invoice);
  } catch (error) {
    logger.error('인보이스 상세 조회 중 오류:', error);
    res.status(500).json({ error: '인보이스를 불러오는데 실패했습니다.' });
  }
});

// 인보이스 생성
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    const userId = req.user?.id;
    
    // 사용자 정보 검증
    if (!userCompanyId || !userId) {
      return res.status(400).json({ error: '사용자 정보가 올바르지 않습니다.' });
    }
    
    const {
      invoice_number,
      invoice_type,
      partner_company_id,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      currency,
      description,
      notes
    } = req.body;
    
    // Lotus Invoice 권한 확인
    if (invoice_type === 'lotus') {
      // Minsub Ventures Private Limited 회사 확인
      const userCompany = await Company.findByPk(userCompanyId);
      if (!userCompany || !userCompany.name.includes('Minsub Ventures Private Limited')) {
        return res.status(403).json({ 
          error: 'Lotus Invoice는 Minsub Ventures Private Limited 회사 직원만 사용할 수 있습니다.' 
        });
      }
    }
    
    // 인보이스 번호 중복 확인
    const existingInvoice = await Invoice.findOne({
      where: { invoice_number }
    });
    
    if (existingInvoice) {
      return res.status(400).json({ error: '이미 존재하는 인보이스 번호입니다.' });
    }
    
    const invoice = await Invoice.create({
      invoice_number,
      invoice_type,
      company_id: userCompanyId,
      partner_company_id,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      currency: currency || 'KRW',
      status: 'draft',
      description,
      notes,
      created_by: userId
    });
    
    res.status(201).json({
      success: true,
      message: '인보이스가 성공적으로 생성되었습니다.',
      data: invoice
    });
  } catch (error) {
    logger.error('인보이스 생성 중 오류:', error);
    res.status(500).json({ error: '인보이스 생성에 실패했습니다.' });
  }
});

// 인보이스 수정
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ error: '인보이스를 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    if (userRole !== 'root' && userRole !== 'audit' && invoice.company_id !== userCompanyId) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    const {
      invoice_type,
      partner_company_id,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      currency,
      status,
      description,
      notes
    } = req.body;
    
    // Lotus Invoice 권한 확인
    if (invoice_type === 'lotus') {
      const userCompany = await Company.findByPk(userCompanyId);
      if (!userCompany || !userCompany.name.includes('Minsub Ventures Private Limited')) {
        return res.status(403).json({ 
          error: 'Lotus Invoice는 Minsub Ventures Private Limited 회사 직원만 사용할 수 있습니다.' 
        });
      }
    }
    
    await invoice.update({
      invoice_type,
      partner_company_id,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      currency,
      status,
      description,
      notes
    });
    
    res.json({
      success: true,
      message: '인보이스가 성공적으로 수정되었습니다.',
      data: invoice
    });
  } catch (error) {
    logger.error('인보이스 수정 중 오류:', error);
    res.status(500).json({ error: '인보이스 수정에 실패했습니다.' });
  }
});

// 인보이스 삭제
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ error: '인보이스를 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    if (userRole !== 'root' && userRole !== 'audit' && invoice.company_id !== userCompanyId) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    await invoice.destroy();
    
    res.json({
      success: true,
      message: '인보이스가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('인보이스 삭제 중 오류:', error);
    res.status(500).json({ error: '인보이스 삭제에 실패했습니다.' });
  }
});

// 인보이스 번호 생성 (자동 생성)
router.get('/generate-number/:type', authenticateJWT, async (req, res) => {
  try {
    const { type } = req.params;
    const userCompanyId = req.user?.company_id;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // 회사 정보 조회 (회사 코드 사용을 위해)
    const company = await Company.findByPk(userCompanyId);
    const companyCode = company?.coi || 'COMP';
    
    // 인보이스 타입별로 다른 패턴 사용
    let invoiceNumber = '';
    
    if (type === 'proforma') {
      // Proforma Invoice: PF-회사코드-연도-월-순번
      const todayProformaInvoices = await Invoice.count({
        where: {
          company_id: userCompanyId,
          invoice_type: 'proforma',
          created_at: {
            [Op.gte]: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      });
      
      const sequence = String(todayProformaInvoices + 1).padStart(3, '0');
      invoiceNumber = `PF-${companyCode}-${year}${month}-${sequence}`;
    } else {
      // 일반 인보이스: 회사코드-연도-월-순번
      const todayInvoices = await Invoice.count({
        where: {
          company_id: userCompanyId,
          invoice_type: {
            [Op.in]: ['regular', 'e-invoice', 'lotus']
          },
          created_at: {
            [Op.gte]: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      });
      
      const sequence = String(todayInvoices + 1).padStart(3, '0');
      invoiceNumber = `${companyCode}-${year}${month}-${sequence}`;
    }
    
    res.json({ invoice_number: invoiceNumber });
  } catch (error) {
    logger.error('인보이스 번호 생성 중 오류:', error);
    res.status(500).json({ error: '인보이스 번호 생성에 실패했습니다.' });
  }
});

export default router; 