import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkMenuTable() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 메뉴 테이블 구조 확인
    const [columns] = await sequelize.query("PRAGMA table_info(menu)");
    
    console.log('\n메뉴 테이블 구조:');
    console.log('================');
    columns.forEach((column: any) => {
      console.log(`${column.name} (${column.type}) - NOT NULL: ${column.notnull}, DEFAULT: ${column.dflt_value}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkMenuTable(); 