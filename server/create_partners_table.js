const sequelize = require('./dist/config/database.js').default;
const Partner = require('./dist/models/Partner.js').default;

async function createPartnersTable() {
  try {
    console.log('🔗 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    console.log('🔧 Partners 테이블 생성 중...');
    await Partner.sync({ force: false, alter: true });
    console.log('✅ Partners 테이블 생성 완료');

    // 테이블 확인
    const [results] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partners' ORDER BY ordinal_position;"
    );
    
    console.log('📋 Partners 테이블 구조:');
    results.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
  } catch (error) {
    console.error('❌ Partners 테이블 생성 실패:', error);
  } finally {
    await sequelize.close();
  }
}

createPartnersTable();
