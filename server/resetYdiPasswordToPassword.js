const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function resetYdiPasswordToPassword() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 새 비밀번호 설정
    const newPassword = 'password';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('새 비밀번호:', newPassword);
    console.log('해시된 비밀번호:', hashedPassword);

    // ydi 사용자 비밀번호 업데이트
    const [result] = await sequelize.query(`
      UPDATE user 
      SET password = ?, update_date = datetime('now')
      WHERE username = 'ydi'
    `, {
      replacements: [hashedPassword]
    });

    console.log('업데이트 결과:', result);

    // 업데이트 확인
    const [user] = await sequelize.query(`
      SELECT id, username, password, role, company_id, default_language, update_date
      FROM user 
      WHERE username = 'ydi'
    `);

    if (user.length > 0) {
      console.log('\n업데이트된 ydi 사용자 정보:');
      console.log('- ID:', user[0].id);
      console.log('- 사용자명:', user[0].username);
      console.log('- 새 비밀번호 해시:', user[0].password);
      console.log('- 역할:', user[0].role);
      console.log('- 회사 ID:', user[0].company_id);
      console.log('- 기본 언어:', user[0].default_language);
      console.log('- 수정일:', user[0].update_date);

      // 비밀번호 확인 테스트
      const isMatch = await bcrypt.compare(newPassword, user[0].password);
      console.log('\n비밀번호 확인 테스트:');
      console.log('- 새 비밀번호:', newPassword);
      console.log('- 일치 여부:', isMatch);
    }

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

resetYdiPasswordToPassword(); 