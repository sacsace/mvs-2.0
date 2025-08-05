const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkUserData() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    const [results] = await sequelize.query(`
      SELECT id, userid, username, role FROM user
    `);
    
    console.log('\n=== 사용자 데이터 ===');
    results.forEach(user => {
      console.log(`ID: ${user.id}, UserID: ${user.userid}, Username: ${user.username}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkUserData(); 