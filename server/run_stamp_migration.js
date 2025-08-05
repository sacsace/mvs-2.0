const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'database.sqlite');

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
    return;
  }
  console.log('데이터베이스에 연결되었습니다.');
});

// 마이그레이션 실행
const migrationSQL = `
ALTER TABLE company ADD COLUMN stamp_url VARCHAR(500);
`;

db.run(migrationSQL, function(err) {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('stamp_url 컬럼이 이미 존재합니다.');
    } else {
      console.error('마이그레이션 실행 오류:', err.message);
    }
  } else {
    console.log('stamp_url 컬럼이 성공적으로 추가되었습니다.');
  }
  
  // 데이터베이스 연결 종료
  db.close((err) => {
    if (err) {
      console.error('데이터베이스 연결 종료 오류:', err.message);
    } else {
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
  });
}); 