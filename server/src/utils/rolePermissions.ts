// 역할별 기본 권한 정의
export interface RolePermissions {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
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
  
  // 4. User - 메뉴별로 다름 (기본값: 권한 없음)
  'user': {
    can_read: false,
    can_create: false,
    can_update: false,
    can_delete: false
  }
};

// 메뉴별 사용자 기본 권한 (user 역할만 해당)
export const MENU_SPECIFIC_USER_PERMISSIONS: Record<string, RolePermissions> = {
  // 회사 정보 관리 - 조회만
  '회사 정보 관리': {
    can_read: true,
    can_create: false,
    can_update: false,
    can_delete: false
  },
  
  // 전자결재 - 조회, 생성, 수정
  '전자결재': {
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: false
  },
  
  // 전자 결재 (다른 표기)
  '전자 결재': {
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: false
  }
};

// 역할 계층 구조 (높은 숫자가 더 높은 권한)
export const ROLE_HIERARCHY: Record<string, number> = {
  'root': 4,
  'audit': 3,
  'admin': 2,
  'user': 1
};

// 역할별 기본 권한 가져오기
export const getDefaultPermissionsByRole = (role: string, menuName?: string): RolePermissions => {
  // user 역할이고 메뉴명이 제공된 경우, 메뉴별 권한 확인
  if (role === 'user' && menuName && MENU_SPECIFIC_USER_PERMISSIONS[menuName]) {
    return MENU_SPECIFIC_USER_PERMISSIONS[menuName];
  }
  
  return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['user'];
};

// 두 권한을 병합 (메뉴 권한이 역할 권한을 오버라이드)
export const mergePermissions = (
  rolePermissions: RolePermissions,
  menuPermissions?: Partial<RolePermissions>
): RolePermissions => {
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

// 역할 레벨 확인
export const getRoleLevel = (role: string): number => {
  return ROLE_HIERARCHY[role] || 0;
};

// 상위 역할인지 확인
export const isHigherRole = (userRole: string, targetRole: string): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
};

// 접근 가능한 하위 역할들 반환
export const getAccessibleRoles = (userRole: string): string[] => {
  const userLevel = getRoleLevel(userRole);
  return Object.keys(ROLE_HIERARCHY).filter(role => 
    ROLE_HIERARCHY[role] <= userLevel
  );
};
