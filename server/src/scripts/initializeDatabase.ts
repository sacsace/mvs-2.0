import sequelize from '../config/database';
import logger from '../utils/logger';

async function initializeDatabase() {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // 모든 모델 동기화 (테이블 생성)
    await sequelize.sync({ force: false });
    logger.info('Database tables synchronized successfully.');

    logger.info('Database initialization completed.');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase; 