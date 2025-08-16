import sequelize from './src/config/database';
import Menu from './src/models/Menu';
import MenuPermission from './src/models/MenuPermission';
import User from './src/models/User';

async function createSimplifiedMenus() {
  console.log('🚀 단순화된 메뉴 구조 생성 시작...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 단순화된 메뉴 구조 정의 (권한 관리 시스템 제거)
    const simplifiedMenus = [
      // 1. 대시보드
      {
        name: '대시보드',
        name_en: 'Dashboard',
        icon: 'dashboard',
        url: '/dashboard',
        order_num: 1,
        parent_id: null
      },
      
      // 2. 사용자 관리 (메인 카테고리)
      {
        name: '사용자 관리',
        name_en: 'User Management',
        icon: 'people',
        url: null,
        order_num: 2,
        parent_id: null
      },
      {
        name: '사용자 목록',
        name_en: 'User List',
        icon: 'list',
        url: '/users/list',
        order_num: 1,
        parent_id: 2 // 사용자 관리의 하위
      },
      {
        name: '회사 정보 관리',
        name_en: 'Company Management',
        icon: 'business',
        url: '/users/company',
        order_num: 2,
        parent_id: 2 // 사용자 관리의 하위
      },
      {
        name: '파트너 업체 관리',
        name_en: 'Partner Management',
        icon: 'handshake',
        url: '/users/partners',
        order_num: 3,
        parent_id: 2 // 사용자 관리의 하위
      },
      
      // 3. 메뉴 권한 관리 (통합된 권한 관리)
      {
        name: '메뉴 권한 관리',
        name_en: 'Menu Permission Management',
        icon: 'security',
        url: '/permissions/menu',
        order_num: 3,
        parent_id: null
      },
      
      // 4. 업무 관리
      {
        name: '업무 관리',
        name_en: 'Business Management',
        icon: 'work',
        url: null,
        order_num: 4,
        parent_id: null
      },
      {
        name: '전자결재',
        name_en: 'Electronic Approval',
        icon: 'approval',
        url: '/approval',
        order_num: 1,
        parent_id: 4 // 업무 관리의 하위
      },
      
      // 5. 회계 관리
      {
        name: '회계 관리',
        name_en: 'Accounting Management',
        icon: 'account_balance',
        url: null,
        order_num: 5,
        parent_id: null
      },
      {
        name: '매출 관리',
        name_en: 'Sales Management',
        icon: 'receipt',
        url: '/accounting/invoices',
        order_num: 1,
        parent_id: 5 // 회계 관리의 하위
      },
      {
        name: '매입/매출 통계',
        name_en: 'Accounting Statistics',
        icon: 'bar_chart',
        url: '/accounting/statistics',
        order_num: 2,
        parent_id: 5 // 회계 관리의 하위
      }
    ];

    // 트랜잭션으로 안전하게 업데이트
    const transaction = await sequelize.transaction();

    try {
      // 기존 메뉴 및 권한 삭제
      console.log('🗑️  기존 메뉴 권한 삭제 중...');
      await MenuPermission.destroy({ where: {}, force: true, transaction });
      
      console.log('🗑️  기존 메뉴 삭제 중...');
      await Menu.destroy({ where: {}, force: true, transaction });

      // 새로운 단순화된 메뉴 구조 생성
      console.log('🏗️  단순화된 메뉴 구조 생성 중...');
      
      const createdMenus: { [key: number]: number } = {};
      
      for (const menuData of simplifiedMenus) {
        const realParentId = menuData.parent_id ? createdMenus[menuData.parent_id] : null;
        
        const menu = await Menu.create({
          name: menuData.name,
          name_en: menuData.name_en,
          icon: menuData.icon,
          url: menuData.url,
          order_num: menuData.order_num,
          parent_id: realParentId,
          create_date: new Date()
        }, { transaction });

        // ID 매핑 저장
        createdMenus[menuData.parent_id === null ? menuData.order_num : (menuData.parent_id * 10 + menuData.order_num)] = menu.menu_id;
        
        console.log(`  ✅ ${menuData.name} (ID: ${menu.menu_id})`);
      }

      // 관리자들에게 권한 부여
      console.log('👑 관리자들에게 메뉴 권한 부여 중...');
      
      const adminUsers = await User.findAll({ 
        where: { 
          role: ['root', 'admin'],
          is_deleted: false 
        },
        transaction
      });

      const allNewMenus = await Menu.findAll({ transaction });
      
      for (const user of adminUsers) {
        for (const menu of allNewMenus) {
          await MenuPermission.create({
            user_id: user.id,
            menu_id: menu.menu_id,
            can_read: true,
            can_create: user.role === 'root' || user.role === 'admin',
            can_update: user.role === 'root' || user.role === 'admin',
            can_delete: user.role === 'root',
            create_date: new Date()
          }, { transaction });
        }
        
        console.log(`  ✅ ${user.username} (${user.role}) - ${allNewMenus.length}개 메뉴 권한 부여`);
      }

      await transaction.commit();
      console.log('✅ 트랜잭션 커밋 완료');

      console.log('\n🎯 단순화된 메뉴 구조:');
      console.log('========================');
      console.log('📁 대시보드');
      console.log('📁 사용자 관리');
      console.log('   └── 📄 사용자 목록');
      console.log('   └── 📄 회사 정보 관리');
      console.log('   └── 📄 파트너 업체 관리');
      console.log('📁 메뉴 권한 관리 (통합 권한 관리)');
      console.log('📁 업무 관리');
      console.log('   └── 📄 전자결재');
      console.log('📁 회계 관리');
      console.log('   └── 📄 매출 관리');
      console.log('   └── 📄 매입/매출 통계');

      console.log(`\n📊 업데이트 결과:`);
      console.log(`메뉴 개수: ${simplifiedMenus.length}개`);
      console.log(`권한 개수: ${adminUsers.length * simplifiedMenus.length}개`);
      console.log(`관리자 수: ${adminUsers.length}명`);

      console.log('\n🎉 단순화된 메뉴 구조 생성 완료!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 메뉴 생성 실패:', error);
  } finally {
    await sequelize.close();
  }
}

createSimplifiedMenus();
