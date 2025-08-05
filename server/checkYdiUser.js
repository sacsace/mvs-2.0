const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkYdiUser() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // ydi 사용자 조회
    const [results] = await sequelize.query(`
      SELECT id, username, password, role, company_id, default_language, is_deleted, create_date, update_date
      FROM user 
      WHERE username = 'ydi'
    `);

    if (results.length === 0) {
      console.log('ydi 사용자가 존재하지 않습니다.');
      return;
    }

    const user = results[0];
    console.log('ydi 사용자 정보:');
    console.log('- ID:', user.id);
    console.log('- 사용자명:', user.username);
    console.log('- 비밀번호 해시:', user.password);
    console.log('- 역할:', user.role);
    console.log('- 회사 ID:', user.company_id);
    console.log('- 기본 언어:', user.default_language);
    console.log('- 삭제 여부:', user.is_deleted);
    console.log('- 생성일:', user.create_date);
    console.log('- 수정일:', user.update_date);

    // 비밀번호 테스트
    const testPassword = 'admin';
    console.log('\n비밀번호 테스트:');
    console.log('- 테스트 비밀번호:', testPassword);
    
    if (user.password) {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('- 비밀번호 일치 여부:', isMatch);
    } else {
      console.log('- 비밀번호가 설정되지 않음');
    }

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkYdiUser(); 