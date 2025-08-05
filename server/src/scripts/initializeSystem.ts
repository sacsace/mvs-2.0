import sequelize from '../config/database';
import Company from '../models/Company';
import User from '../models/User';
import bcrypt from 'bcryptjs';

async function initializeSystem() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 트랜잭션 시작
    const result = await sequelize.transaction(async (t) => {
      // 회사 생성
      const newCompany = await Company.create({
        name: '테스트 회사',
        coi: 'TEST001', // 필수 필드 추가
        is_deleted: false
      }, { transaction: t });

      console.log('회사 생성됨:', newCompany.toJSON());

      // 관리자 사용자 생성
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newUser = await User.create({
        username: 'admin',
        password: hashedPassword,
        company_id: newCompany.company_id,
        role: 'admin',
        is_deleted: false
      }, { transaction: t });

      console.log('관리자 사용자 생성됨:', {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        company_id: newUser.company_id
      });

      return { company: newCompany, user: newUser };
    });

    console.log('\n시스템 초기화 완료!');
    console.log('==================');
    console.log('회사 ID:', result.company.company_id);
    console.log('회사명:', result.company.name);
    console.log('관리자 ID:', result.user.id);
    console.log('관리자 계정:', result.user.username);
    console.log('관리자 역할:', result.user.role);

  } catch (error) {
    console.error('시스템 초기화 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
initializeSystem(); 