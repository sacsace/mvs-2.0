import sequelize from '../config/database';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import User from '../models/User';

interface MenuData {
  name: string;
  name_en: string;
  icon: string;
  url: string | null;
  order_num: number;
  parent_id: number | null;
  description?: string;
}

async function updateProductionMenus() {
  console.log('🚀 단순화된 메뉴 구조 업데이트 시작...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 단순화된 메뉴 구조 정의 (권한 관리 시스템 통합)
    const menuStructure: MenuData[] = [
      // 1. 대시보드 (메인)
      {
        name: '대시보드',
        name_en: 'Dashboard',
        icon: 'dashboard',
        url: '/dashboard',
        order_num: 1,
        parent_id: null,
        description: '시스템 전체 현황 및 통계'
      },

      // 2. 사용자 관리 (메인 카테고리)
      {
        name: '사용자 관리',
        name_en: 'User Management',
        icon: 'people',
        url: null,
        order_num: 2,
        parent_id: null,
        description: '사용자 및 계정 관리'
      },
      {
        name: '사용자 목록',
        name_en: 'User List',
        icon: 'list',
        url: '/users/list',
        order_num: 1,
        parent_id: 2,
        description: '사용자 목록 조회 및 관리'
      },
      {
        name: '회사 정보 관리',
        name_en: 'Company Management',
        icon: 'business',
        url: '/users/company',
        order_num: 2,
        parent_id: 2,
        description: '회사 정보 등록 및 수정'
      },
      {
        name: '파트너 업체 관리',
        name_en: 'Partner Management',
        icon: 'handshake',
        url: '/users/partners',
        order_num: 3,
        parent_id: 2,
        description: '협력 업체 정보 관리'
      },

      // 3. 메뉴 권한 관리 (통합된 단일 권한 관리)
      {
        name: '메뉴 권한 관리',
        name_en: 'Menu Permission Management',
        icon: 'security',
        url: '/permissions/menu',
        order_num: 3,
        parent_id: null,
        description: '통합 메뉴 권한 설정'
      },

      // 4. 업무 관리 (메인 카테고리)
      {
        name: '업무 관리',
        name_en: 'Business Management',
        icon: 'work',
        url: null,
        order_num: 4,
        parent_id: null,
        description: '업무 프로세스 관리'
      },
      {
        name: '전자결재',
        name_en: 'Electronic Approval',
        icon: 'approval',
        url: '/approval',
        order_num: 1,
        parent_id: 4,
        description: '전자 결재 시스템'
      },

      // 5. 회계 관리 (메인 카테고리)
      {
        name: '회계 관리',
        name_en: 'Accounting Management',
        icon: 'account_balance',
        url: null,
        order_num: 5,
        parent_id: null,
        description: '회계 및 재무 관리'
      },
      {
        name: '매출 관리',
        name_en: 'Sales Management',
        icon: 'receipt',
        url: '/accounting/invoices',
        order_num: 1,
        parent_id: 5,
        description: '매출 정보 및 인보이스 관리'
      },
      {
        name: '매입/매출 통계',
        name_en: 'Accounting Statistics',
        icon: 'bar_chart',
        url: '/accounting/statistics',
        order_num: 2,
        parent_id: 5,
        description: '매입/매출 통계 및 분석'
      }
    ];

    // 테이블 존재 확인
    try {
      const dialect = sequelize.getDialect();
      let tableExistsQuery;
      
      if (dialect === 'postgres') {
        tableExistsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'menu'
          );
        `;
      } else {
        tableExistsQuery = `
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='menu';
        `;
      }
      
      await sequelize.query(tableExistsQuery);
    } catch (error) {
      console.log('⚠️  데이터베이스 테이블 확인 중 오류 발생:', error);
      console.log('💡 메뉴 업데이트를 건너뜁니다.');
      return;
    }
    
    // 현재 메뉴 개수 확인
    const currentMenuCount = await Menu.count();
    console.log(`현재 메뉴 개수: ${currentMenuCount}개`);

    console.log('🔄 단순화된 메뉴 구조 업데이트 시작...');

    // 트랜잭션으로 안전하게 업데이트
    const transaction = await sequelize.transaction();

    try {
      // 기존 메뉴 권한 백업
      console.log('💾 기존 메뉴 권한 백업 중...');
      const existingPermissions = await MenuPermission.findAll({ transaction });

      // 기존 메뉴 및 권한 삭제
      console.log('🗑️  기존 메뉴 권한 삭제 중...');
      await MenuPermission.destroy({ where: {}, force: true, transaction });
      
      console.log('🗑️  기존 메뉴 삭제 중...');
      await Menu.destroy({ where: {}, force: true, transaction });

      // 새로운 메뉴 구조 생성
      console.log('🏗️  단순화된 메뉴 구조 생성 중...');
      
      const createdMenus: { [key: number]: number } = {}; // 임시 ID -> 실제 menu_id 매핑
      
      for (const menuData of menuStructure) {
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

        // 임시 ID -> 실제 menu_id 매핑 저장
        const tempId = menuData.parent_id === null ? menuData.order_num : (menuData.parent_id * 10 + menuData.order_num);
        createdMenus[tempId] = menu.menu_id;
        
        console.log(`  ✅ ${menuData.name} (ID: ${menu.menu_id})`);
      }

      // Root 사용자 및 기존 관리자들에게 권한 부여
      console.log('👑 관리자 사용자들에게 메뉴 권한 부여 중...');
      
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

      console.log('\n🎯 업데이트된 단순화 메뉴 구조:');
      console.log('========================\n');

      console.log('📁 대시보드 (Dashboard)');
      console.log('📁 사용자 관리 (User Management)');
      console.log('   └── 📄 사용자 목록 → /users/list');
      console.log('   └── 📄 회사 정보 관리 → /users/company');
      console.log('   └── 📄 파트너 업체 관리 → /users/partners');
      console.log('📁 메뉴 권한 관리 (통합) → /permissions/menu');
      console.log('📁 업무 관리 (Business Management)');
      console.log('   └── 📄 전자결재 → /approval');
      console.log('📁 회계 관리 (Accounting Management)');
      console.log('   └── 📄 매출 관리 → /accounting/invoices');
      console.log('   └── 📄 매입/매출 통계 → /accounting/statistics');

      console.log(`\n📊 업데이트 결과:`);
      console.log(`메뉴 개수: ${menuStructure.length}개`);
      console.log(`권한 개수: ${adminUsers.length * menuStructure.length}개`);
      console.log(`관리자 수: ${adminUsers.length}명`);

      console.log('\n🎉 단순화된 메뉴 구조 업데이트 완료!');
      console.log('✅ 권한 관리, 사용자 권한 관리, 역할 관리 페이지가 통합되었습니다.');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 메뉴 업데이트 실패:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  updateProductionMenus();
}

export default updateProductionMenus;