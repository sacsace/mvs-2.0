import express, { Request, Response } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import Role from '../models/Role';
import RolePermission from '../models/RolePermission';
import Permission from '../models/Permission';
import logger from '../utils/logger';

const router = express.Router();

// 역할 목록 조회
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;

    let whereClause: any = { is_active: true };
    
    // 권한에 따른 필터링
    if (userRole === 'admin' || userRole === 'regular') {
      // admin과 regular는 custom 레벨 역할만 볼 수 있음
      whereClause.level = 'custom';
    }
    // audit와 root는 모든 역할을 볼 수 있음

    const roles = await Role.findAll({
      where: whereClause,
      order: [['level', 'ASC'], ['name', 'ASC']]
    });

    res.json(roles);
  } catch (error) {
    logger.error('Error fetching roles:', error);
    res.status(500).json({ error: '역할 목록을 불러오는데 실패했습니다.' });
  }
});

// 특정 역할 조회
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
        {
          model: RolePermission,
          as: 'rolePermissions',
          include: [
            {
              model: Permission,
              as: 'Permission',
              attributes: ['id', 'name', 'level', 'company_access']
            }
          ]
        }
      ]
    });

    if (!role) {
      return res.status(404).json({ error: '역할을 찾을 수 없습니다.' });
    }

    // 권한에 따른 접근 제어
    if (userRole === 'admin' || userRole === 'regular') {
      if (role.level !== 'custom') {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }

    res.json(role);
  } catch (error) {
    logger.error('Error fetching role:', error);
    res.status(500).json({ error: '역할을 불러오는데 실패했습니다.' });
  }
});

// 역할 생성
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { name, name_en, description, description_en, level, company_access, permission_ids } = req.body;

    // 권한 검사
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '역할을 생성할 권한이 없습니다.' });
    }

    // admin과 audit는 root 레벨 역할을 생성할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && level === 'root') {
      return res.status(403).json({ error: 'root 레벨 역할을 생성할 권한이 없습니다.' });
    }

    // 필수 필드 검증
    if (!name || !name_en || !description || !description_en || !level || !company_access) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }

    // 역할 생성
    const role = await Role.create({
      name,
      name_en,
      description,
      description_en,
      level,
      company_access,
      is_active: true
    });

    // 권한 할당
    if (permission_ids && Array.isArray(permission_ids)) {
      const rolePermissions = permission_ids.map((permissionId: number) => ({
        role_id: role.id,
        permission_id: permissionId,
        granted_by: req.user?.username || 'system'
      }));

      await RolePermission.bulkCreate(rolePermissions);
    }

    res.status(201).json(role);
  } catch (error) {
    logger.error('Error creating role:', error);
    res.status(500).json({ error: '역할 생성에 실패했습니다.' });
  }
});

// 역할 수정
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;
    const { name, name_en, description, description_en, level, company_access, permission_ids } = req.body;

    // 권한 검사
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '역할을 수정할 권한이 없습니다.' });
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: '역할을 찾을 수 없습니다.' });
    }

    // admin과 audit는 root 레벨 역할을 수정할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && role.level === 'root') {
      return res.status(403).json({ error: 'root 레벨 역할을 수정할 권한이 없습니다.' });
    }

    // admin과 audit는 역할을 root 레벨로 변경할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && level === 'root') {
      return res.status(403).json({ error: 'root 레벨로 변경할 권한이 없습니다.' });
    }

    // 역할 업데이트
    await role.update({
      name,
      name_en,
      description,
      description_en,
      level,
      company_access
    });

    // 기존 권한 삭제 후 새로 할당
    if (permission_ids && Array.isArray(permission_ids)) {
      await RolePermission.destroy({ where: { role_id: id } });
      
      const rolePermissions = permission_ids.map((permissionId: number) => ({
        role_id: parseInt(id),
        permission_id: permissionId,
        granted_by: req.user?.username || 'system'
      }));

      await RolePermission.bulkCreate(rolePermissions);
    }

    res.json(role);
  } catch (error) {
    logger.error('Error updating role:', error);
    res.status(500).json({ error: '역할 수정에 실패했습니다.' });
  }
});

// 역할 삭제 (비활성화)
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;

    // 권한 검사
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '역할을 삭제할 권한이 없습니다.' });
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: '역할을 찾을 수 없습니다.' });
    }

    // admin과 audit는 root 레벨 역할을 삭제할 수 없음
    if ((userRole === 'admin' || userRole === 'audit') && role.level === 'root') {
      return res.status(403).json({ error: 'root 레벨 역할을 삭제할 권한이 없습니다.' });
    }

    // 역할 비활성화 (실제 삭제 대신)
    await role.update({ is_active: false });

    // 관련 권한도 삭제
    await RolePermission.destroy({ where: { role_id: id } });

    res.json({ message: '역할이 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error deleting role:', error);
    res.status(500).json({ error: '역할 삭제에 실패했습니다.' });
  }
});

// 역할별 권한 조회
router.get('/:id/permissions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;

    const rolePermissions = await RolePermission.findAll({
      where: { role_id: id },
      include: [
        {
          model: Permission,
          as: 'Permission',
          attributes: ['id', 'name', 'level', 'company_access']
        }
      ]
    });

    const permissions = rolePermissions.map((rp: any) => rp.Permission);
    res.json(permissions);
  } catch (error) {
    logger.error('Error fetching role permissions:', error);
    res.status(500).json({ error: '역할 권한을 불러오는데 실패했습니다.' });
  }
});

export default router; 