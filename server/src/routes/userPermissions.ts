import express, { Request, Response } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import UserPermission from '../models/UserPermission';
import User from '../models/User';
import Permission from '../models/Permission';
import Company from '../models/Company';
import logger from '../utils/logger';
import { Op } from 'sequelize';

const router = express.Router();

// 사용자 권한 목록 조회
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;

    let whereClause: any = {};
    
    // 권한에 따른 필터링
    if (userRole === 'admin' || userRole === 'regular') {
      // admin과 regular는 자사 사용자 권한만 볼 수 있음
      whereClause = {
        '$user.company_id$': userCompanyId
      };
    }
    // audit와 root는 모든 사용자 권한을 볼 수 있음

    const userPermissions = await UserPermission.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role', 'company_id'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['name']
            }
          ]
        },
        {
          model: Permission,
          as: 'permission',
          attributes: ['id', 'name', 'level', 'company_access']
        }
      ],
      where: whereClause,
      order: [['granted_at', 'DESC']]
    });

    // 응답 데이터 포맷팅
    const formattedPermissions = userPermissions.map((up: any) => ({
      id: up.id,
      user_id: up.user_id,
      permission_id: up.permission_id,
      granted_at: up.granted_at,
      granted_by: up.granted_by,
      permission_name: up.permission?.name,
      permission_level: up.permission?.level,
      user_username: up.user?.username,
      user_role: up.user?.role,
      company_name: up.user?.company?.name
    }));

    res.json(formattedPermissions);
  } catch (error) {
    logger.error('Error fetching user permissions:', error);
    res.status(500).json({ error: '사용자 권한 목록을 불러오는데 실패했습니다.' });
  }
});

// 특정 사용자의 권한 조회
router.get('/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    const { userId } = req.params;

    // 사용자 정보 조회
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 권한에 따른 접근 제어
    if (userRole === 'admin' || userRole === 'regular') {
      if (user.company_id !== userCompanyId) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }

    // 사용자의 권한 조회
    const userPermissions = await UserPermission.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Permission,
          as: 'permission',
          attributes: ['id', 'name', 'description', 'level', 'company_access']
        }
      ]
    });

    res.json(userPermissions);
  } catch (error) {
    logger.error('Error fetching user permissions:', error);
    res.status(500).json({ error: '사용자 권한 조회에 실패했습니다.' });
  }
});

// 사용자 권한 할당/수정
router.put('/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    const { userId } = req.params;
    const { permission_ids } = req.body;

    // root, admin, audit만 권한 할당 가능
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 사용자 정보 조회
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 권한에 따른 접근 제어
    if (userRole === 'admin') {
      if (user.company_id !== userCompanyId) {
        return res.status(403).json({ error: '자사 사용자만 권한을 할당할 수 있습니다.' });
      }
      if (user.role === 'root') {
        return res.status(403).json({ error: 'root 사용자의 권한은 수정할 수 없습니다.' });
      }
    }

    // 권한 ID 유효성 검증
    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({ error: '권한 ID 목록이 올바르지 않습니다.' });
    }

    // 기존 권한 삭제
    await UserPermission.destroy({
      where: { user_id: userId }
    });

    // 새로운 권한 할당
    const permissionsToAssign = permission_ids.map(permissionId => ({
      user_id: parseInt(userId),
      permission_id: permissionId,
      granted_by: req.user?.username || 'system'
    }));

    if (permissionsToAssign.length > 0) {
      await UserPermission.bulkCreate(permissionsToAssign);
    }

    logger.info(`User permissions updated for user ${userId} by ${req.user?.username}`);
    res.json({ success: true, message: '사용자 권한이 업데이트되었습니다.' });
  } catch (error) {
    logger.error('Error updating user permissions:', error);
    res.status(500).json({ error: '사용자 권한 업데이트에 실패했습니다.' });
  }
});

// 사용자 권한 삭제
router.delete('/:userId/:permissionId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    const { userId, permissionId } = req.params;

    // root, admin, audit만 권한 삭제 가능
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 사용자 정보 조회
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 권한에 따른 접근 제어
    if (userRole === 'admin') {
      if (user.company_id !== userCompanyId) {
        return res.status(403).json({ error: '자사 사용자만 권한을 삭제할 수 있습니다.' });
      }
      if (user.role === 'root') {
        return res.status(403).json({ error: 'root 사용자의 권한은 삭제할 수 없습니다.' });
      }
    }

    // 권한 삭제
    const deletedCount = await UserPermission.destroy({
      where: {
        user_id: userId,
        permission_id: permissionId
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: '할당된 권한을 찾을 수 없습니다.' });
    }

    logger.info(`User permission deleted for user ${userId} by ${req.user?.username}`);
    res.json({ success: true, message: '사용자 권한이 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error deleting user permission:', error);
    res.status(500).json({ error: '사용자 권한 삭제에 실패했습니다.' });
  }
});

export default router; 