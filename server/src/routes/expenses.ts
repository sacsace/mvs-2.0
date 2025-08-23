import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import Expense from '../models/Expense';
import ExpenseItem from '../models/ExpenseItem';
import User from '../models/User';
import Company from '../models/Company';
import logger from '../utils/logger';

const router = Router();

// 지출결의서 목록 조회 (받은 것, 요청한 것 구분)
router.get('/', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { type = 'all', page = 1, limit = 10, status, priority } = req.query;
    const currentUser = req.user;
    
    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    const offset = (Number(page) - 1) * Number(limit);
    const whereClause: any = { company_id: currentUser.company_id };

    // 상태 필터
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // 우선순위 필터
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    // 타입별 필터링
    if (type === 'received') {
      whereClause.approver_id = currentUser.id;
    } else if (type === 'requested') {
      whereClause.requester_id = currentUser.id;
    }

    const { count, rows } = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: User,
          as: 'Approver',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: Company,
          as: 'Company',
          attributes: ['company_id', 'company_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset
    });

    const totalPages = Math.ceil(count / Number(limit));

    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: count,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    logger.error('지출결의서 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: '지출결의서 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 지출결의서 상세 조회
router.get('/:id', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    const expense = await Expense.findOne({
      where: { 
        id, 
        company_id: currentUser.company_id 
      },
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: User,
          as: 'Approver',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: Company,
          as: 'Company',
          attributes: ['company_id', 'company_name']
        },
        {
          model: ExpenseItem,
          as: 'Items',
          attributes: ['id', 'product_name', 'description', 'quantity', 'unit_price', 'total_price']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: '지출결의서를 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    logger.error('지출결의서 상세 조회 오류:', error);
    res.status(500).json({ success: false, error: '지출결의서를 불러오는 중 오류가 발생했습니다.' });
  }
});

// 지출결의서 생성
router.post('/', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const {
      title,
      description,
      items,
      priority,
      approver_id,
      remarks
    } = req.body;

    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: '필수 정보가 누락되었습니다.' });
    }

    // 총액 계산
    let totalAmount = 0;
    items.forEach((item: any) => {
      totalAmount += Number(item.quantity) * Number(item.unit_price);
    });

    // GST 계산 (18%)
    const gstAmount = totalAmount * 0.18;
    const grandTotal = totalAmount + gstAmount;

    // 지출결의서 생성
    const expense = await Expense.create({
      title,
      description,
      total_amount: totalAmount,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      status: 'draft',
      priority: priority || 'medium',
      requester_id: currentUser.id,
      approver_id,
      company_id: currentUser.company_id,
      remarks,
      created_by: currentUser.id
    });

    // 지출 항목들 생성
    const expenseItems = await Promise.all(
      items.map((item: any) =>
        ExpenseItem.create({
          expense_id: expense.id,
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        })
      )
    );

    res.json({
      success: true,
      data: { expense, items: expenseItems },
      message: '지출결의서가 생성되었습니다.'
    });
  } catch (error) {
    logger.error('지출결의서 생성 오류:', error);
    res.status(500).json({ success: false, error: '지출결의서 생성 중 오류가 발생했습니다.' });
  }
});

// 지출결의서 수정
router.put('/:id', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const {
      title,
      description,
      items,
      priority,
      approver_id,
      remarks
    } = req.body;

    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    const expense = await Expense.findOne({
      where: { 
        id, 
        company_id: currentUser.company_id,
        requester_id: currentUser.id 
      }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: '수정할 수 있는 지출결의서가 없습니다.' });
    }

    if (expense.status !== 'draft') {
      return res.status(400).json({ success: false, error: '초안 상태가 아닌 지출결의서는 수정할 수 없습니다.' });
    }

    // 총액 계산
    let totalAmount = 0;
    items.forEach((item: any) => {
      totalAmount += Number(item.quantity) * Number(item.unit_price);
    });

    // GST 계산 (18%)
    const gstAmount = totalAmount * 0.18;
    const grandTotal = totalAmount + gstAmount;

    // 지출결의서 수정
    await expense.update({
      title,
      description,
      total_amount: totalAmount,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      priority: priority || 'medium',
      approver_id,
      remarks,
      updated_by: currentUser.id
    });

    // 기존 항목들 삭제
    await ExpenseItem.destroy({ where: { expense_id: Number(id) } });

    // 새로운 항목들 생성
    const expenseItems = await Promise.all(
      items.map((item: any) =>
        ExpenseItem.create({
          expense_id: Number(id),
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        })
      )
    );

    res.json({
      success: true,
      data: { expense, items: expenseItems },
      message: '지출결의서가 수정되었습니다.'
    });
  } catch (error) {
    logger.error('지출결의서 수정 오류:', error);
    res.status(500).json({ success: false, error: '지출결의서 수정 중 오류가 발생했습니다.' });
  }
});

