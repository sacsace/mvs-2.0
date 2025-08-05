import sequelize from '../config/database';

async function resetDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 모든 테이블 데이터 삭제 (외래키 순서 주의)
    await sequelize.query('TRUNCATE TABLE "menu", "user", "company" RESTART IDENTITY CASCADE;');
    console.log('All data has been deleted (TRUNCATE) from menu, user, company.');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await sequelize.close();
  }
}

resetDatabase(); 