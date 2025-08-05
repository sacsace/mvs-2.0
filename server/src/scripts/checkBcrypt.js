const bcrypt = require('bcrypt');

async function checkPassword() {
  const hashedPassword = '$2a$10$yZ.0oH.HuZd0S3H54rFYZeVJnHGrGgABLcwgC3tHx4q.wj/J8FdGG';
  
  const testPasswords = [
    'root',
    'admin',
    'password',
    'admin123',
    '123456',
    'root123',
    'admin1234',
    'password123'
  ];
  
  console.log('비밀번호 확인 시작...');
  console.log('해시된 비밀번호:', hashedPassword);
  console.log('');
  
  for (const password of testPasswords) {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      console.log(`비밀번호 "${password}": ${isMatch ? '일치' : '불일치'}`);
    } catch (error) {
      console.log(`비밀번호 "${password}": 오류 - ${error.message}`);
    }
  }
}

checkPassword(); 