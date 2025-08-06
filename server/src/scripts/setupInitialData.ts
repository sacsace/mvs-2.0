import sequelize from '../config/database';
import Company from '../models/Company';
import User from '../models/User';
import Menu from '../models/Menu';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

async function setupInitialData() {
  console.log('=== Railways DB 초기 데이터 설정 시작 ===');
  
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 동기화
    await sequelize.sync({ force: false });
    console.log('✅ 테이블 동기화 완료');

    // 기존 데이터 확인
    const existingCompany = await Company.findOne();
    const existingUser = await User.findOne();

    if (existingCompany || existingUser) {
      console.log('⚠️  이미 데이터가 존재합니다. 초기화를 건너뜁니다.');
      return;
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. 회사 생성
      console.log('📢 회사 생성 중...');
      const company = await Company.create({
        name: 'Minsub Ventures Private Limited',
        coi: 'MSV-2024-001', // 임시 사업자등록번호
        representative_name: 'Minsub Lee',
        address: 'Singapore',
        phone: '+65-0000-0000',
        email: 'minsub.lee@gmail.com',
        is_active: true
      }, { transaction });

      console.log(`✅ 회사 생성 완료: ${company.name} (ID: ${company.company_id})`);

      // 2. 관리자 계정 생성
      console.log('👤 관리자 계정 생성 중...');
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      const user = await User.create({
        username: 'root',
        password: hashedPassword,
        company_id: company.company_id,
        role: 'ROOT',
        is_active: true,
        is_deleted: false
      }, { transaction });

      console.log(`✅ 관리자 계정 생성 완료: ${user.username} (ID: ${user.id})`);

      // 3. 기본 메뉴 생성
      console.log('📋 기본 메뉴 생성 중...');
      const menus = [
        {
          name: '대시보드',
          name_en: 'Dashboard',
          icon: 'dashboard',
          url: '/dashboard',
          order_num: 1,
          parent_id: null
        },
        {
          name: '사용자 관리',
          name_en: 'User Management',
          icon: 'people',
          url: '/users',
          order_num: 2,
          parent_id: null
        },
        {
          name: '회사 관리',
          name_en: 'Company Management',
          icon: 'business',
          url: '/companies',
          order_num: 3,
          parent_id: null
        },
        {
          name: '메뉴 관리',
          name_en: 'Menu Management',
          icon: 'menu',
          url: '/menus',
          order_num: 4,
          parent_id: null
        },
        {
          name: '권한 관리',
          name_en: 'Permission Management',
          icon: 'security',
          url: '/permissions',
          order_num: 5,
          parent_id: null
        }
      ];

      for (const menuData of menus) {
        await Menu.create(menuData, { transaction });
      }

      console.log(`✅ 기본 메뉴 생성 완료: ${menus.length}개`);

      await transaction.commit();
      console.log('🎉 초기 데이터 설정 완료!');

      // 결과 요약
      console.log('\n=== 생성된 초기 데이터 ===');
      console.log(`회사명: ${company.name}`);
      console.log(`관리자 ID: ${user.username}`);
      console.log(`비밀번호: admin`);
      console.log(`메뉴 개수: ${menus.length}개`);
      console.log('===============================\n');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ 초기 데이터 설정 실패:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  setupInitialData()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export default setupInitialData;