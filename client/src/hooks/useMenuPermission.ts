import { useState, useEffect } from 'react';
import axios from 'axios';

export interface MenuPermission {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface User {
  id: number;
  userid?: string;
  username: string;
  role: string;
  company_id: number;
}

// 역할별 기본 권한 정의
const DEFAULT_ROLE_PERMISSIONS: Record<string, MenuPermission> = {
  // 1. Root - 모든 권한
  'root': {
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true
  },
  
  // 2. Audit - 조회, 생성, 수정 (삭제 제외)
  'audit': {
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: false
  },
  
  // 3. Administrator - 조회, 생성, 수정 (삭제 제외)
  'admin': {
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: false
  },
  
  // 4. User - 조회만 가능
  'user': {
    can_read: true,
    can_create: false,
    can_update: false,
    can_delete: false
  }
};

// 역할 계층 구조 정의 (숫자가 클수록 높은 권한)
const roleHierarchy: Record<string, number> = {
  root: 4,
  audit: 3,
  admin: 2,
  user: 1
};

// 역할 레벨 가져오기 함수
export const getRoleLevel = (role: string): number => {
  return roleHierarchy[role] || 0;
};

// 역할별 기본 권한 가져오기
export const getDefaultPermissionsByRole = (role: string): MenuPermission => {
  return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['user'];
};

// 두 권한을 병합 (메뉴 권한이 역할 권한을 오버라이드)
export const mergePermissions = (
  rolePermissions: MenuPermission,
  menuPermissions?: Partial<MenuPermission>
): MenuPermission => {
  if (!menuPermissions) {
    return rolePermissions;
  }

  return {
    can_read: menuPermissions.can_read ?? rolePermissions.can_read,
    can_create: menuPermissions.can_create ?? rolePermissions.can_create,
    can_update: menuPermissions.can_update ?? rolePermissions.can_update,
    can_delete: menuPermissions.can_delete ?? rolePermissions.can_delete
  };
};

// 권한에 따라 사용자 필터링
export const filterUsersByPermission = (users: User[], currentUser: User): User[] => {
  if (!currentUser) return [];
  
  const currentUserLevel = getRoleLevel(currentUser.role);
  
  return users.filter(user => {
    const userLevel = getRoleLevel(user.role);
    // 현재 사용자보다 낮거나 같은 레벨의 사용자만 표시
    return userLevel <= currentUserLevel;
  });
};

// 현재 사용자가 선택할 수 있는 역할들 반환
export const getAvailableRoles = (currentUserRole: string): string[] => {
  const currentUserLevel = getRoleLevel(currentUserRole);
  
  const allRoles = Object.keys(roleHierarchy);
  return allRoles.filter(role => {
    const roleLevel = getRoleLevel(role);
    // 현재 사용자보다 낮거나 같은 레벨의 역할만 선택 가능
    return roleLevel <= currentUserLevel;
  });
};

// 새로운 통합 권한 시스템 훅
export const useMenuPermission = (menuName: string) => {
  const [permission, setPermission] = useState<MenuPermission>({
    can_read: false,
    can_create: false,
    can_update: false,
    can_delete: false,
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndPermissions = async () => {
      try {
        setLoading(true);
        
        // 1. 현재 사용자 정보 가져오기
        const userResponse = await axios.get('/api/users/me');
        const userData = userResponse.data.user;
        setCurrentUser(userData);

        if (!userData?.id || !userData?.role) {
          console.log('사용자 정보가 없습니다.');
          setLoading(false);
          return;
        }

        // 2. 역할 기반 기본 권한 가져오기
        const rolePermissions = getDefaultPermissionsByRole(userData.role);
        console.log(`🔑 ${userData.role} 역할의 기본 권한:`, rolePermissions);

        try {
          // 3. 메뉴별 세부 권한 조회
          const menuResponse = await axios.get(`/api/menu-permissions/user/${userData.id}`);
          
          if (menuResponse.data.success) {
            // 해당 메뉴의 권한 찾기
            const menuPermission = menuResponse.data.data.find((perm: any) => 
              perm.menu_info && perm.menu_info.name === menuName
            );
            
            if (menuPermission) {
              // 메뉴 권한이 있는 경우: 역할 권한 + 메뉴 권한 병합
              const finalPermission = mergePermissions(rolePermissions, {
                can_read: menuPermission.can_read,
                can_create: menuPermission.can_create,
                can_update: menuPermission.can_update,
                can_delete: menuPermission.can_delete
              });
              console.log(`📋 ${menuName} 최종 권한 (역할+메뉴):`, finalPermission);
              setPermission(finalPermission);
            } else {
              // 메뉴 권한이 없는 경우: 역할 기본 권한 사용
              console.log(`📋 ${menuName} 메뉴 권한 없음, 역할 기본 권한 사용:`, rolePermissions);
              setPermission(rolePermissions);
            }
          } else {
            // 메뉴 권한 조회 실패 시 역할 기본 권한 사용
            console.log(`📋 ${menuName} 메뉴 권한 조회 실패, 역할 기본 권한 사용:`, rolePermissions);
            setPermission(rolePermissions);
          }
        } catch (menuError) {
          console.error('메뉴 권한 조회 실패, 역할 기본 권한 사용:', menuError);
          // 메뉴 권한 조회 실패 시 역할 기본 권한 사용
          setPermission(rolePermissions);
        }
      } catch (error) {
        console.error('사용자 권한 초기화 실패:', error);
        setPermission({
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPermissions();
  }, [menuName]);

  return { permission, currentUser, loading };
};