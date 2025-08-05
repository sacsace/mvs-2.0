import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkUserTable() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // user 테이블 구조 확인
    console.log('\n=== user 테이블 구조 ===');
    const [userColumns] = await sequelize.query("PRAGMA table_info(user)");
    console.log('컬럼 정보:');
    userColumns.forEach((column: any) => {
      console.log(`- ${column.name}: ${column.type} (PK: ${column.pk}, NOT NULL: ${column.notnull})`);
    });

    // user 테이블 데이터 확인
    console.log('\n=== user 테이블 데이터 ===');
    const [users] = await sequelize.query("SELECT * FROM user");
    console.log('사용자 데이터:', users);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkUserTable(); 