const sequelize = require('./dist/config/database.js').default;

// 모든 모델들 임포트
require('./dist/models/Company.js');
require('./dist/models/User.js');  
require('./dist/models/Menu.js');
require('./dist/models/MenuPermission.js');
require('./dist/models/Approval.js');
require('./dist/models/ApprovalComment.js');
require('./dist/models/ApprovalFile.js');
require('./dist/models/Invoice.js');
require('./dist/models/Transaction.js');
require('./dist/models/Permission.js');
require('./dist/models/Role.js');
require('./dist/models/RolePermission.js');
require('./dist/models/UserPermission.js');
require('./dist/models/CompanyGst.js');

async function syncAllModels() {
  try {
    console.log('🔗 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    console.log('🔧 모든 모델 동기화 중...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ 모든 모델 동기화 완료');

    // 테이블 목록 확인
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    
    console.log('📋 동기화된 테이블 목록:');
    results.forEach(row => console.log(`  - ${row.table_name}`));
    
    console.log(`\n✅ 총 ${results.length}개 테이블 동기화 완료`);
    
  } catch (error) {
    console.error('❌ 모델 동기화 실패:', error);
  } finally {
    await sequelize.close();
  }
}

syncAllModels();
