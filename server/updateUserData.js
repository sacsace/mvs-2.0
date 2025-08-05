const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function updateUserData() {
  try {
    console.log('데이터베이스 연결 시작...');
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 현재 사용자 데이터 확인
    const [users] = await sequelize.query(`
      SELECT id, userid, username, role, company_id FROM user
    `);
    console.log('\n=== 현재 사용자 데이터 ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}, UserID: ${user.userid}, Username: ${user.username}, Role: ${user.role}`);
    });

    // userid가 NULL인 경우 username으로 설정
    await sequelize.query(`
      UPDATE user SET userid = username WHERE userid IS NULL
    `);
    console.log('userid 업데이트 완료');

    // username을 실제 이름으로 변경 (기존 데이터는 임시로 '사용자'로 설정)
    await sequelize.query(`
      UPDATE user SET username = '사용자' || id WHERE username = userid
    `);
    console.log('username 업데이트 완료');

    // 업데이트된 데이터 확인
    const [updatedUsers] = await sequelize.query(`
      SELECT id, userid, username, role, company_id FROM user
    `);
    console.log('\n=== 업데이트된 사용자 데이터 ===');
    updatedUsers.forEach(user => {
      console.log(`ID: ${user.id}, UserID: ${user.userid}, Username: ${user.username}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

updateUserData(); 