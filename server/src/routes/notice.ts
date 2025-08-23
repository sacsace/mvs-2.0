import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import Notice from '../models/Notice';
import User from '../models/User';
import logger from '../utils/logger';
import { Op } from 'sequelize';

const router = Router();

// 공지사항 목록 조회 (회사별)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { page = 1, limit = 10, status, priority, search } = req.query;
    
    // 현재 사용자의 회사 ID 가져오기
    const companyId = currentUser.company_id;
    const offset = (Number(page) - 1) * Number(limit);
    
    // 검색 조건 구성
    const whereCondition: any = {
      company_id: companyId,
      status: 'active' // 활성 상태인 공지사항만
    };
    
    if (status && status !== 'all') {
      whereCondition.status = status;
    }
    
    if (priority && priority !== 'all') {
      whereCondition.priority = priority;
    }
    
    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 공지사항 조회 (고정 공지사항 먼저, 그 다음 최신순)
    const { count, rows } = await Notice.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'username', 'userid']
        }
      ],
      order: [
        ['is_pinned', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: Number(limit),
      offset: offset
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
    logger.error('공지사항 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '공지사항 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

// 공지사항 상세 조회
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    
    // 현재 사용자의 회사 ID 가져오기
    const companyId = currentUser.company_id;

    const notice = await Notice.findOne({
      where: {
        id: id,
        company_id: companyId
      },
      include: [
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'username', 'userid']
        }
      ]
    });

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: '공지사항을 찾을 수 없습니다.'
      });
    }

    // 조회수 증가
    await notice.increment('view_count');

    res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    logger.error('공지사항 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '공지사항을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

// 공지사항 생성 (관리자만)
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { title, content, priority, start_date, end_date, is_pinned } = req.body;
    
    // 현재 사용자의 회사 ID 가져오기
    const companyId = currentUser.company_id;

    const notice = await Notice.create({
      company_id: companyId,
      title,
      content,
      author_id: currentUser.id,
      status: 'active',
      priority: priority || 'medium',
      start_date: start_date || null,
      end_date: end_date || null,
      is_pinned: is_pinned || false,
      created_by: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: notice,
      message: '공지사항이 생성되었습니다.'
    });
  } catch (error) {
    logger.error('공지사항 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '공지사항 생성 중 오류가 발생했습니다.'
    });
  }
});

// 공지사항 수정 (작성자 또는 관리자만)
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const { title, content, priority, start_date, end_date, is_pinned, status } = req.body;
    
    // 현재 사용자의 회사 ID 가져오기
    const companyId = currentUser.company_id;

    const notice = await Notice.findOne({
      where: {
        id: id,
        company_id: companyId
      }
    });

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: '공지사항을 찾을 수 없습니다.'
      });
    }

    // 권한 체크: 작성자이거나 관리자인 경우만 수정 가능
    if (notice.created_by !== currentUser.id && !['root', 'admin'].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        error: '공지사항을 수정할 권한이 없습니다.'
      });
    }

    await notice.update({
      title,
      content,
      priority,
      start_date: start_date || null,
      end_date: end_date || null,
      is_pinned: is_pinned || false,
      status,
      updated_by: currentUser.id
    });

    res.json({
      success: true,
      data: notice,
      message: '공지사항이 수정되었습니다.'
    });
  } catch (error) {
    logger.error('공지사항 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '공지사항 수정 중 오류가 발생했습니다.'
    });
  }
});

// 공지사항 삭제 (작성자 또는 관리자만)
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    
    // 현재 사용자의 회사 ID 가져오기
    const companyId = currentUser.company_id;

    const notice = await Notice.findOne({
      where: {
        id: id,
        company_id: companyId
      }
    });

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: '공지사항을 찾을 수 없습니다.'
      });
    }

    // 권한 체크: 작성자이거나 관리자인 경우만 삭제 가능
    if (notice.created_by !== currentUser.id && !['root', 'admin'].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        error: '공지사항을 삭제할 권한이 없습니다.'
      });
    }

    await notice.destroy();

    res.json({
      success: true,
      message: '공지사항이 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('공지사항 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '공지사항 삭제 중 오류가 발생했습니다.'
    });
  }
});

export default router;
