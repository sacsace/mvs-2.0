import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT } from '../utils/jwtMiddleware';
import logger from '../utils/logger';
import Approval from '../models/Approval';
import ApprovalFile from '../models/ApprovalFile';
import ApprovalComment from '../models/ApprovalComment';
import User from '../models/User';
import Company from '../models/Company';

const router = express.Router();

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/approval');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// 결제 요청 목록 조회
router.get('/', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { status, type, limit } = req.query; // type: 'requested' | 'received'

    console.log('🔍 결재 목록 요청:', {
      userId: currentUser.id,
      username: currentUser.username,
      status,
      type,
      limit
    });

    let whereCondition: any = { company_id: currentUser.company_id };

    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    if (type === 'requested') {
      whereCondition.requester_id = currentUser.id;
      console.log('📤 요청한 결재 필터링');
    } else if (type === 'received') {
      whereCondition.approver_id = currentUser.id;
      console.log('📥 받은 결재 필터링');
    } else {
      console.log('📋 전체 결재 (회사 내)');
    }

    console.log('🔍 WHERE 조건:', whereCondition);

    // limit 설정
    const limitValue = limit ? parseInt(limit as string) : undefined;
    
    const approvals = await Approval.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['name']
        },
        {
          model: ApprovalFile,
          as: 'files',
          attributes: ['id', 'original_name', 'file_size', 'mime_type']
        }
      ],
      order: [['created_at', 'DESC']],
      ...(limitValue && { limit: limitValue })
    });

    console.log(`✅ ${approvals.length}개의 결재 데이터 반환`);
    approvals.forEach((approval: any) => {
      console.log(`  - ${approval.title} (요청자: ${approval.requester?.username}, 승인자: ${approval.approver?.username})`);
    });

    // 받은 결제 요청의 경우, 읽음/읽지 않음 정보 제공을 위해 사용자의 마지막 확인 시간 포함
    let userLastCheck = null;
    if (type === 'received') {
      const userInfo = await User.findByPk(currentUser.id, {
        attributes: ['last_notification_check']
      });
      userLastCheck = userInfo?.last_notification_check;
    }

    res.json({ 
      success: true, 
      data: approvals,
      userLastCheck: userLastCheck 
    });
  } catch (error) {
    logger.error('결제 요청 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '결제 요청 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 결제 요청 상세 조회
router.get('/:id', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

  const approval = await Approval.findOne({
      where: { 
        id: id,
        company_id: currentUser.company_id
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['name']
        },
        {
          model: ApprovalFile,
          as: 'files',
          attributes: ['id', 'original_name', 'file_name', 'file_size', 'mime_type', 'created_at'],
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['username']
            }
          ]
        },
        {
          model: ApprovalComment,
          as: 'comments',
          attributes: ['id', 'comment', 'created_at'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'userid']
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: '결제 요청을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: approval });
  } catch (error) {
    logger.error('결제 요청 상세 조회 오류:', error);
    res.status(500).json({ success: false, message: '결제 요청 상세 조회 중 오류가 발생했습니다.' });
  }
});

// 결제 요청 생성
router.post('/', authenticateJWT, upload.array('files', 10), async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    const { title, content, approver_id, priority, due_date } = req.body;
    const files = req.files as Express.Multer.File[];

    // 필수 필드 검증
    if (!title || !content || !approver_id || !due_date) {
      return res.status(400).json({ success: false, message: '모든 필수 필드를 입력해주세요.' });
    }

    // 같은 회사 사용자인지 확인
    const approver = await User.findOne({
      where: { 
        id: approver_id,
        company_id: currentUser.company_id,
        is_deleted: false
      }
    });

    if (!approver) {
      return res.status(400).json({ success: false, message: '유효하지 않은 승인자입니다.' });
    }

    // 결제 요청 생성
    const approval = await Approval.create({
      title,
      content,
      requester_id: currentUser.id,
      approver_id: parseInt(approver_id),
      status: 'pending',
      priority: priority || 'medium',
      due_date: new Date(due_date),
      company_id: currentUser.company_id
    });

    // 파일 업로드 처리
    if (files && files.length > 0) {
      const fileData = files.map(file => ({
        approval_id: approval.id,
        original_name: file.originalname,
        file_name: file.filename,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: currentUser.id
      }));

      await ApprovalFile.bulkCreate(fileData);
    }

    // 생성된 결제 요청 조회
    const createdApproval = await Approval.findByPk(approval.id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'userid']
        },
        {
          model: ApprovalFile,
          as: 'files',
          attributes: ['id', 'original_name', 'file_size', 'mime_type']
        }
      ]
    });

    res.status(201).json({ success: true, data: createdApproval });
  } catch (error) {
    logger.error('결제 요청 생성 오류:', error);
    res.status(500).json({ success: false, message: '결제 요청 생성 중 오류가 발생했습니다.' });
  }
});

