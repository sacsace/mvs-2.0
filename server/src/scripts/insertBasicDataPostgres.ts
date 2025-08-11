import sequelize from '../config/database';
import Company from '../models/Company';
import User from '../models/User';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import Role from '../models/Role';
import Permission from '../models/Permission';
import bcrypt from 'bcryptjs';

async function insertBasicData() {
  try {
    console.log('🚀 PostgreSQL 기본 데이터 삽입 시작...');
    
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 동기화 (테이블 생성)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ 테이블 동기화 완료');

    // 기존 데이터 확인
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('✅ 데이터가 이미 존재합니다. 삽입을 건너뜁니다.');
      return;
    }

    console.log('🏢 기본 회사 생성 중...');
    
    // 1. 기본 회사 생성
    const company1 = await Company.create({
      name: 'Minsub Ventures Private Limited',
      coi: 'U17226KA2020PTC133195',
      pan: 'AANCM3695F',
      gst1: '29AANCM3695F1ZW',
      address: '24/1, Doddanekundi, Ferns City Road, Outer Ring Road, Marathahalli, Bangalore, Karnataka 560037',
      website: 'www.msventures.in',
      email: 'lee@msventures.in',
      phone: '9789888485',
      partner_type: 'both',
      product_category: 'SOFTWARE',
      is_deleted: false
    });

    const company2 = await Company.create({
      name: 'Yaskawa Doolim India Private Limited',
      coi: 'U74999KA2018FTC110554',
      pan: 'AAACY9718N',
      gst1: '29AAACY9718N1ZG',
      address: 'Office 120, 24/1, Doddanekundi, Ferns City Road, Outer Ring Road, Marathahalli, Bangalore, Karnataka 560037',
      email: 'doolim.yaskawa.india@gmail.com',
      partner_type: 'customer',
      product_category: '회계서비스 제공',
      is_deleted: false
    });

    const company3 = await Company.create({
      name: 'Hyundai Motors India Ltd',
      coi: 'U29309TN1996PLC035377',
      gst1: '33AAACH2364M1ZM',
      address: 'Plot No.H-1,SIPCOT Industrial Park. Irrungattukottai Sriperumbudur Taluk Kancheepuram Dist. TN-602117',
      partner_type: 'customer',
      product_category: 'Yaskawa Robot supply',
      is_deleted: false
    });

    const company4 = await Company.create({
      name: 'Seoyon E-Hwa Summit Automotive Anantapur Private Limited',
      coi: 'U35990AP2017PTC106732',
      gst1: '37AAZCS2637P1Z8',
      address: 'B-11, INDUSTRIAL PARK AMMAVARAPALLI, BUDDEBANDA ROAD, Penukonda(mandal) Ananthapur',
      partner_type: 'customer',
      is_deleted: false
    });

    console.log('✅ 회사 생성 완료');

    console.log('👥 기본 역할 생성 중...');
    
    // 2. 기본 역할 생성
    const roles = [
      { 
        name: 'root', 
        name_en: 'root',
        description: 'System Administrator', 
        description_en: 'System Administrator',
        level: 'root' as const,
        company_access: 'all' as const,
        is_active: true
      },
      { 
        name: 'admin', 
        name_en: 'admin',
        description: 'Administrator', 
        description_en: 'Administrator',
        level: 'admin' as const,
        company_access: 'own' as const,
        is_active: true
      },
      { 
        name: 'user', 
        name_en: 'user',
        description: 'Regular User', 
        description_en: 'Regular User',
        level: 'regular' as const,
        company_access: 'own' as const,
        is_active: true
      },
      { 
        name: 'audit', 
        name_en: 'audit',
        description: 'Audit User', 
        description_en: 'Audit User',
        level: 'audit' as const,
        company_access: 'own' as const,
        is_active: true
      }
    ];

    for (const role of roles) {
      await Role.create(role);
    }

    console.log('✅ 역할 생성 완료');

    console.log('🔐 기본 권한 생성 중...');
    
    // 3. 기본 권한 생성
    const permissions = [
      { name: 'user.read', description: 'Read users', level: 'regular' as const, company_access: 'own' as const },
      { name: 'user.write', description: 'Write users', level: 'admin' as const, company_access: 'own' as const },
      { name: 'user.delete', description: 'Delete users', level: 'admin' as const, company_access: 'own' as const },
      { name: 'company.read', description: 'Read companies', level: 'regular' as const, company_access: 'own' as const },
      { name: 'company.write', description: 'Write companies', level: 'admin' as const, company_access: 'own' as const },
      { name: 'menu.read', description: 'Read menus', level: 'regular' as const, company_access: 'all' as const },
      { name: 'menu.write', description: 'Write menus', level: 'root' as const, company_access: 'all' as const },
      { name: 'system.admin', description: 'System administration', level: 'root' as const, company_access: 'all' as const }
    ];

    for (const permission of permissions) {
      await Permission.create(permission);
    }

    console.log('✅ 권한 생성 완료');

    console.log('📋 메뉴 구조 생성 중...');
    
    // 4. 메뉴 구조 생성
    const menus = [
      { name: '대시보드', name_en: 'Dashboard', url: '/dashboard', parent_id: null, order_num: 1 },
      { name: '사용자 관리', name_en: 'User Management', url: null, parent_id: null, order_num: 2 },
      { name: '권한 관리', name_en: 'Permission Management', url: null, parent_id: null, order_num: 3 },
      { name: '회계 관리', name_en: 'Accounting Management', url: null, parent_id: null, order_num: 4 },
      { name: '전자 결재', name_en: 'Electronic Approval', url: '/approval', parent_id: null, order_num: 5 },
      { name: '사용자 목록', name_en: 'User List', url: '/users', parent_id: 2, order_num: 1 },
      { name: '회사 정보 관리', name_en: 'Company Information', url: '/company', parent_id: 2, order_num: 2 },
      { name: '협력 업체 관리', name_en: 'Partner Management', url: '/partners', parent_id: 2, order_num: 3 },
      { name: '메뉴 권한 관리', name_en: 'Menu Permission Management', url: '/menu-permissions', parent_id: 3, order_num: 1 },
      { name: '권한 관리', name_en: 'Permission Management', url: '/permissions', parent_id: 3, order_num: 2 },
      { name: '사용자 권한 관리', name_en: 'User Permission Management', url: '/user-permissions', parent_id: 3, order_num: 3 },
      { name: '역할 관리', name_en: 'Role Management', url: '/roles', parent_id: 3, order_num: 4 },
      { name: '매입/매출 통계', name_en: 'Purchase/Sales Statistics', url: '/accounting-statistics', parent_id: 4, order_num: 1 },
      { name: '매출 관리', name_en: 'Sales Management', url: '/invoice', parent_id: 4, order_num: 2 },
      { name: '송장 관리', name_en: 'Invoice Management', url: '/invoice', parent_id: 4, order_num: 3 }
    ];

    for (const menu of menus) {
      const createdMenu = await Menu.create(menu);
      console.log(`📋 메뉴 생성: ${menu.name} (ID: ${createdMenu.menu_id})`);
    }

    console.log('✅ 메뉴 구조 생성 완료');

    console.log('👤 Root 사용자 생성 중...');
    
    // 5. Root 사용자 생성
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const rootUser = await User.create({
      userid: 'root',
      username: 'System Administrator',
      password: hashedPassword,
      company_id: company1.company_id,
      role: 'root',
      default_language: 'en',
      is_deleted: false
    });

    const ydiUser = await User.create({
      userid: 'ydi',
      username: 'YDI Admin',
      password: hashedPassword,
      company_id: company2.company_id,
      role: 'admin',
      default_language: 'ko',
      is_deleted: false
    });

    const santhoshUser = await User.create({
      userid: 'santhosh',
      username: 'Santhosh',
      password: hashedPassword,
      company_id: company2.company_id,
      role: 'user',
      default_language: 'en',
      is_deleted: false
    });

    const kaushalUser = await User.create({
      userid: 'kaushal',
      username: 'Kaushal',
      password: hashedPassword,
      company_id: company1.company_id,
      role: 'audit',
      default_language: 'en',
      is_deleted: false
    });

    console.log('✅ 사용자 생성 완료');

    console.log('🔗 Root 사용자 메뉴 권한 설정 중...');
    
    // 6. Root 사용자에게 모든 메뉴 권한 부여
    const allMenus = await Menu.findAll();
    for (const menu of allMenus) {
      await MenuPermission.create({
        user_id: rootUser.id,
        menu_id: menu.menu_id,
        can_read: true,
        can_write: true,
        can_delete: true
      });
    }

    console.log('✅ Root 사용자 메뉴 권한 설정 완료');

    console.log('🎉 PostgreSQL 기본 데이터 삽입 완료!');
    
    // 최종 확인
    const userCount = await User.count();
    const companyCount = await Company.count();
    const menuCount = await Menu.count();
    
    console.log('📊 삽입된 데이터 요약:');
    console.log(`  - 사용자: ${userCount}명`);
    console.log(`  - 회사: ${companyCount}개`);
    console.log(`  - 메뉴: ${menuCount}개`);

  } catch (error) {
    console.error('❌ 데이터 삽입 중 오류 발생:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  insertBasicData()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export default insertBasicData;
