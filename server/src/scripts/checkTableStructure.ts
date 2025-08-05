import sequelize from '../config/database';

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 회사 테이블 구조 확인
    console.log('\n회사 테이블 구조:');
    console.log('===============');
    const tableInfo = await sequelize.query("PRAGMA table_info(company);");
    console.log(tableInfo[0]);

    // 회사 데이터 확인 (raw query)
    console.log('\n현재 회사 데이터:');
    console.log('===============');
    const companies = await sequelize.query("SELECT * FROM company WHERE is_deleted = 0;");
    console.log(companies[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure(); 