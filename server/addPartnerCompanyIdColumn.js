const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function addPartnerCompanyIdColumn() {
  try {
    console.log('데이터베이스 연결 시작...');
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // partner_company_id 컬럼 추가
    await sequelize.query(`
      ALTER TABLE company ADD COLUMN partner_company_id INTEGER REFERENCES company(company_id)
    `);
    console.log('partner_company_id 컬럼 추가 완료');

    // 테이블 구조 확인
    const [columns] = await sequelize.query(`
      PRAGMA table_info(company)
    `);
    
    console.log('\ncompany 테이블 구조:');
    columns.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

addPartnerCompanyIdColumn(); 