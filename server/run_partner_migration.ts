import sequelize from './src/config/database';
import { up } from './src/migrations/20241217000001-separate-company-partner';

async function runMigration() {
  try {
    console.log('🚀 회사-파트너 분리 마이그레이션 시작...');
    
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    console.log('📋 마이그레이션 실행 중...');
    await up(sequelize.getQueryInterface());
    
    console.log('✅ 마이그레이션 완료!');
    console.log('📊 변경사항:');
    console.log('   - partners 테이블 생성');
    console.log('   - 기존 파트너 데이터를 partners 테이블로 이전');
    console.log('   - company 테이블에서 파트너 관련 컬럼 제거');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();
