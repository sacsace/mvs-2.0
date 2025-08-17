const { Sequelize } = require('sequelize');

// PostgreSQL 연결
const sequelize = new Sequelize('postgresql://postgres:postgres@localhost:5432/mvs', {
  dialect: 'postgres',
  logging: console.log,
});

async function createAllTables() {
  try {
    console.log('🔗 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    console.log('🔧 모든 테이블 생성 중...');
    // force: true로 기존 테이블 삭제 후 재생성
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ 모든 테이블 생성 완료');

    // 테이블 목록 확인
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    
    console.log('📋 생성된 테이블 목록:');
    results.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
  } finally {
    await sequelize.close();
  }
}

createAllTables();
