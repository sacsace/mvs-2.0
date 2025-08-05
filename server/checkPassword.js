const bcrypt = require('bcryptjs');

async function checkPassword() {
  try {
    const password = 'admin';
    const hash = '$2a$10$cy2N.Qf9yOlDTyKDl6okAex6CwJadQ7UEKvHX21c1iug0r7AB1svu';
    
    console.log('입력 비밀번호:', password);
    console.log('저장된 해시:', hash);
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('비밀번호 일치 여부:', isValid);
    
    // 새로운 해시 생성
    const newHash = await bcrypt.hash(password, 10);
    console.log('새로 생성된 해시:', newHash);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPassword(); 