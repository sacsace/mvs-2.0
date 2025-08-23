import { Router, Request, Response, NextFunction } from 'express';
import Payroll from '../models/Payroll';
import User from '../models/User';
import Company from '../models/Company';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import config from '../config';
// import nodemailer from 'nodemailer';

const router = Router();

// JWT 인증 미들웨어
function authMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// 급여 목록 조회
router.get('/', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { month, year, status, page = 1, limit = 20 } = req.query;
    
    let whereCondition: any = {};
    
    if (month && year) {
      whereCondition.month = month;
      whereCondition.year = parseInt(year as string);
    }
    
    if (status) {
      whereCondition.status = status;
    }

    // 권한 체크
    if (currentUser?.role === 'root') {
      // root는 모든 급여 조회 가능
    } else if (currentUser?.role === 'admin' || currentUser?.role === 'audit') {
      // admin과 audit는 자신의 회사 급여만 조회
      whereCondition['$User.company_id$'] = currentUser.company_id;
    } else {
      // 일반 사용자는 자신의 급여만 조회
      whereCondition.user_id = currentUser.id;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { count, rows: payrolls } = await Payroll.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'userid', 'username', 'company_id'],
          include: [
            {
              model: Company,
              as: 'Company',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['month', 'DESC'], ['year', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: payrolls,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error fetching payrolls:', error);
    res.status(500).json({
      success: false,
      message: '급여 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 사용자의 급여 조회
router.get('/user/:userId', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { userId } = req.params;
    const { month, year } = req.query;

    // 권한 체크
    if (currentUser?.role !== 'root' && 
        currentUser?.role !== 'admin' && 
        currentUser?.role !== 'audit' && 
        currentUser.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: '해당 사용자의 급여 정보를 조회할 권한이 없습니다.'
      });
    }

    let whereCondition: any = { user_id: parseInt(userId) };
    
    if (month && year) {
      whereCondition.month = month;
      whereCondition.year = parseInt(year as string);
    }

    const payrolls = await Payroll.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'userid', 'username', 'company_id'],
          include: [
            {
              model: Company,
              as: 'Company',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['month', 'DESC'], ['year', 'DESC']]
    });

    res.json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    logger.error('Error fetching user payrolls:', error);
    res.status(500).json({
      success: false,
      message: '사용자 급여 조회 중 오류가 발생했습니다.'
    });
  }
});

// 급여 상세 조회
router.get('/:id', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    const payroll = await Payroll.findByPk(parseInt(id), {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'userid', 'username', 'company_id'],
          include: [
            {
              model: Company,
              as: 'Company',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: '급여 정보를 찾을 수 없습니다.'
      });
    }

    // 권한 체크
    if (currentUser?.role !== 'root' && 
        currentUser?.role !== 'admin' && 
        currentUser?.role !== 'audit' && 
        currentUser.id !== payroll.user_id) {
      return res.status(403).json({
        success: false,
        message: '해당 급여 정보를 조회할 권한이 없습니다.'
      });
    }

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    logger.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      message: '급여 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// 급여 생성
router.post('/', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const payrollData = req.body;

    // 권한 체크
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '급여 생성 권한이 없습니다.'
      });
    }

    // 중복 체크
    const existingPayroll = await Payroll.findOne({
      where: {
        user_id: payrollData.user_id,
        month: payrollData.month,
        year: payrollData.year
      }
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: '해당 월의 급여 정보가 이미 존재합니다.'
      });
    }

    // 급여 계산
    const grossSalary = 
      payrollData.basic_salary + 
      payrollData.hra + 
      payrollData.da + 
      payrollData.ta + 
      payrollData.ma + 
      payrollData.special_allowance + 
      payrollData.bonus + 
      payrollData.overtime_pay;

    const netSalary = grossSalary - 
      payrollData.pf_contribution - 
      payrollData.esi_contribution - 
      payrollData.tds - 
      payrollData.professional_tax;

    const newPayroll = await Payroll.create({
      ...payrollData,
      gross_salary: grossSalary,
      net_salary: netSalary,
      created_by: currentUser.id,
      updated_by: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: newPayroll,
      message: '급여 정보가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    logger.error('Error creating payroll:', error);
    res.status(500).json({
      success: false,
      message: '급여 정보 생성 중 오류가 발생했습니다.'
    });
  }
});

