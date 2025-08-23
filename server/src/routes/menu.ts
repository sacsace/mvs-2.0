import { Router } from 'express';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import User from '../models/User';
import { Op } from 'sequelize';
import type { Request } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import { getUserPermissions } from '../utils/permissionChecker';

// Request 인터페이스는 jwtMiddleware.ts에서 확장됨

const router = Router();

// 계층 구조로 변환하는 함수
function buildMenuTree(menus: any[], parentId: number | null = null): any[] {
  return menus
    .filter(menu => menu.parent_id === parentId)
    .map(menu => ({
      ...menu,
      children: buildMenuTree(menus, menu.menu_id)
    }));
}

// 메뉴 트리 조회 (관리자용)
router.get('/tree', authenticateJWT, async (req, res) => {
  try {
    console.log('메뉴 트리 API 호출됨');
    console.log('사용자 정보:', (req as any).user);
    
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    console.log('사용자 역할:', userRole);
    
    // admin 또는 root만 접근 가능
    if (userRole !== 'admin' && userRole !== 'root') {
      console.log('권한 없음 - 역할:', userRole);
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    console.log('메뉴 데이터 조회 시작');
    
    let menus;
    
    if (userRole === 'root') {
      // Root는 모든 메뉴 접근 가능
      console.log('Root 사용자: 모든 메뉴 조회');
      menus = await Menu.findAll({
        order: [['order_num', 'ASC']],
        raw: true
      });
    } else {
      // Admin은 자신이 접근 가능한 메뉴만 조회
      console.log(`Admin 사용자(${userId}): 권한이 있는 메뉴만 조회`);
      
      // 사용자의 메뉴 권한 조회
      const menuPermissions = await MenuPermission.findAll({
        where: { user_id: userId },
        attributes: ['menu_id', 'can_read', 'can_create', 'can_update', 'can_delete']
      });

      // 읽기 권한이 있는 메뉴만 필터링
      const readableMenuPermissions = menuPermissions.filter(mp => Boolean(mp.can_read));
      const menuIds = readableMenuPermissions.map(mp => mp.menu_id);
      console.log(`읽기 권한이 있는 메뉴 ID:`, menuIds);

      if (menuIds.length === 0) {
        console.log('읽기 권한이 있는 메뉴가 없음');
        return res.json({
          success: true,
          data: []
        });
      }

      // 권한이 있는 메뉴만 조회
      menus = await Menu.findAll({
        where: {
          menu_id: {
            [Op.in]: menuIds
          }
        },
        order: [['order_num', 'ASC']],
        raw: true
      });
    }
    
    console.log('조회된 메뉴 개수:', menus.length);

    const menuTree = buildMenuTree(menus);
    console.log('메뉴 트리 생성 완료');
    
    res.json({
      success: true,
      data: menuTree
    });
  } catch (error) {
    console.error('메뉴 트리 조회 중 오류:', error);
    res.status(500).json({ error: '메뉴 트리 조회 중 오류가 발생했습니다.' });
  }
});



// 메뉴 생성
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    // root만 메뉴 생성 가능
    if (userRole !== 'root') {
      return res.status(403).json({ error: '메뉴 생성은 시스템 관리자(root)만 가능합니다.' });
    }

    const { name, name_en, icon, order_num, parent_id, url } = req.body;
    
    const newMenu = await Menu.create({
      name,
      name_en: name_en || name, // 영문명이 없으면 한글명을 기본값으로 사용
      icon,
      order_num,
      parent_id,
      url
    });

    res.json({
      success: true,
      message: '메뉴가 성공적으로 생성되었습니다.',
      data: newMenu
    });
  } catch (error) {
    console.error('메뉴 생성 중 오류:', error);
    res.status(500).json({ error: '메뉴 생성 중 오류가 발생했습니다.' });
  }
});

// 메뉴 수정
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    // root만 메뉴 수정 가능
    if (userRole !== 'root') {
      return res.status(403).json({ error: '메뉴 수정은 시스템 관리자(root)만 가능합니다.' });
    }

    const { id } = req.params;
    const { name, name_en, icon, order_num, parent_id, url } = req.body;
    
    console.log('=== 메뉴 수정 API 로그 ===');
    console.log('요청 데이터:', req.body);
    console.log('영문명 값:', name_en);
    console.log('========================');
    
    const menu = await Menu.findByPk(id);
    if (!menu) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }
    
    await menu.update({ name, name_en, icon, order_num, parent_id, url });
    
    res.json({
      success: true,
      message: '메뉴가 성공적으로 수정되었습니다.',
      data: menu
    });
  } catch (error) {
    console.error('메뉴 수정 중 오류:', error);
    res.status(500).json({ error: '메뉴 수정 중 오류가 발생했습니다.' });
  }
});

