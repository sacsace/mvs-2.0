import sequelize from '../config/database';
import User from '../models/User';
import Company from '../models/Company';
import MenuPermission from '../models/MenuPermission';
import Menu from '../models/Menu';

async function clearUsersOnly() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 현재 상태 확인
    console.log('\n📊 삭제 전 현재 상태:');
    const userCount = await User.count();
    const companyCount = await Company.count();
    const menuCount = await Menu.count();
    const permissionCount = await MenuPermission.count();
    
    console.log(`사용자: ${userCount}개`);
    console.log(`회사: ${companyCount}개`);
    console.log(`메뉴: ${menuCount}개 (보존됨)`);
    console.log(`메뉴 권한: ${permissionCount}개`);

    // 삭제 확인
    if (userCount === 0 && companyCount === 0) {
      console.log('⚠️  삭제할 사용자 데이터가 없습니다.');
      return;
    }

    console.log('\n🗑️  사용자 관련 데이터 삭제 시작...');
    
    // 트랜잭션으로 안전하게 삭제
    const transaction = await sequelize.transaction();

    try {
      // 1. 메뉴 권한 삭제 (사용자와 연결된 권한)
      console.log('🔐 사용자별 메뉴 권한 삭제 중...');
      const deletedPermissions = await MenuPermission.destroy({ 
        where: {}, 
        force: true, 
        transaction 
      });
      console.log(`  ✅ ${deletedPermissions}개 권한 삭제 완료`);

      // 2. 사용자 삭제
      console.log('👥 사용자 데이터 삭제 중...');
      const deletedUsers = await User.destroy({ 
        where: {}, 
        force: true, 
        transaction 
      });
      console.log(`  ✅ ${deletedUsers}개 사용자 삭제 완료`);

      // 3. 회사 삭제
      console.log('🏢 회사 데이터 삭제 중...');
      const deletedCompanies = await Company.destroy({ 
        where: {}, 
        force: true, 
        transaction 
      });
      console.log(`  ✅ ${deletedCompanies}개 회사 삭제 완료`);

      await transaction.commit();
      console.log('✅ 트랜잭션 커밋 완료');

      // 삭제 후 상태 확인
      console.log('\n📊 삭제 후 현재 상태:');
      const finalUserCount = await User.count();
      const finalCompanyCount = await Company.count();
      const finalMenuCount = await Menu.count();
      const finalPermissionCount = await MenuPermission.count();
      
      console.log(`사용자: ${finalUserCount}개`);
      console.log(`회사: ${finalCompanyCount}개`);
      console.log(`메뉴: ${finalMenuCount}개 (보존됨) ✅`);
      console.log(`메뉴 권한: ${finalPermissionCount}개`);

      // 메뉴 데이터 보존 확인
      if (finalMenuCount > 0) {
        console.log('\n🎯 보존된 메뉴 구조:');
        console.log('==================');
        
        const topLevelMenus = await Menu.findAll({ 
          where: { parent_id: null },
          order: [['order_num', 'ASC']]
        });

        for (const topMenu of topLevelMenus) {
          console.log(`📁 ${topMenu.name} (${topMenu.name_en})`);
          
          const subMenus = await Menu.findAll({
            where: { parent_id: topMenu.menu_id },
            order: [['order_num', 'ASC']]
          });
          
          for (const subMenu of subMenus) {
            console.log(`   └── 📄 ${subMenu.name} → ${subMenu.url}`);
          }
        }
      }

      console.log('\n🎉 사용자 데이터 삭제 완료!');
      console.log('💡 이제 새로운 초기화를 진행할 수 있습니다.');
      console.log('🔗 URL: http://localhost:3000/init (로컬) 또는 프로덕션 URL/init');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ 트랜잭션 롤백됨:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ 사용자 데이터 삭제 실패:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  clearUsersOnly()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export default clearUsersOnly;
