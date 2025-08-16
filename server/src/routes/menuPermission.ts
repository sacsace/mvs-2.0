import { Router } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import MenuPermission from '../models/MenuPermission';
import { Op } from 'sequelize';
import { getUserPermissions } from '../utils/permissionChecker';

const router = Router();

// 특정 사용자의 메뉴 권한 조회 (새로운 권한 시스템 사용)
router.get('/user/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 사용자 ${userId}의 통합 권한 조회 시작`);
    
    // 새로운 권한 시스템을 사용하여 사용자의 전체 권한 조회
    const userPermissions = await getUserPermissions(parseInt(userId));
    
    if (!userPermissions) {
      console.log(`❌ 사용자 ${userId}의 권한 정보를 찾을 수 없음`);
      return res.json({
        success: false,
        data: [],
        message: '사용자 권한 정보를 찾을 수 없습니다.'
      });
    }

    console.log(`✅ 사용자 ${userPermissions.username} (${userPermissions.role})의 권한 조회 완료`);

    // 실제 메뉴 데이터를 조회하여 menu_id 매핑
    const allMenus = await require('../models/Menu').default.findAll({ raw: true });
    const menuMap = new Map(allMenus.map((menu: any) => [menu.name, menu]));

    // 메뉴 권한을 클라이언트가 기대하는 형식으로 변환
    const menuPermissionsArray = Object.entries(userPermissions.menuPermissions).map(([menuName, permission]) => {
      const menuData = menuMap.get(menuName) as any; // 타입 단언으로 해결
      
      return {
        menu_id: menuData?.menu_id || null,
        can_read: permission.can_read,
        can_create: permission.can_create,
        can_update: permission.can_update,
        can_delete: permission.can_delete,
        menu_info: {
          menu_id: menuData?.menu_id || null,
          name: menuName,
          parent_id: menuData?.parent_id || null,
          url: menuData?.url || null
        }
      };
    });

    console.log(`📊 총 ${menuPermissionsArray.length}개의 메뉴 권한 반환`);

    res.json({
      success: true,
      data: menuPermissionsArray
    });
  } catch (error) {
    console.error('메뉴 권한 조회 중 오류:', error);
    res.status(500).json({ 
      success: false,
      error: '메뉴 권한 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 특정 사용자의 메뉴 권한 저장
router.post('/user/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions = req.body;

    console.log('=== 메뉴 권한 저장 API 로그 ===');
    console.log('사용자 ID:', userId);
    console.log('받은 권한 데이터:', permissions);
    console.log('========================');

    // 기존 권한 삭제
    await MenuPermission.destroy({
      where: { user_id: userId }
    });

    console.log('기존 권한 삭제 완료');

    // 새로운 권한 추가 (빈 배열이 아닌 경우에만)
    if (permissions && permissions.length > 0) {
      const newPermissions = permissions.map((perm: any) => ({
        user_id: userId,
        menu_id: perm.menu_id,
        can_read: perm.can_read || false,
        can_create: perm.can_create || false,
        can_update: perm.can_update || false,
        can_delete: perm.can_delete || false,
        create_date: new Date()
      }));

      console.log('새로운 권한 데이터:', newPermissions);

      await MenuPermission.bulkCreate(newPermissions);
      console.log('새로운 권한 저장 완료');
    } else {
      console.log('저장할 권한이 없음');
    }

    res.json({ success: true, message: '메뉴 권한이 저장되었습니다.' });
  } catch (error) {
    console.error('메뉴 권한 저장 중 오류:', error);
    res.status(500).json({ error: '메뉴 권한 저장 중 오류가 발생했습니다.' });
  }
});

export default router; 