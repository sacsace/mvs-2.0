const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function addUseridColumn() {
  try {
    console.log('데이터베이스 연결 시작...');
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // userid 컬럼 추가
    await sequelize.query(`
      ALTER TABLE user ADD COLUMN userid VARCHAR(50)
    `);
    console.log('userid 컬럼 추가 완료');

    // 기존 username을 userid로 복사
    await sequelize.query(`
      UPDATE user SET userid = username WHERE userid IS NULL
    `);
    console.log('기존 username을 userid로 복사 완료');

    // username을 실제 이름으로 변경 (기존 데이터는 임시로 '사용자'로 설정)
    await sequelize.query(`
      UPDATE user SET username = '사용자' || id WHERE username = userid
    `);
    console.log('username을 실제 이름으로 변경 완료');

    // userid 컬럼을 NOT NULL로 설정
    await sequelize.query(`
      CREATE TABLE user_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid VARCHAR(50) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        company_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL,
        default_language VARCHAR(10) NOT NULL DEFAULT 'ko',
        is_deleted BOOLEAN DEFAULT 0,
        create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('임시 테이블 생성 완료');

    // 데이터 복사
    await sequelize.query(`
      INSERT INTO user_temp 
      SELECT id, userid, username, password, company_id, role, default_language, is_deleted, create_date, update_date 
      FROM user
    `);
    console.log('데이터 복사 완료');

    // 기존 테이블 삭제
    await sequelize.query(`DROP TABLE user`);
    console.log('기존 테이블 삭제 완료');

    // 새 테이블 이름 변경
    await sequelize.query(`ALTER TABLE user_temp RENAME TO user`);
    console.log('테이블 이름 변경 완료');

    // 테이블 구조 확인
    const [results] = await sequelize.query(`
      PRAGMA table_info(user)
    `);
    console.log('\n=== user 테이블 구조 ===');
    results.forEach(row => {
      console.log(`${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
    });

    // 데이터 확인
    const [users] = await sequelize.query(`
      SELECT id, userid, username, role, company_id FROM user
    `);
    console.log('\n=== 사용자 데이터 ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}, UserID: ${user.userid}, Username: ${user.username}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

addUseridColumn(); 