// 메뉴 삭제
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    // root만 메뉴 삭제 가능
    if (userRole !== 'root') {
      return res.status(403).json({ error: '메뉴 삭제는 시스템 관리자(root)만 가능합니다.' });
    }

    const { id } = req.params;
    
    const menu = await Menu.findByPk(id);
    if (!menu) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }

    // 하위 메뉴가 있는지 확인
    const childMenus = await Menu.findAll({
      where: { parent_id: id }
    });

    if (childMenus.length > 0) {
      return res.status(400).json({ 
        error: '하위 메뉴가 있는 메뉴는 삭제할 수 없습니다. 먼저 하위 메뉴를 삭제해주세요.' 
      });
    }

    // 관련 권한도 함께 삭제
    await MenuPermission.destroy({
      where: { menu_id: id }
    });

    await menu.destroy();
    
    res.json({
      success: true,
      message: '메뉴가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('메뉴 삭제 중 오류:', error);
    res.status(500).json({ error: '메뉴 삭제 중 오류가 발생했습니다.' });
  }
});

// 메뉴 순서 변경 (위로)
router.put('/:id/move-up', authenticateJWT, async (req, res) => {
  try {
    console.log('=== 메뉴 위로 이동 API 호출 ===');
    console.log('요청 파라미터:', req.params);
    console.log('사용자 역할:', (req as any).user?.role);
    
    const userRole = (req as any).user?.role;
    
    // root만 메뉴 순서 변경 가능
    if (userRole !== 'root') {
      console.log('권한 없음:', userRole);
      return res.status(403).json({ error: '메뉴 순서 변경은 시스템 관리자(root)만 가능합니다.' });
    }

    const { id } = req.params;
    console.log('이동할 메뉴 ID:', id);
    
    const currentMenu = await Menu.findByPk(id);
    if (!currentMenu) {
      console.log('메뉴를 찾을 수 없음:', id);
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }

    console.log('현재 메뉴:', {
      menu_id: currentMenu.menu_id,
      name: currentMenu.name,
      parent_id: currentMenu.parent_id,
      order_num: currentMenu.order_num
    });

    // 같은 부모를 가진 메뉴들 중에서 현재 메뉴보다 순서가 낮은 메뉴 찾기
    const previousMenu = await Menu.findOne({
      where: {
        parent_id: currentMenu.parent_id,
        order_num: {
          [Op.lt]: currentMenu.order_num
        }
      },
      order: [['order_num', 'DESC']]
    });

    if (!previousMenu) {
      console.log('위로 이동할 메뉴가 없음');
      return res.status(400).json({ error: '더 이상 위로 이동할 수 없습니다.' });
    }

    console.log('이전 메뉴:', {
      menu_id: previousMenu.menu_id,
      name: previousMenu.name,
      parent_id: previousMenu.parent_id,
      order_num: previousMenu.order_num
    });

    // 순서 교환
    const tempOrder = currentMenu.order_num;
    await currentMenu.update({ order_num: previousMenu.order_num });
    await previousMenu.update({ order_num: tempOrder });
    
    console.log('순서 교환 완료');
    
    res.json({
      success: true,
      message: '메뉴 순서가 변경되었습니다.'
    });
  } catch (error) {
    console.error('메뉴 순서 변경 중 오류:', error);
    res.status(500).json({ error: '메뉴 순서 변경 중 오류가 발생했습니다.' });
  }
});

// 메뉴 순서 변경 (아래로)
router.put('/:id/move-down', authenticateJWT, async (req, res) => {
  try {
    console.log('=== 메뉴 아래로 이동 API 호출 ===');
    console.log('요청 파라미터:', req.params);
    console.log('사용자 역할:', (req as any).user?.role);
    
    const userRole = (req as any).user?.role;
    
    // root만 메뉴 순서 변경 가능
    if (userRole !== 'root') {
      console.log('권한 없음:', userRole);
      return res.status(403).json({ error: '메뉴 순서 변경은 시스템 관리자(root)만 가능합니다.' });
    }

    const { id } = req.params;
    console.log('이동할 메뉴 ID:', id);
    
    const currentMenu = await Menu.findByPk(id);
    if (!currentMenu) {
      console.log('메뉴를 찾을 수 없음:', id);
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }

    console.log('현재 메뉴:', {
      menu_id: currentMenu.menu_id,
      name: currentMenu.name,
      parent_id: currentMenu.parent_id,
      order_num: currentMenu.order_num
    });

    // 같은 부모를 가진 메뉴들 중에서 현재 메뉴보다 순서가 높은 메뉴 찾기
    const nextMenu = await Menu.findOne({
      where: {
        parent_id: currentMenu.parent_id,
        order_num: {
          [Op.gt]: currentMenu.order_num
        }
      },
      order: [['order_num', 'ASC']]
    });

    if (!nextMenu) {
      console.log('아래로 이동할 메뉴가 없음');
      return res.status(400).json({ error: '더 이상 아래로 이동할 수 없습니다.' });
    }

    console.log('다음 메뉴:', {
      menu_id: nextMenu.menu_id,
      name: nextMenu.name,
      parent_id: nextMenu.parent_id,
      order_num: nextMenu.order_num
    });

    // 순서 교환
    const tempOrder = currentMenu.order_num;
    await currentMenu.update({ order_num: nextMenu.order_num });
    await nextMenu.update({ order_num: tempOrder });
    
    console.log('순서 교환 완료');
    
    res.json({
      success: true,
      message: '메뉴 순서가 변경되었습니다.'
    });
  } catch (error) {
    console.error('메뉴 순서 변경 중 오류:', error);
    res.status(500).json({ error: '메뉴 순서 변경 중 오류가 발생했습니다.' });
  }
});

