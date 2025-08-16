import sequelize from './src/config/database';
import { QueryTypes } from 'sequelize';
import { getUserPermissions } from './src/utils/permissionChecker';

const testNewPermissionSystem = async () => {
  console.log('🧪 새로운 권한 시스템 테스트 시작...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // YDI 사용자 찾기
    const [ydiUser] = await sequelize.query(`
      SELECT id, userid, username, role, company_id
      FROM "user" 
      WHERE userid = 'ydi' AND is_deleted = false
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    if (!ydiUser) {
      console.log('❌ YDI 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log('👤 YDI 사용자 정보:', ydiUser);

    // 새로운 권한 시스템으로 YDI 권한 조회
    const userPermissions = await getUserPermissions(ydiUser.id);
    
    if (!userPermissions) {
      console.log('❌ 사용자 권한을 가져올 수 없습니다.');
      return;
    }

    console.log('\n📊 YDI 권한 시스템 분석:');
    console.log(`역할: ${userPermissions.role}`);
    console.log(`사용자 ID: ${userPermissions.userId}`);
    console.log(`회사 ID: ${userPermissions.companyId}`);

    // 회사 정보 관리 권한 확인
    const companyMenus = ['회사 정보 관리', 'Company Information', '회사정보관리'];
    
    console.log('\n🏢 회사 정보 관리 권한 분석:');
    
    for (const menuName of companyMenus) {
      const menuPerm = userPermissions.menuPermissions[menuName];
      if (menuPerm) {
        console.log(`\n📋 ${menuName}:`);
        console.log(`  - 조회: ${menuPerm.can_read ? '✅' : '❌'}`);
        console.log(`  - 생성: ${menuPerm.can_create ? '✅' : '❌'}`);
        console.log(`  - 수정: ${menuPerm.can_update ? '✅' : '❌'} ${menuPerm.can_update ? '← 이것이 중요!' : '← 문제!'}`);
        console.log(`  - 삭제: ${menuPerm.can_delete ? '✅' : '❌'}`);
        break;
      }
    }

    // 모든 메뉴 권한 요약
    console.log('\n📋 모든 메뉴 권한 요약:');
    let updateCount = 0;
    let totalMenus = 0;
    
    for (const [menuName, perm] of Object.entries(userPermissions.menuPermissions)) {
      totalMenus++;
      if (perm.can_update) updateCount++;
      
      if (menuName.includes('회사') || menuName.includes('Company')) {
        console.log(`  📄 ${menuName}: R:${perm.can_read?'✅':'❌'} C:${perm.can_create?'✅':'❌'} U:${perm.can_update?'✅':'❌'} D:${perm.can_delete?'✅':'❌'}`);
      }
    }
    
    console.log(`\n📈 권한 통계: ${updateCount}/${totalMenus} 메뉴에서 수정 권한 보유`);

    // 권한 체크 함수 테스트
    console.log('\n🔍 권한 체크 함수 테스트:');
    const canUpdateCompany = userPermissions.hasMenuAccess('회사 정보 관리', 'update');
    console.log(`회사 정보 관리 수정 권한: ${canUpdateCompany ? '✅ 가능' : '❌ 불가능'}`);

    // 역할 기반 권한 확인
    console.log('\n🎭 역할 기반 기본 권한:');
    const adminBasePermissions = {
      can_read: true,
      can_create: true,
      can_update: true,
      can_delete: false
    };
    console.log('Admin 기본 권한:', adminBasePermissions);
    console.log(`YDI(${userPermissions.role})는 admin이므로 기본적으로 수정 권한이 있어야 함`);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    await sequelize.close();
  }
};

testNewPermissionSystem();
