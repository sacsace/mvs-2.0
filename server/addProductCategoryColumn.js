const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function addProductCategoryColumn() {
  try {
    console.log('데이터베이스 연결 시작...');
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // product_category 컬럼 추가
    await sequelize.query(`
      ALTER TABLE company ADD COLUMN product_category TEXT
    `);
    console.log('product_category 컬럼 추가 완료');

    // 테이블 구조 확인
    const [results] = await sequelize.query(`
      PRAGMA table_info(company)
    `);
    console.log('\n=== company 테이블 구조 ===');
    results.forEach(row => {
      console.log(`${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

addProductCategoryColumn(); 