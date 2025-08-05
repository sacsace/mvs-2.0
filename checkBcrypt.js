const bcrypt = require('bcryptjs');

const plain = 'root';
const hash = '$2a$10$6dsJhL2cgTsvwX0JajTDBe5B4g57fmXapPBLhMUBYt/rxua6qXYnG';

bcrypt.compare(plain, hash, function(err, res) {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('비밀번호가 일치합니까?', res); // true면 "root"가 맞음
  }
}); 