// 결제 요청 승인/거부
router.put('/:id/status', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const currentUser = req.user;

    const approval = await Approval.findOne({
      where: { 
        id: id,
        approver_id: currentUser.id,
        company_id: currentUser.company_id
      }
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: '결제 요청을 찾을 수 없습니다.' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, message: '이미 처리된 결제 요청입니다.' });
    }

    await approval.update({
      status,
      updated_at: new Date()
    });

    // 상태 변경 코멘트가 있으면 저장
    if (comment && String(comment).trim().length > 0) {
      await ApprovalComment.create({
        approval_id: approval.id,
        user_id: currentUser.id,
        comment: String(comment).trim()
      });
    }

    res.json({ success: true, message: '결제 요청이 처리되었습니다.' });
  } catch (error) {
    logger.error('결제 요청 상태 변경 오류:', error);
    res.status(500).json({ success: false, message: '결제 요청 상태 변경 중 오류가 발생했습니다.' });
  }
});

// 파일 다운로드
router.get('/file/:fileId', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    const file = await ApprovalFile.findOne({
      where: { id: fileId },
      include: [
        {
          model: Approval,
          as: 'approval',
          where: { company_id: currentUser.company_id }
        }
      ]
    });

    if (!file) {
      return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ success: false, message: '파일이 존재하지 않습니다.' });
    }

    res.download(file.file_path, file.original_name);
  } catch (error) {
    logger.error('파일 다운로드 오류:', error);
    res.status(500).json({ success: false, message: '파일 다운로드 중 오류가 발생했습니다.' });
  }
});

// 같은 회사 사용자 목록 조회
router.get('/users/company', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;

    const users = await User.findAll({
      where: { 
        company_id: currentUser.company_id,
        is_deleted: false
      },
      attributes: ['id', 'username', 'userid', 'role'],
      order: [['username', 'ASC']]
    });

    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('회사 사용자 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '사용자 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 코멘트 목록 조회
router.get('/:id/comments', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // 접근 제어: 같은 회사의 요청만 조회 가능
    const approval = await Approval.findOne({ where: { id, company_id: currentUser.company_id } });
    if (!approval) {
      return res.status(404).json({ success: false, message: '결제 요청을 찾을 수 없습니다.' });
    }

    const comments = await ApprovalComment.findAll({
      where: { approval_id: id },
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'userid'] }],
      order: [['created_at', 'ASC']]
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    logger.error('코멘트 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '코멘트 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 코멘트 작성
router.post('/:id/comments', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const currentUser = req.user;

    if (!comment || String(comment).trim().length === 0) {
      return res.status(400).json({ success: false, message: '코멘트를 입력해주세요.' });
    }

    const approval = await Approval.findOne({ where: { id, company_id: currentUser.company_id } });
    if (!approval) {
      return res.status(404).json({ success: false, message: '결제 요청을 찾을 수 없습니다.' });
    }

    const created = await ApprovalComment.create({
      approval_id: approval.id,
      user_id: currentUser.id,
      comment: String(comment).trim()
    });

    const withAuthor = await ApprovalComment.findByPk(created.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'userid'] }]
    });

    res.status(201).json({ success: true, data: withAuthor });
  } catch (error) {
    logger.error('코멘트 작성 오류:', error);
    res.status(500).json({ success: false, message: '코멘트 작성 중 오류가 발생했습니다.' });
  }
});

