import express, { Request, Response } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import Permission from '../models/Permission';
import logger from '../utils/logger';

const router = express.Router();

// 권한 목록 조회
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;

    let whereClause: any = {};
    
    // 권한에 따른 필터링
    if (userRole === 'admin' || userRole === 'regular') {
      // admin과 regular는 자사 관련 권한만 볼 수 있음
      whereClause = {
        [require('sequelize').Op.or]: [
          { company_access: 'all' },
          { company_access: 'own' }
        ]
      };
    } else if (userRole === 'audit') {
      // audit는 모든 권한을 볼 수 있음 (검색 가능하지만 관리 불가)
      whereClause = {};
    }
    // root는 모든 권한을 볼 수 있음

    const permissions = await Permission.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json(permissions);
  } catch (error) {
    logger.error('Error fetching permissions:', error);
    res.status(500).json({ error: '권한 목록을 불러오는데 실패했습니다.' });
  }
});

// 권한 생성
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // root, admin, audit만 권한 생성 가능
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const { name, description, level, company_access } = req.body;

    // 필수 필드 검증
    if (!name || !description || !level || !company_access) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 권한 레벨 검증
    const validLevels = ['root', 'admin', 'regular', 'audit'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: '유효하지 않은 권한 레벨입니다.' });
    }

    // 회사 접근 권한 검증
    const validAccess = ['all', 'own', 'none'];
    if (!validAccess.includes(company_access)) {
      return res.status(400).json({ error: '유효하지 않은 회사 접근 권한입니다.' });
    }

    // admin과 audit는 root 권한을 생성할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && level === 'root') {
      return res.status(403).json({ error: 'admin과 audit는 root 권한을 생성할 수 없습니다.' });
    }

    const permission = await Permission.create({
      name,
      description,
      level,
      company_access
    });

    logger.info(`Permission created: ${name} by ${req.user?.username}`);
    res.status(201).json(permission);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: '이미 존재하는 권한명입니다.' });
    }
    logger.error('Error creating permission:', error);
    res.status(500).json({ error: '권한 생성에 실패했습니다.' });
  }
});

// 권한 수정
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;
    const { name, description, level, company_access } = req.body;

    // root, admin, audit만 권한 수정 가능
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ error: '권한을 찾을 수 없습니다.' });
    }

    // admin과 audit는 root 권한을 수정할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && permission.level === 'root') {
      return res.status(403).json({ error: 'admin과 audit는 root 권한을 수정할 수 없습니다.' });
    }

    // admin과 audit는 root 권한으로 변경할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && level === 'root') {
      return res.status(403).json({ error: 'admin과 audit는 root 권한으로 변경할 수 없습니다.' });
    }

    await permission.update({
      name,
      description,
      level,
      company_access
    });

    logger.info(`Permission updated: ${name} by ${req.user?.username}`);
    res.json(permission);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: '이미 존재하는 권한명입니다.' });
    }
    logger.error('Error updating permission:', error);
    res.status(500).json({ error: '권한 수정에 실패했습니다.' });
  }
});

// 권한 삭제
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;

    // root, admin, audit만 권한 삭제 가능
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ error: '권한을 찾을 수 없습니다.' });
    }

    // admin과 audit는 root 권한을 삭제할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && permission.level === 'root') {
      return res.status(403).json({ error: 'admin과 audit는 root 권한을 삭제할 수 없습니다.' });
    }

    await permission.destroy();

    logger.info(`Permission deleted: ${permission.name} by ${req.user?.username}`);
    res.json({ success: true, message: '권한이 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error deleting permission:', error);
    res.status(500).json({ error: '권한 삭제에 실패했습니다.' });
  }
});

// 권한 상세 조회
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ error: '권한을 찾을 수 없습니다.' });
    }

    // 권한에 따른 접근 제어
    if (userRole === 'admin' || userRole === 'regular') {
      if (permission.company_access === 'none') {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }
    // audit와 root는 모든 권한에 접근 가능

    res.json(permission);
  } catch (error) {
    logger.error('Error fetching permission:', error);
    res.status(500).json({ error: '권한 조회에 실패했습니다.' });
  }
});

export default router; 