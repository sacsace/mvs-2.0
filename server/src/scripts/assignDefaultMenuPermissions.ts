import sequelize from '../config/database';
import User from '../models/User';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import { Op } from 'sequelize';

async function assignDefaultMenuPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 모든 활성 사용자 조회
    const users = await User.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'userid', 'username', 'role']
    });

    console.log(`총 ${users.length}명의 사용자를 찾았습니다.`);

    for (const user of users) {
      console.log(`\n사용자 ${user.userid} (${user.username}, ${user.role}) 처리 중...`);

      // 기존 메뉴 권한 확인
      const existingPermissions = await MenuPermission.findAll({
        where: { user_id: user.id }
      });

      if (existingPermissions.length > 0) {
        console.log(`  - 이미 ${existingPermissions.length}개의 메뉴 권한이 있음. 건너뜀.`);
        continue;
      }

      let menuIds: number[] = [];

      // 역할에 따른 기본 메뉴 권한 설정
      if (user.role === 'root') {
        // root는 모든 메뉴 접근 가능
        const allMenus = await Menu.findAll({
          attributes: ['menu_id'],
          raw: true
        });
        menuIds = allMenus.map((m: any) => m.menu_id);
        console.log(`  - Root 사용자: 모든 메뉴 (${menuIds.length}개) 권한 부여`);
      } else if (user.role === 'admin') {
        // admin은 기본 관리 메뉴 + 대시보드
        const adminMenus = await Menu.findAll({
          where: {
            [Op.or]: [
              { name: '대시보드' },
              { name: '사용자 관리' },
              { name: '권한 관리' },
              { name: '메뉴 관리' }
            ]
          },
          attributes: ['menu_id'],
          raw: true
        });
        menuIds = adminMenus.map((m: any) => m.menu_id);
        console.log(`  - Admin 사용자: 관리 메뉴 (${menuIds.length}개) 권한 부여`);
      } else {
        // 일반 사용자는 대시보드만
        const dashboardMenu = await Menu.findOne({
          where: { name: '대시보드' },
          attributes: ['menu_id'],
          raw: true
        });
        menuIds = dashboardMenu ? [dashboardMenu.menu_id] : [];
        console.log(`  - 일반 사용자: 대시보드 (${menuIds.length}개) 권한 부여`);
      }

      // 메뉴 권한 생성
      if (menuIds.length > 0) {
        const permissionData = menuIds.map(menuId => ({
          user_id: user.id,
          menu_id: menuId,
          can_read: true,
          can_create: user.role === 'root' || user.role === 'admin',
          can_update: user.role === 'root' || user.role === 'admin',
          can_delete: user.role === 'root',
          create_date: new Date()
        }));

        await MenuPermission.bulkCreate(permissionData);
        console.log(`  - 메뉴 권한 부여 완료: ${menuIds.length}개`);
      } else {
        console.log(`  - 부여할 메뉴가 없음`);
      }
    }

    console.log('\n모든 사용자의 기본 메뉴 권한 부여가 완료되었습니다.');
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

assignDefaultMenuPermissions(); 