import sequelize from '../config/database';
import User from '../models/User';
import Company from '../models/Company';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import Role from '../models/Role';
import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

interface MenuData {
  id: number;
  name: string;
  name_en: string;
  icon: string;
  order: number;
  parent_id: number | null;
  url: string | null;
}

async function initializeSystemData() {
  try {
    console.log('🚀 시스템 초기 데이터 설정 시작...');
    
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();

    try {
      // SQLite에서 외래키 제약조건 일시 해제
      await sequelize.query('PRAGMA foreign_keys = OFF;', { transaction });
      console.log('🔓 외래키 제약조건 일시 해제');

      // 1. 기존 데이터 정리
      console.log('🧹 기존 데이터 정리 중...');
      
      // 모든 테이블의 데이터 삭제 (존재하는 테이블만)
      const tables = ['menu_permission', 'role_permissions', 'user_permissions', 'user', 'menu', 'company', 'permissions', 'roles'];
      
      for (const table of tables) {
        try {
          await sequelize.query(`DELETE FROM ${table};`, { transaction });
          console.log(`  - ${table} 테이블 데이터 삭제 완료`);
        } catch (error) {
          console.log(`  - ${table} 테이블 삭제 건너뜀 (존재하지 않음)`);
        }
      }
      
      // Auto increment 리셋
      await sequelize.query("UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('user', 'company', 'menu', 'roles', 'permissions');", { transaction });
      
      console.log('✅ 기존 데이터 정리 완료');

      // 외래키 제약조건 다시 활성화
      await sequelize.query('PRAGMA foreign_keys = ON;', { transaction });
      console.log('🔒 외래키 제약조건 다시 활성화');

      // 2. 회사 생성
      console.log('🏢 기본 회사 생성 중...');
      const company = await Company.create({
        name: 'MS Ventures Private Limited',
        coi: 'MSV000001', // Certificate of Incorporation
        pan: 'AAAAA0000A',
        gst1: '27AAAAA0000A1ZA',
        address: 'Default Business Address, Mumbai, Maharashtra, India',
        website: 'https://msventures.com',
        email: 'admin@msventures.com',
        phone: '+91-9999999999',
        partner_type: 'supplier',
        product_category: 'SOFTWARE',
        is_deleted: false,
        create_date: new Date(),
        update_date: new Date()
      }, { transaction });
      console.log(`✅ 회사 생성 완료 (ID: ${company.company_id})`);

      // 3. 역할 생성
      console.log('👥 기본 역할 생성 중...');
      const roles = [
        { 
          name: 'root', 
          name_en: 'Root', 
          description: '시스템 최고 관리자', 
          description_en: 'System Root Administrator',
          level: 'root' as const, 
          company_access: 'all' as const 
        },
        { 
          name: 'admin', 
          name_en: 'Admin', 
          description: '관리자', 
          description_en: 'Administrator',
          level: 'admin' as const, 
          company_access: 'all' as const 
        },
        { 
          name: 'user', 
          name_en: 'User', 
          description: '일반 사용자', 
          description_en: 'Regular User',
          level: 'regular' as const, 
          company_access: 'own' as const 
        }
      ];

      for (const roleData of roles) {
        await Role.create({
          name: roleData.name,
          name_en: roleData.name_en,
          description: roleData.description,
          description_en: roleData.description_en,
          level: roleData.level,
          company_access: roleData.company_access,
          is_active: true
        }, { transaction });
      }
      console.log('✅ 역할 생성 완료');

      // 4. 권한 생성
      console.log('🔐 기본 권한 생성 중...');
      const permissions = [
        { name: 'USER_READ', description: '사용자 조회', level: 'regular' as const, company_access: 'own' as const },
        { name: 'USER_CREATE', description: '사용자 생성', level: 'admin' as const, company_access: 'all' as const },
        { name: 'USER_UPDATE', description: '사용자 수정', level: 'admin' as const, company_access: 'all' as const },
        { name: 'USER_DELETE', description: '사용자 삭제', level: 'root' as const, company_access: 'all' as const },
        { name: 'MENU_READ', description: '메뉴 조회', level: 'regular' as const, company_access: 'none' as const },
        { name: 'MENU_CREATE', description: '메뉴 생성', level: 'root' as const, company_access: 'all' as const },
        { name: 'MENU_UPDATE', description: '메뉴 수정', level: 'root' as const, company_access: 'all' as const },
        { name: 'MENU_DELETE', description: '메뉴 삭제', level: 'root' as const, company_access: 'all' as const }
      ];

      for (const permData of permissions) {
        await Permission.create({
          name: permData.name,
          description: permData.description,
          level: permData.level,
          company_access: permData.company_access
        }, { transaction });
      }
      console.log('✅ 권한 생성 완료');

      // 5. 메뉴 구조 생성
      console.log('📋 메뉴 구조 생성 중...');
      const menus: MenuData[] = [
        // 메인 메뉴들
        { id: 1, name: '대시보드', name_en: 'Dashboard', icon: 'dashboard', order: 1, parent_id: null, url: '/dashboard' },
        { id: 2, name: '사용자 관리', name_en: 'User Management', icon: 'people', order: 2, parent_id: null, url: null },
        { id: 3, name: '권한 관리', name_en: 'Permission Management', icon: 'security', order: 3, parent_id: null, url: null },
        { id: 4, name: '회계 관리', name_en: 'Accounting Management', icon: 'accounting_box', order: 4, parent_id: null, url: null },
        { id: 5, name: '전자 결재', name_en: 'Electronic Approval', icon: 'assignment_turned_in', order: 5, parent_id: null, url: '/approval' },

        // 사용자 관리 하위 메뉴
        { id: 21, name: '사용자 목록', name_en: 'User List', icon: 'list', order: 1, parent_id: 2, url: '/users/list' },
        { id: 22, name: '회사 정보 관리', name_en: 'Company Management', icon: 'business', order: 2, parent_id: 2, url: '/users/company' },
        { id: 23, name: '협력 업체 관리', name_en: 'Partner Management', icon: 'groups', order: 3, parent_id: 2, url: '/users/partners' },

        // 권한 관리 하위 메뉴
        { id: 31, name: '메뉴 권한 관리', name_en: 'Menu Permission Management', icon: 'security', order: 1, parent_id: null, url: '/permissions/menu' },

        // 회계 관리 하위 메뉴
        { id: 41, name: '매입/매출 통계', name_en: 'Purchase/Sales Statistics', icon: 'bar_chart', order: 1, parent_id: 4, url: '/accounting/statistics' },
        { id: 42, name: '매출 관리', name_en: 'Sales Management', icon: 'receipt_long', order: 2, parent_id: 4, url: '/accounting/invoices' },
        { id: 43, name: '송장 관리', name_en: 'Invoice Management', icon: 'description', order: 3, parent_id: 4, url: '/accounting/invoices' }
      ];

      // 메뉴 순차 생성 (부모-자식 관계 유지)
      const menuIdMapping: { [key: number]: number } = {};
      
      for (const menu of menus) {
        const realParentId = menu.parent_id ? menuIdMapping[menu.parent_id] : null;
        
        const createdMenu = await Menu.create({
          name: menu.name,
          name_en: menu.name_en,
          icon: menu.icon,
          order_num: menu.order,
          parent_id: realParentId,
          url: menu.url,
          create_date: new Date()
        }, { transaction });

        menuIdMapping[menu.id] = createdMenu.menu_id;
        console.log(`📋 메뉴 생성: ${menu.name} (ID: ${createdMenu.menu_id})`);
      }
      console.log('✅ 메뉴 구조 생성 완료');

      // 6. Root 사용자 생성
      console.log('👤 Root 사용자 생성 중...');
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      const rootUser = await User.create({
        userid: 'root',
        username: 'System Administrator',
        password: hashedPassword,
        company_id: company.company_id,
        role: 'root',
        default_language: 'ko',
        is_deleted: false,
        create_date: new Date(),
        update_date: new Date()
      }, { transaction });
      console.log(`✅ Root 사용자 생성 완료 (ID: ${rootUser.id})`);

      // 7. Root 사용자에게 모든 메뉴 권한 부여
      console.log('🔑 Root 사용자 메뉴 권한 설정 중...');
      const allMenus = await Menu.findAll({ transaction });
      
      for (const menu of allMenus) {
        await MenuPermission.create({
          user_id: rootUser.id,
          menu_id: menu.menu_id,
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true
        }, { transaction });
        console.log(`🔑 권한 부여: ${menu.name} (모든 권한)`);
      }
      console.log('✅ Root 사용자 메뉴 권한 설정 완료');

      // 트랜잭션 커밋
      await transaction.commit();
      console.log('✅ 모든 초기 데이터 설정 완료!');

      // 최종 확인
      console.log('\n📊 설정 완료 요약:');
      console.log(`- 회사: ${company.name} (ID: ${company.company_id})`);
      console.log(`- Root 사용자: root/admin (ID: ${rootUser.id})`);
      console.log(`- 메뉴 개수: ${allMenus.length}개`);
      console.log(`- 메뉴 권한: ${allMenus.length}개 (모든 권한)`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ 초기 데이터 설정 중 오류 발생:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  initializeSystemData()
    .then(() => {
      console.log('🎉 시스템 초기 데이터 설정이 성공적으로 완료되었습니다!');
      console.log('🔐 로그인 정보: root / admin');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 초기 데이터 설정 실패:', error);
      process.exit(1);
    });
}

export default initializeSystemData;
