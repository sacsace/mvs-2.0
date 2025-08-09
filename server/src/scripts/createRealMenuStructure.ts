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

async function createRealMenuStructure() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 기존 메뉴 및 권한 삭제
    console.log('기존 메뉴 권한 삭제 중...');
    await MenuPermission.destroy({ where: {}, force: true });
    
    console.log('기존 메뉴 삭제 중...');
    await Menu.destroy({ where: {}, force: true });

    // 실제 개발된 페이지에 맞는 메뉴 구조 정의
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
        description: '전체 사용자 목록 및 관리'
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

      // 3. 권한 관리 (메인 카테고리)
      {
        name: '권한 관리',
        name_en: 'Permission Management',
        icon: 'security',
        url: null,
        order_num: 3,
        parent_id: null,
        description: '시스템 권한 및 역할 관리'
      },
      {
        name: '메뉴 권한 관리',
        name_en: 'Menu Permission',
        icon: 'menu_book',
        url: '/permissions/menu',
        order_num: 1,
        parent_id: 3,
        description: '메뉴별 사용자 권한 설정'
      },
      {
        name: '사용자 권한 관리',
        name_en: 'User Permission',
        icon: 'person_add',
        url: '/permissions/user',
        order_num: 2,
        parent_id: 3,
        description: '사용자별 권한 부여 관리'
      },
      {
        name: '역할 관리',
        name_en: 'Role Management',
        icon: 'admin_panel_settings',
        url: '/permissions/roles',
        order_num: 3,
        parent_id: 3,
        description: '역할 정의 및 권한 그룹 관리'
      },
      {
        name: '권한 설정',
        name_en: 'Permission Settings',
        icon: 'settings',
        url: '/permissions/manage',
        order_num: 4,
        parent_id: 3,
        description: '시스템 권한 세부 설정'
      },

      // 4. 업무 관리 (메인 카테고리)
      {
        name: '업무 관리',
        name_en: 'Business Management',
        icon: 'work',
        url: null,
        order_num: 4,
        parent_id: null,
        description: '일반 업무 관리 시스템'
      },
      {
        name: '전자결재',
        name_en: 'Electronic Approval',
        icon: 'approval',
        url: '/approval',
        order_num: 1,
        parent_id: 4,
        description: '전자결재 및 승인 관리'
      },

      // 5. 회계 관리 (메인 카테고리)
      {
        name: '회계 관리',
        name_en: 'Accounting Management',
        icon: 'account_balance',
        url: null,
        order_num: 5,
        parent_id: null,
        description: '회계 및 재무 관리 시스템'
      },
      {
        name: '매출 관리',
        name_en: 'Sales Management',
        icon: 'receipt',
        url: '/accounting/invoices',
        order_num: 1,
        parent_id: 5,
        description: '매출 인보이스 관리'
      },
      {
        name: '매입/매출 통계',
        name_en: 'Purchase/Sales Statistics',
        icon: 'analytics',
        url: '/accounting/statistics',
        order_num: 2,
        parent_id: 5,
        description: '매입/매출 통계 및 분석'
      }
    ];

    console.log('새로운 메뉴 구조 생성 중...');
    
    // 메뉴 생성 (순서대로 생성하여 parent_id 매핑이 올바르게 되도록)
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
      });

      // 임시 ID -> 실제 menu_id 매핑 저장
      const tempId = menuData.parent_id === null ? menuData.order_num : (menuData.parent_id * 10 + menuData.order_num);
      createdMenus[tempId] = menu.menu_id;
      
      console.log(`✅ 메뉴 생성: ${menuData.name} (ID: ${menu.menu_id})`);
    }

    console.log(`총 ${menuStructure.length}개의 메뉴가 생성되었습니다.`);

    // Root 사용자에게 모든 메뉴 권한 부여
    console.log('\nRoot 사용자에게 메뉴 권한 부여 중...');
    
    const rootUser = await User.findOne({ where: { userid: 'root' } });
    if (!rootUser) {
      console.log('⚠️  Root 사용자를 찾을 수 없습니다.');
      return;
    }

    const allMenus = await Menu.findAll();
    
    for (const menu of allMenus) {
      await MenuPermission.create({
        user_id: rootUser.id,
        menu_id: menu.menu_id,
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: true,
        create_date: new Date()
      });
    }

    console.log(`✅ Root 사용자에게 ${allMenus.length}개 메뉴 권한 부여 완료`);

    // 생성된 메뉴 구조 출력
    console.log('\n🎯 생성된 메뉴 구조:');
    console.log('====================');
    
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

    console.log('\n🎉 실제 개발된 페이지에 맞는 메뉴 구조 생성 완료!');

  } catch (error) {
    console.error('메뉴 구조 생성 중 오류:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  createRealMenuStructure();
}

export default createRealMenuStructure;
