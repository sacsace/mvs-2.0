import { Sequelize } from 'sequelize';
import { QueryInterface, DataTypes } from 'sequelize';

async function runUserProfileMigration() {
  console.log('=== 사용자 프로필 마이그레이션 시작 ===');
  
  let sequelize: Sequelize | null = null;
  
  try {
    // 데이터베이스 연결
    if (process.env.DATABASE_URL) {
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: false
      });
    } else {
      // 로컬 개발 환경
      sequelize = new Sequelize({
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'mvs',
        username: 'postgres',
        password: 'postgres',
        logging: false
      });
    }
    
    console.log('데이터베이스 연결 테스트 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 마이그레이션 실행
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('사용자 테이블에 새로운 컬럼들을 추가하는 중...');
    
    // profile 컬럼 추가
    await queryInterface.addColumn('user', 'profile', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '사용자 프로필 정보 (개인정보, 사진 등)'
    });
    console.log('✅ profile 컬럼 추가 완료');
    
    // employment 컬럼 추가
    await queryInterface.addColumn('user', 'employment', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '직무 정보 (부서, 직책, 입사일 등)'
    });
    console.log('✅ employment 컬럼 추가 완료');
    
    // performance 컬럼 추가
    await queryInterface.addColumn('user', 'performance', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '성과 평가 정보'
    });
    console.log('✅ performance 컬럼 추가 완료');
    
    // education 컬럼 추가
    await queryInterface.addColumn('user', 'education', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '교육 이력 정보'
    });
    console.log('✅ education 컬럼 추가 완료');
    
    // skills 컬럼 추가
    await queryInterface.addColumn('user', 'skills', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '스킬 및 역량 정보'
    });
    console.log('✅ skills 컬럼 추가 완료');
    
    // attendance 컬럼 추가
    await queryInterface.addColumn('user', 'attendance', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '근태 정보'
    });
    console.log('✅ attendance 컬럼 추가 완료');
    
    // compensation 컬럼 추가
    await queryInterface.addColumn('user', 'compensation', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '보상 정보'
    });
    console.log('✅ compensation 컬럼 추가 완료');
    
    console.log('🎉 모든 컬럼 추가 완료!');
    console.log('=== 마이그레이션 성공 ===');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('데이터베이스 연결 종료');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  runUserProfileMigration()
    .then(() => {
      console.log('마이그레이션이 성공적으로 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('마이그레이션 실패:', error);
      process.exit(1);
    });
}

export default runUserProfileMigration;
