import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { 
  getDefaultPermissionsByRole, 
  mergePermissions, 
  RolePermissions,
  getRoleLevel,
  isHigherRole 
} from './rolePermissions';

export interface UserPermissionResult {
  userId: number;
  username: string;
  role: string;
  companyId: number;
  menuPermissions: Record<string, RolePermissions>;
  hasMenuAccess: (menuName: string, action: 'read' | 'create' | 'update' | 'delete') => boolean;
  canAccessRole: (targetRole: string) => boolean;
}

// 사용자의 모든 권한을 조회하고 계산
export const getUserPermissions = async (userId: number): Promise<UserPermissionResult | null> => {
  try {
    // 1. 사용자 기본 정보 조회
    const [users] = await sequelize.query(`
      SELECT id, userid, username, role, company_id
      FROM "user" 
      WHERE id = ? AND is_deleted = false
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    }) as any[];

    if (!users) {
      return null;
    }

    const user = users;

    // 2. 사용자의 메뉴별 권한 조회
    const menuPermissions = await sequelize.query(`
      SELECT 
        m.name as menu_name,
        m.url as menu_url,
        mp.can_read,
        mp.can_create,
        mp.can_update,
        mp.can_delete
      FROM menu_permission mp
      JOIN menu m ON mp.menu_id = m.menu_id
      WHERE mp.user_id = ?
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    }) as any[];

    // 3. 역할별 기본 권한 가져오기
    const rolePermissions = getDefaultPermissionsByRole(user.role);

    // 4. 메뉴별 최종 권한 계산
    const finalMenuPermissions: Record<string, RolePermissions> = {};

    // 모든 메뉴 조회
    const allMenus = await sequelize.query(`
      SELECT menu_id, name, url FROM menu ORDER BY order_num
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    // 각 메뉴에 대해 최종 권한 계산
    for (const menu of allMenus) {
      const menuPermission = menuPermissions.find(mp => mp.menu_name === menu.name);
      
      if (menuPermission) {
        // 메뉴별 권한이 있는 경우: 역할 권한 + 메뉴 권한 병합
        finalMenuPermissions[menu.name] = mergePermissions(rolePermissions, {
          can_read: menuPermission.can_read,
          can_create: menuPermission.can_create,
          can_update: menuPermission.can_update,
          can_delete: menuPermission.can_delete
        });
      } else {
        // 메뉴별 권한이 없는 경우
        if (user.role === 'root') {
          // root 사용자는 항상 모든 권한
          finalMenuPermissions[menu.name] = rolePermissions;
        } else {
          // 일반 사용자는 권한 없음 (관리자가 명시적으로 부여할 때까지)
          finalMenuPermissions[menu.name] = {
            can_read: false,
            can_create: false,
            can_update: false,
            can_delete: false
          };
        }
      }
    }

    // 5. 권한 체크 헬퍼 함수들
    const hasMenuAccess = (menuName: string, action: 'read' | 'create' | 'update' | 'delete'): boolean => {
      const menuPerm = finalMenuPermissions[menuName];
      if (!menuPerm) return false;

      switch (action) {
        case 'read': return menuPerm.can_read;
        case 'create': return menuPerm.can_create;
        case 'update': return menuPerm.can_update;
        case 'delete': return menuPerm.can_delete;
        default: return false;
      }
    };

    const canAccessRole = (targetRole: string): boolean => {
      return isHigherRole(user.role, targetRole) || user.role === targetRole;
    };

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      companyId: user.company_id,
      menuPermissions: finalMenuPermissions,
      hasMenuAccess,
      canAccessRole
    };

  } catch (error) {
    console.error('getUserPermissions 오류:', error);
    return null;
  }
};

// 빠른 권한 체크 (특정 메뉴만)
export const checkMenuPermission = async (
  userId: number, 
  menuName: string, 
  action: 'read' | 'create' | 'update' | 'delete'
): Promise<boolean> => {
  try {
    const userPerms = await getUserPermissions(userId);
    if (!userPerms) return false;
    
    return userPerms.hasMenuAccess(menuName, action);
  } catch (error) {
    console.error('checkMenuPermission 오류:', error);
    return false;
  }
};

// 역할 기반 접근 권한 체크
export const checkRoleAccess = async (userId: number, targetRole: string): Promise<boolean> => {
  try {
    const userPerms = await getUserPermissions(userId);
    if (!userPerms) return false;
    
    return userPerms.canAccessRole(targetRole);
  } catch (error) {
    console.error('checkRoleAccess 오류:', error);
    return false;
  }
};