// 승인자 재지정(다시 전달)
router.put('/:id/reassign', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { new_approver_id, note } = req.body as { new_approver_id: number; note?: string };
    const currentUser = req.user;

    if (!new_approver_id) {
      return res.status(400).json({ success: false, message: '새 승인자를 선택해주세요.' });
    }

    const approval = await Approval.findOne({ where: { id, company_id: currentUser.company_id } });
    if (!approval) {
      return res.status(404).json({ success: false, message: '결제 요청을 찾을 수 없습니다.' });
    }

    // 권한: 요청자 또는 현재 승인자만 재지정 가능
    if (approval.requester_id !== currentUser.id && approval.approver_id !== currentUser.id) {
      return res.status(403).json({ success: false, message: '재지정 권한이 없습니다.' });
    }

    // 같은 회사 사용자 검증
    const target = await User.findOne({ where: { id: new_approver_id, company_id: currentUser.company_id, is_deleted: false } });
    if (!target) {
      return res.status(400).json({ success: false, message: '유효하지 않은 승인자입니다.' });
    }

    await approval.update({ approver_id: new_approver_id, status: 'pending' });

    // 재지정 코멘트 저장
    if (note && String(note).trim()) {
      await ApprovalComment.create({ approval_id: approval.id, user_id: currentUser.id, comment: `재지정: ${String(note).trim()}` });
    } else {
      await ApprovalComment.create({ approval_id: approval.id, user_id: currentUser.id, comment: `재지정: 승인자를 ${new_approver_id}로 변경` });
    }

    res.json({ success: true, message: '승인자가 재지정되었습니다.' });
  } catch (error) {
    logger.error('승인자 재지정 오류:', error);
    res.status(500).json({ success: false, message: '승인자 재지정 중 오류가 발생했습니다.' });
  }
});

// 받은 결제 요청 개수 조회 (알림용)
router.get('/count/received', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;

    // 사용자 정보에서 마지막 알림 확인 시간 가져오기
    const user = await User.findByPk(currentUser.id, {
      attributes: ['last_notification_check']
    });

    let whereCondition: any = { 
      approver_id: currentUser.id,
      status: 'pending' // 대기 중인 것만
    };

    // 마지막 확인 시간 이후 생성된 것만 카운트
    if (user?.last_notification_check) {
      whereCondition.created_at = {
        [require('sequelize').Op.gt]: user.last_notification_check
      };
    }

    const count = await Approval.count({
      where: whereCondition
    });

    console.log(`🔔 알림 개수 조회 - 사용자: ${currentUser.username}, 마지막 확인: ${user?.last_notification_check}, 개수: ${count}`);

    res.json({ success: true, count });
  } catch (error) {
    logger.error('받은 결제 요청 개수 조회 오류:', error);
    res.status(500).json({ success: false, message: '받은 결제 요청 개수 조회 중 오류가 발생했습니다.' });
  }
});

// 알림 읽음 처리
router.post('/notifications/mark-read', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;

    await User.update(
      { last_notification_check: new Date() },
      { where: { id: currentUser.id } }
    );

    console.log(`✅ 알림 읽음 처리 완료 - 사용자: ${currentUser.username}, 시간: ${new Date()}`);

    res.json({ success: true, message: '알림이 읽음 처리되었습니다.' });
  } catch (error) {
    logger.error('알림 읽음 처리 오류:', error);
    res.status(500).json({ success: false, message: '알림 읽음 처리 중 오류가 발생했습니다.' });
  }
});

export default router; 