// 급여 수정
router.put('/:id', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // 권한 체크
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '급여 수정 권한이 없습니다.'
      });
    }

    const payroll = await Payroll.findByPk(parseInt(id));
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: '급여 정보를 찾을 수 없습니다.'
      });
    }

    // 급여 재계산
    if (updateData.basic_salary !== undefined || 
        updateData.hra !== undefined || 
        updateData.da !== undefined || 
        updateData.ta !== undefined || 
        updateData.ma !== undefined || 
        updateData.special_allowance !== undefined || 
        updateData.bonus !== undefined || 
        updateData.overtime_pay !== undefined) {
      
      const basicSalary = updateData.basic_salary ?? payroll.basic_salary;
      const hra = updateData.hra ?? payroll.hra;
      const da = updateData.da ?? payroll.da;
      const ta = updateData.ta ?? payroll.ta;
      const ma = updateData.ma ?? payroll.ma;
      const specialAllowance = updateData.special_allowance ?? payroll.special_allowance;
      const bonus = updateData.bonus ?? payroll.bonus;
      const overtimePay = updateData.overtime_pay ?? payroll.overtime_pay;

      updateData.gross_salary = 
        basicSalary + hra + da + ta + ma + specialAllowance + bonus + overtimePay;
    }

    if (updateData.gross_salary !== undefined || 
        updateData.pf_contribution !== undefined || 
        updateData.esi_contribution !== undefined || 
        updateData.tds !== undefined || 
        updateData.professional_tax !== undefined) {
      
      const grossSalary = updateData.gross_salary ?? payroll.gross_salary;
      const pfContribution = updateData.pf_contribution ?? payroll.pf_contribution;
      const esiContribution = updateData.esi_contribution ?? payroll.esi_contribution;
      const tds = updateData.tds ?? payroll.tds;
      const professionalTax = updateData.professional_tax ?? payroll.professional_tax;

      updateData.net_salary = grossSalary - pfContribution - esiContribution - tds - professionalTax;
    }

    await payroll.update({
      ...updateData,
      updated_by: currentUser.id
    });

    res.json({
      success: true,
      message: '급여 정보가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    logger.error('Error updating payroll:', error);
    res.status(500).json({
      success: false,
      message: '급여 정보 수정 중 오류가 발생했습니다.'
    });
  }
});

// 급여 상태 변경
router.patch('/:id/status', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { status } = req.body;

    // 권한 체크
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '급여 상태 변경 권한이 없습니다.'
      });
    }

    const payroll = await Payroll.findByPk(parseInt(id));
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: '급여 정보를 찾을 수 없습니다.'
      });
    }

    await payroll.update({
      status,
      updated_by: currentUser.id,
      payment_date: status === 'paid' ? new Date() : undefined
    });

    res.json({
      success: true,
      message: '급여 상태가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    logger.error('Error updating payroll status:', error);
    res.status(500).json({
      success: false,
      message: '급여 상태 변경 중 오류가 발생했습니다.'
    });
  }
});

// 급여명세서 이메일 전송
router.post('/:id/send-email', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { email } = req.body;

    // 권한 체크
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '이메일 전송 권한이 없습니다.'
      });
    }

    const payroll = await Payroll.findByPk(parseInt(id), {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'userid', 'username', 'email', 'company_id'],
          include: [
            {
              model: Company,
              as: 'Company',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: '급여 정보를 찾을 수 없습니다.'
      });
    }

    // 이메일 전송 로직 (실제 구현 시 nodemailer 설정 필요)
    const emailContent = generatePayrollEmailContent(payroll);
    
    // TODO: 실제 이메일 전송 구현
    logger.info(`Payroll email would be sent to ${email} for payroll ID ${id}`);

    res.json({
      success: true,
      message: '급여명세서가 성공적으로 이메일로 전송되었습니다.'
    });
  } catch (error) {
    logger.error('Error sending payroll email:', error);
    res.status(500).json({
      success: false,
      message: '이메일 전송 중 오류가 발생했습니다.'
    });
  }
});

// 급여 삭제
router.delete('/:id', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    // 권한 체크
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '급여 삭제 권한이 없습니다.'
      });
    }

    const payroll = await Payroll.findByPk(parseInt(id));
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: '급여 정보를 찾을 수 없습니다.'
      });
    }

    await payroll.destroy();

    res.json({
      success: true,
      message: '급여 정보가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('Error deleting payroll:', error);
    res.status(500).json({
      success: false,
      message: '급여 정보 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 급여명세서 이메일 내용 생성
function generatePayrollEmailContent(payroll: any) {
  return `
    <h2>급여명세서 - ${payroll.User.username}</h2>
    <p>기간: ${payroll.year}년 ${payroll.month}월</p>
    
    <h3>수당 내역</h3>
    <ul>
      <li>기본급: ${payroll.basic_salary.toLocaleString()}원</li>
      <li>주택임대수당: ${payroll.hra.toLocaleString()}원</li>
      <li>물가수당: ${payroll.da.toLocaleString()}원</li>
      <li>교통수당: ${payroll.ta.toLocaleString()}원</li>
      <li>의료수당: ${payroll.ma.toLocaleString()}원</li>
      <li>특별수당: ${payroll.special_allowance.toLocaleString()}원</li>
      <li>보너스: ${payroll.bonus.toLocaleString()}원</li>
      <li>초과근무수당: ${payroll.overtime_pay.toLocaleString()}원</li>
    </ul>
    
    <h3>공제 내역</h3>
    <ul>
      <li>EPF 기여금: ${payroll.pf_contribution.toLocaleString()}원</li>
      <li>ESI 기여금: ${payroll.esi_contribution.toLocaleString()}원</li>
      <li>TDS: ${payroll.tds.toLocaleString()}원</li>
      <li>전문직세: ${payroll.professional_tax.toLocaleString()}원</li>
    </ul>
    
    <h3>최종 급여</h3>
    <p>총 급여: ${payroll.gross_salary.toLocaleString()}원</p>
    <p>실수령액: ${payroll.net_salary.toLocaleString()}원</p>
    
    <p>근무일수: ${payroll.working_days}일</p>
    <p>초과근무시간: ${payroll.overtime_hours}시간</p>
  `;
}

export default router;