// 사용자별 메뉴 권한 조회
router.get('/permissions/:userId', authenticateJWT, async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    // admin 또는 root만 접근 가능
    if (userRole !== 'admin' && userRole !== 'root') {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    const { userId } = req.params;
    
    const permissions = await MenuPermission.findAll({
      where: { user_id: userId },
      include: [{
        model: Menu,
        as: 'menu_info',
        attributes: ['menu_id', 'name', 'icon', 'order_num']
      }],
      order: [[Menu, 'order_num', 'ASC']]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('사용자 권한 조회 중 오류:', error);
    res.status(500).json({ error: '사용자 권한 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자별 메뉴 권한 부여/수정
router.post('/permissions/:userId', authenticateJWT, async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    // admin 또는 root만 접근 가능
    if (userRole !== 'admin' && userRole !== 'root') {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    const { userId } = req.params;
    const { permissions } = req.body; // [{menu_id, can_read, can_create, can_update, can_delete}]

    // 사용자 존재 확인
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 기존 권한 삭제
    await MenuPermission.destroy({
      where: { user_id: userId }
    });

    // 새 권한 생성
    const permissionData = permissions.map((perm: any) => ({
      user_id: userId,
      menu_id: perm.menu_id,
      can_read: perm.can_read || false,
      can_create: perm.can_create || false,
      can_update: perm.can_update || false,
      can_delete: perm.can_delete || false
    }));

    await MenuPermission.bulkCreate(permissionData);

    res.json({
      success: true,
      message: '사용자 권한이 성공적으로 설정되었습니다.'
    });
  } catch (error) {
    console.error('사용자 권한 설정 중 오류:', error);
    res.status(500).json({ error: '사용자 권한 설정 중 오류가 발생했습니다.' });
  }
});

// 모든 사용자 목록 조회 (권한 부여용)
router.get('/users', authenticateJWT, async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    // admin 또는 root만 접근 가능
    if (userRole !== 'admin' && userRole !== 'root') {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    const users = await User.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'username', 'role', 'company_id'],
      order: [['username', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('사용자 목록 조회 중 오류:', error);
    res.status(500).json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자의 권한에 따른 메뉴 목록 조회 (새로운 권한 시스템 사용)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    console.log(`사용자 ${userId}의 메뉴 조회 시작`);

    // 새로운 권한 시스템을 사용하여 사용자의 전체 권한 조회
    const userPermissions = await getUserPermissions(userId);
    
    if (!userPermissions) {
      console.log(`사용자 ${userId}의 권한 정보를 찾을 수 없음`);
      return res.json({
        success: true,
        data: []
      });
    }

    console.log(`사용자 ${userPermissions.username} (${userPermissions.role})의 권한 조회 완료`);

    // 읽기 권한이 있는 메뉴 필터링
    const readableMenus = Object.entries(userPermissions.menuPermissions)
      .filter(([menuName, permission]) => permission.can_read)
      .map(([menuName]) => menuName);

    console.log(`읽기 권한이 있는 메뉴: [${readableMenus.join(', ')}]`);

    // 읽기 권한이 있는 메뉴가 없는 경우
    if (readableMenus.length === 0) {
      console.log(`사용자 ${userId}에게 읽기 권한이 있는 메뉴가 없음`);
      return res.json({
        success: true,
        data: []
      });
    }

    // 실제 메뉴 데이터 조회
    const menus = await Menu.findAll({
      where: {
        name: {
          [Op.in]: readableMenus
        }
      },
      order: [['order_num', 'ASC']],
      raw: true
    });

    console.log(`조회된 메뉴 수: ${menus.length}`);

    const menuTree = buildMenuTree(menus);
    res.json({
      success: true,
      data: menuTree
    });
  } catch (error) {
    console.error('메뉴 조회 중 오류:', error);
    res.status(500).json({ error: '메뉴 조회 중 오류가 발생했습니다.' });
  }
});

export default router; 