// 지출결의서 제출 (승인 요청)
router.post('/:id/submit', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    const expense = await Expense.findOne({
      where: { 
        id, 
        company_id: currentUser.company_id,
        requester_id: currentUser.id 
      }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: '지출결의서를 찾을 수 없습니다.' });
    }

    if (expense.status !== 'draft') {
      return res.status(400).json({ success: false, error: '초안 상태가 아닌 지출결의서는 제출할 수 없습니다.' });
    }

    if (!expense.approver_id) {
      return res.status(400).json({ success: false, error: '승인자를 지정해야 합니다.' });
    }

    await expense.update({
      status: 'pending',
      updated_by: currentUser.id
    });

    res.json({
      success: true,
      message: '지출결의서가 승인자에게 제출되었습니다.'
    });
  } catch (error) {
    logger.error('지출결의서 제출 오류:', error);
    res.status(500).json({ success: false, error: '지출결의서 제출 중 오류가 발생했습니다.' });
  }
});

// 지출결의서 승인/거부
router.post('/:id/approve', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const currentUser = req.user;

    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: '잘못된 상태값입니다.' });
    }

    const expense = await Expense.findOne({
      where: { 
        id, 
        company_id: currentUser.company_id,
        approver_id: currentUser.id 
      }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: '승인할 수 있는 지출결의서가 없습니다.' });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({ success: false, error: '대기 중인 지출결의서만 승인할 수 있습니다.' });
    }

    await expense.update({
      status,
      remarks: remarks || expense.remarks,
      updated_by: currentUser.id
    });

    res.json({
      success: true,
      message: `지출결의서가 ${status === 'approved' ? '승인' : '거부'}되었습니다.`
    });
  } catch (error) {
    logger.error('지출결의서 승인/거부 오류:', error);
    res.status(500).json({ success: false, error: '지출결의서 처리 중 오류가 발생했습니다.' });
  }
});

// 지출결의서 삭제
router.delete('/:id', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    const expense = await Expense.findOne({
      where: { 
        id, 
        company_id: currentUser.company_id,
        requester_id: currentUser.id 
      }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: '삭제할 수 있는 지출결의서가 없습니다.' });
    }

    if (expense.status !== 'draft') {
      return res.status(400).json({ success: false, error: '초안 상태가 아닌 지출결의서는 삭제할 수 없습니다.' });
    }

    // 지출 항목들 삭제
    await ExpenseItem.destroy({ where: { expense_id: Number(id) } });

    // 지출결의서 삭제
    await expense.destroy();

    res.json({
      success: true,
      message: '지출결의서가 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('지출결의서 삭제 오류:', error);
    res.status(500).json({ success: false, error: '지출결의서 삭제 중 오류가 발생했습니다.' });
  }
});

// 영수증 파일 업로드
router.post('/:id/receipts', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { receipt_files } = req.body;
    const currentUser = req.user;

    if (!currentUser || !currentUser.company_id) {
      return res.status(400).json({ success: false, error: '사용자 정보가 없습니다.' });
    }

    const expense = await Expense.findOne({
      where: { 
        id, 
        company_id: currentUser.company_id,
        requester_id: currentUser.id 
      }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: '지출결의서를 찾을 수 없습니다.' });
    }

    // 기존 영수증 파일들과 새로운 파일들 합치기
    const updatedReceiptFiles = [...(expense.receipt_files || []), ...receipt_files];

    await expense.update({
      receipt_files: updatedReceiptFiles,
      updated_by: currentUser.id
    });

    res.json({
      success: true,
      message: '영수증 파일이 업로드되었습니다.',
      data: { receipt_files: updatedReceiptFiles }
    });
  } catch (error) {
    logger.error('영수증 파일 업로드 오류:', error);
    res.status(500).json({ success: false, error: '영수증 파일 업로드 중 오류가 발생했습니다.' });
  }
});

export default router;
