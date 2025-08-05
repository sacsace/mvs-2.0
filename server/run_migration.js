const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'database.sqlite');

// 마이그레이션 SQL 파일 경로
const migrationPath = path.join(__dirname, 'migrations', 'add_company_fields.sql');

console.log('데이터베이스 마이그레이션을 시작합니다...');
console.log('데이터베이스 경로:', dbPath);
console.log('마이그레이션 파일 경로:', migrationPath);

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
    process.exit(1);
  }
  console.log('데이터베이스에 연결되었습니다.');
});

// 마이그레이션 SQL 읽기
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// 마이그레이션 실행
db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('마이그레이션 실행 오류:', err.message);
    process.exit(1);
  }
  console.log('마이그레이션이 성공적으로 완료되었습니다.');
  
  // 데이터베이스 연결 종료
  db.close((err) => {
    if (err) {
      console.error('데이터베이스 연결 종료 오류:', err.message);
    } else {
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
    process.exit(0);
  });
}); 