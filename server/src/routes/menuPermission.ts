import { Router } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import MenuPermission from '../models/MenuPermission';
import { Op } from 'sequelize';

const router = Router();

// 특정 사용자의 메뉴 권한 조회
router.get('/user/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions = await MenuPermission.findAll({
      where: { user_id: userId },
      include: [{
        model: require('../models/Menu').default,
        as: 'menu_info',
        attributes: ['menu_id', 'name', 'parent_id', 'url']
      }],
      order: [['menu_id', 'ASC']]
    });
    res.json(permissions);
  } catch (error) {
    console.error('메뉴 권한 조회 중 오류:', error);
    res.status(500).json({ error: '메뉴 권한 조회 중 오류가 발생했습니다.' });
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