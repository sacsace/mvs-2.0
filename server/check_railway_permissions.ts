import sequelize from './src/config/database';
import User from './src/models/User';
import Menu from './src/models/Menu';
import MenuPermission from './src/models/MenuPermission';

const checkRailwayPermissions = async () => {
  console.log('🔍 Railway 메뉴 권한 상태 확인...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // Jinwoo Lee 사용자 조회
    const user = await User.findOne({
      where: { username: 'Jinwoo Lee' },
      attributes: ['id', 'userid', 'username', 'role', 'company_id']
    });

    if (!user) {
      console.log('❌ Jinwoo Lee 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log('👤 사용자 정보:', {
      id: user.id,
      userid: user.userid,
      username: user.username,
      role: user.role,
      company_id: user.company_id
    });

    // 사용자의 메뉴 권한 확인
    const userPermissions = await MenuPermission.findAll({
      where: { user_id: user.id },
      include: [{
        model: Menu,
        attributes: ['menu_id', 'name', 'url']
      }]
    });

    console.log(`📊 ${user.username}의 메뉴 권한: ${userPermissions.length}개`);

    if (userPermissions.length === 0) {
      console.log('⚠️ 메뉴 권한이 없습니다! 권한을 부여합니다...');
      
      // 모든 메뉴 조회
      const allMenus = await Menu.findAll({
        attributes: ['menu_id', 'name']
      });

      console.log(`📋 총 메뉴 개수: ${allMenus.length}개`);

      // 권한 생성 (admin 역할이므로 delete 제외)
      const permissions = allMenus.map(menu => ({
        user_id: user.id,
        menu_id: menu.menu_id,
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: false, // admin은 delete 권한 제외
        create_date: new Date()
      }));

      await MenuPermission.bulkCreate(permissions);
      console.log(`✅ ${user.username}에게 ${permissions.length}개 메뉴 권한 부여 완료!`);
    } else {
      console.log('📋 기존 권한 목록:');
      userPermissions.forEach((perm, index) => {
        console.log(`  ${index + 1}. ${perm.Menu?.name} (${perm.can_read ? 'R' : ''}${perm.can_create ? 'C' : ''}${perm.can_update ? 'U' : ''}${perm.can_delete ? 'D' : ''})`);
      });
    }

    // 최종 권한 상태 확인
    const finalPermissions = await MenuPermission.count({
      where: { user_id: user.id }
    });

    console.log(`🎉 최종 결과: ${user.username}님이 ${finalPermissions}개 메뉴에 접근 가능합니다.`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
};

checkRailwayPermissions();
