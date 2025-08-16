import sequelize from './src/config/database';
import { QueryTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

const checkJwitsPassword = async () => {
  console.log('🔍 Jinwoo Lee (jwits) 비밀번호 확인...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    const users = await sequelize.query(`
      SELECT id, userid, username, password 
      FROM "user" 
      WHERE userid = 'jwits'
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    if (users.length === 0) {
      console.log('❌ jwits 사용자를 찾을 수 없습니다.');
      return;
    }

    const user = users[0];
    console.log(`\n👤 사용자 정보:`);
    console.log(`ID: ${user.id}`);
    console.log(`UserID: ${user.userid}`);
    console.log(`Username: ${user.username}`);
    console.log(`Password Hash: ${user.password}`);

    // 일반적인 비밀번호들 테스트
    const passwords = ['admin', 'password', 'jwits', '123456', 'Jinwoo', 'lee'];
    
    console.log('\n🔐 비밀번호 테스트:');
    for (const pwd of passwords) {
      const isMatch = await bcrypt.compare(pwd, user.password);
      console.log(`  ${pwd}: ${isMatch ? '✅ 맞음' : '❌ 틀림'}`);
      if (isMatch) {
        console.log(`\n🎉 올바른 비밀번호를 찾았습니다: "${pwd}"`);
        break;
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
};

checkJwitsPassword();
