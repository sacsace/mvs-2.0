import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT } from '../utils/jwtMiddleware';
import logger from '../utils/logger';
import Approval from '../models/Approval';
import ApprovalFile from '../models/ApprovalFile';
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
    const { status, type } = req.query; // type: 'requested' | 'received'

    let whereCondition: any = { company_id: currentUser.company_id };

    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    if (type === 'requested') {
      whereCondition.requester_id = currentUser.id;
    } else if (type === 'received') {
      whereCondition.approver_id = currentUser.id;
    }

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
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: approvals });
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

export default router; 