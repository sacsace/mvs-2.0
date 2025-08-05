import sequelize from '../config/database';

async function checkRootUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 모든 사용자 정보 조회
    const [users] = await sequelize.query(`
      SELECT id, username, password, company_id, role, is_deleted, create_date, update_date 
      FROM "user"
    `);

    console.log('\nAll users in database:');
    console.log('---------------------');
    users.forEach((user: any) => {
      console.log(JSON.stringify(user, null, 2));
    });

    // root 사용자 특별 조회
    const [rootUsers] = await sequelize.query(`
      SELECT id, username, password, company_id, role, is_deleted, create_date, update_date 
      FROM "user" 
      WHERE username = 'root' AND is_deleted = false
    `);

    console.log('\nRoot user details:');
    console.log('-----------------');
    if (rootUsers.length === 0) {
      console.log('Root user not found');
    } else {
      console.log(JSON.stringify(rootUsers[0], null, 2));
    }

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
checkRootUser(); 