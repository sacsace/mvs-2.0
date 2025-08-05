const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('데이터베이스 스키마를 확인합니다...');
console.log('데이터베이스 경로:', dbPath);

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
    process.exit(1);
  }
  console.log('데이터베이스에 연결되었습니다.');
});

// company 테이블 스키마 확인
db.all("PRAGMA table_info(company)", (err, rows) => {
  if (err) {
    console.error('스키마 확인 오류:', err.message);
    process.exit(1);
  }
  
  console.log('\n=== Company 테이블 스키마 ===');
  rows.forEach(row => {
    console.log(`${row.cid}: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - ${row.dflt_value || 'no default'}`);
  });
  
  // 데이터베이스 연결 종료
  db.close((err) => {
    if (err) {
      console.error('데이터베이스 연결 종료 오류:', err.message);
    } else {
      console.log('\n데이터베이스 연결이 종료되었습니다.');
    }
    process.exit(0);
  });
}); 