import sequelize from './src/config/database';
import { QueryTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

const resetJwitsPassword = async () => {
  console.log('🔄 Jinwoo Lee (jwits) 비밀번호 리셋...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 새 비밀번호: 'admin'
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`🔐 새 비밀번호: ${newPassword}`);
    console.log(`🔐 해시된 비밀번호: ${hashedPassword}`);

    // 비밀번호 업데이트
    await sequelize.query(`
      UPDATE "user" 
      SET password = ? 
      WHERE userid = 'jwits'
    `, {
      replacements: [hashedPassword],
      type: QueryTypes.UPDATE
    });

    console.log('✅ 비밀번호 업데이트 완료');

    // 검증
    const users = await sequelize.query(`
      SELECT id, userid, username 
      FROM "user" 
      WHERE userid = 'jwits'
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    if (users.length > 0) {
      console.log(`\n✅ 업데이트 확인:`);
      console.log(`사용자: ${users[0].username} (${users[0].userid})`);
      console.log(`새 비밀번호: ${newPassword}`);
      console.log(`\n🎉 이제 jwits / admin 으로 로그인할 수 있습니다!`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
};

resetJwitsPassword();
