import { useState, useEffect } from 'react';
import axios from 'axios';

interface MenuPermission {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface User {
  id: number;
  role: string;
  company_id: number;
}

export const useMenuPermission = (menuName: string) => {
  const [permission, setPermission] = useState<MenuPermission>({
    can_read: false,
    can_create: false,
    can_update: false,
    can_delete: false
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/users/me');
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('현재 사용자 정보를 불러오는데 실패했습니다:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchMenuPermission = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // root는 모든 권한 있음
        if (currentUser.role === 'root') {
          setPermission({
            can_read: true,
            can_create: true,
            can_update: true,
            can_delete: true
          });
          return;
        }

        const response = await axios.get(`/api/menu-permissions/user/${currentUser.id}`);
        if (response.data.success) {
          // 해당 메뉴의 권한 찾기
          const menuPermission = response.data.data.find((perm: any) => 
            perm.menu_info && perm.menu_info.name === menuName
          );
          
          if (menuPermission) {
            setPermission({
              can_read: menuPermission.can_read,
              can_create: menuPermission.can_create,
              can_update: menuPermission.can_update,
              can_delete: menuPermission.can_delete
            });
          } else {
            // 권한이 없으면 모든 권한을 false로 설정
            setPermission({
              can_read: false,
              can_create: false,
              can_update: false,
              can_delete: false
            });
          }
        }
      } catch (error) {
        console.error('메뉴 권한 정보를 불러오는데 실패했습니다:', error);
        setPermission({
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchMenuPermission();
    }
  }, [currentUser, menuName]);

  return {
    permission,
    loading,
    currentUser
  };
};

// 역할 계층구조 정의
const roleHierarchy = {
  'root': 4,
  'admin': 3,
  'audit': 3, // admin과 같은 레벨
  'user': 1
};

// 역할 계층구조에 따른 선택 가능한 역할 목록 반환
export const getAvailableRoles = (currentUserRole: string): string[] => {
  switch (currentUserRole) {
    case 'root':
      return ['admin', 'audit', 'user'];
    case 'admin':
      return ['user'];
    case 'audit':
      return ['user'];
    case 'user':
    default:
      return []; // user는 다른 사용자 생성/수정 불가
  }
};

// 현재 사용자보다 낮은 권한의 사용자들만 필터링
export const filterUsersByPermission = (users: any[], currentUserRole: string): any[] => {
  const currentUserLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy] || 0;
  
  return users.filter(user => {
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    
    // root는 모든 사용자를 볼 수 있음
    if (currentUserRole === 'root') {
      return userLevel < currentUserLevel; // admin(3), audit(3), user(1) 모두 4보다 작음
    }
    
    // admin과 audit는 user만 볼 수 있음
    if (currentUserRole === 'admin' || currentUserRole === 'audit') {
      return user.role === 'user';
    }
    
    // user는 아무도 볼 수 없음
    return false;
  });
};

// 역할의 권한 레벨 반환
export const getRoleLevel = (role: string): number => {
  return roleHierarchy[role as keyof typeof roleHierarchy] || 0;
};
