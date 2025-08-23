import sequelize from './src/config/database';
import PushSubscription from './src/models/PushSubscription';

async function createPushTable() {
  try {
    console.log('데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    console.log('푸시 구독 테이블 생성 중...');
    
    // 테이블 생성 (force: false로 기존 테이블이 있으면 유지)
    await PushSubscription.sync({ force: false });
    
    console.log('✅ 푸시 구독 테이블이 성공적으로 생성되었습니다.');
    
    // 연결 종료
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 푸시 구독 테이블 생성 실패:', error);
    process.exit(1);
  }
}

createPushTable();
