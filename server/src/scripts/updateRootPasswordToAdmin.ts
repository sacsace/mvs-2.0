import { Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function updateRootPasswordToAdmin() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 새로운 비밀번호 해시 생성
    const newPassword = 'admin';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('새 비밀번호 해시 생성 완료');

    // root 사용자의 비밀번호 업데이트
    const [updateResult] = await sequelize.query(`
      UPDATE user 
      SET password = ?, update_date = CURRENT_TIMESTAMP
      WHERE username = 'root'
    `, {
      replacements: [hashedPassword]
    });

    console.log('비밀번호 업데이트 완료');

    // 업데이트된 사용자 정보 확인
    const [users] = await sequelize.query(`
      SELECT id, username, password, role, update_date
      FROM user 
      WHERE username = 'root'
    `);

    if (users.length > 0) {
      const user = users[0] as any;
      console.log('\n업데이트된 사용자 정보:');
      console.log('ID:', user.id);
      console.log('사용자명:', user.username);
      console.log('새 비밀번호 해시:', user.password);
      console.log('역할:', user.role);
      console.log('업데이트 날짜:', user.update_date);
      console.log('\n이제 root/admin으로 로그인할 수 있습니다.');
    } else {
      console.log('root 사용자를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

updateRootPasswordToAdmin(); 