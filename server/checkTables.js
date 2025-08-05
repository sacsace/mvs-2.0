const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 테이블 목록 조회
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    console.log('데이터베이스 테이블 목록:');
    tables.forEach(table => {
      console.log('-', table.name);
    });

    // user 테이블 구조 확인
    if (tables.some(t => t.name === 'user')) {
      console.log('\nuser 테이블 구조:');
      const [columns] = await sequelize.query('PRAGMA table_info(user)');
      columns.forEach(col => {
        console.log(`- ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
      });
    }

    // users 테이블 구조 확인
    if (tables.some(t => t.name === 'users')) {
      console.log('\nusers 테이블 구조:');
      const [columns] = await sequelize.query('PRAGMA table_info(users)');
      columns.forEach(col => {
        console.log(`- ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
      });
    }

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables(); 