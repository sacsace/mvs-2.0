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
  console.log('🚀 프로덕션 메뉴 구조 업데이트 시작...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

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

    console.log('📋 현재 메뉴 상태 확인 중...');
    
    // 현재 메뉴 개수 확인
    const currentMenuCount = await Menu.count();
    console.log(`현재 메뉴 개수: ${currentMenuCount}개`);

    // 업데이트가 필요한지 확인
    if (currentMenuCount === menuStructure.length) {
      console.log('⚠️  메뉴 개수가 동일합니다. 구조 업데이트를 진행할지 확인 중...');
      
      // 첫 번째 메뉴의 구조 확인
      const firstMenu = await Menu.findOne({ where: { order_num: 1 } });
      if (firstMenu && firstMenu.name === '대시보드' && firstMenu.name_en === 'Dashboard') {
        console.log('✅ 이미 최신 메뉴 구조입니다. 업데이트를 건너뜁니다.');
        return;
      }
    }

    console.log('🔄 메뉴 구조 업데이트 시작...');

    // 트랜잭션으로 안전하게 업데이트
    const transaction = await sequelize.transaction();

    try {
      // 기존 메뉴 권한 백업
      console.log('💾 기존 메뉴 권한 백업 중...');
      const existingPermissions = await MenuPermission.findAll({ transaction });
      const permissionBackup = existingPermissions.map(p => ({
        user_id: p.user_id,
        menu_id: p.menu_id,
        can_read: p.can_read,
        can_create: p.can_create,
        can_update: p.can_update,
        can_delete: p.can_delete
      }));

      // 기존 메뉴 및 권한 삭제
      console.log('🗑️  기존 메뉴 권한 삭제 중...');
      await MenuPermission.destroy({ where: {}, force: true, transaction });
      
      console.log('🗑️  기존 메뉴 삭제 중...');
      await Menu.destroy({ where: {}, force: true, transaction });

      // 새로운 메뉴 구조 생성
      console.log('🏗️  새로운 메뉴 구조 생성 중...');
      
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

      // 결과 확인
      console.log('\n🎯 업데이트된 메뉴 구조:');
      console.log('========================');
      
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

      const finalMenuCount = await Menu.count();
      const finalPermissionCount = await MenuPermission.count();
      
      console.log('\n📊 업데이트 결과:');
      console.log(`메뉴 개수: ${finalMenuCount}개`);
      console.log(`권한 개수: ${finalPermissionCount}개`);
      console.log(`관리자 수: ${adminUsers.length}명`);

      console.log('\n🎉 프로덕션 메뉴 구조 업데이트 완료!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ 트랜잭션 롤백됨:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ 프로덕션 메뉴 업데이트 실패:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  updateProductionMenus()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export default updateProductionMenus;
