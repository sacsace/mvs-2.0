import sequelize from './src/config/database';
import User from './src/models/User';
import Menu from './src/models/Menu';
import MenuPermission from './src/models/MenuPermission';

const checkYdiPermissions = async () => {
  console.log('🔍 YDI 사용자 권한 확인...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // YDI 사용자 조회
    const ydiUser = await User.findOne({
      where: { userid: 'ydi' },
      attributes: ['id', 'userid', 'username', 'role', 'company_id']
    });

    if (!ydiUser) {
      console.log('❌ YDI 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log('👤 YDI 사용자 정보:', {
      id: ydiUser.id,
      userid: ydiUser.userid,
      username: ydiUser.username,
      role: ydiUser.role,
      company_id: ydiUser.company_id
    });

    // YDI의 메뉴 권한을 raw query로 확인
    const [ydiPermissions] = await sequelize.query(`
      SELECT mp.*, m.name as menu_name, m.url as menu_url
      FROM menu_permission mp
      LEFT JOIN menu m ON mp.menu_id = m.menu_id
      WHERE mp.user_id = ?
      ORDER BY mp.menu_id
    `, {
      replacements: [ydiUser.id]
    }) as any[];

    console.log(`\n📊 YDI의 메뉴 권한: ${ydiPermissions.length}개`);

    if (ydiPermissions.length === 0) {
      console.log('⚠️ YDI에게 메뉴 권한이 없습니다!');
    } else {
      console.log('\n📋 권한 목록:');
      ydiPermissions.forEach((perm: any, index: number) => {
        const menuName = perm.menu_name || 'Unknown Menu';
        const permissions = [
          perm.can_read ? 'R' : '-',
          perm.can_create ? 'C' : '-', 
          perm.can_update ? 'U' : '-',
          perm.can_delete ? 'D' : '-'
        ].join('');
        console.log(`  ${index + 1}. ${menuName} (${permissions})`);
      });

      // 회사 정보 관리 메뉴 권한 특별 확인
      const companyPermission = ydiPermissions.find((perm: any) => 
        perm.menu_name === '회사 정보 관리' || 
        perm.menu_name === 'Company Information' ||
        perm.menu_url === '/company'
      );

      console.log('\n🏢 회사 정보 관리 권한:');
      if (companyPermission) {
        console.log(`  - 조회(can_read): ${companyPermission.can_read}`);
        console.log(`  - 생성(can_create): ${companyPermission.can_create}`);
        console.log(`  - 수정(can_update): ${companyPermission.can_update} ${companyPermission.can_update ? '✅' : '❌'}`);
        console.log(`  - 삭제(can_delete): ${companyPermission.can_delete}`);
      } else {
        console.log('  ❌ 회사 정보 관리 메뉴 권한이 없습니다!');
      }
    }

    // 총 메뉴 개수와 비교
    const totalMenus = await Menu.count();
    console.log(`\n📈 권한 상태: ${ydiPermissions.length}/${totalMenus} 메뉴에 권한 보유`);

    if (ydiPermissions.length < totalMenus) {
      console.log('\n💡 해결책: YDI 사용자에게 모든 메뉴 권한을 부여하려면:');
      console.log('   npx ts-node fix_ydi_permissions_local.ts');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
};

checkYdiPermissions();
