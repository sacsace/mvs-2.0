const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 로그인 기간 데이터 확인 ===\n');

// company_id가 2인 회사의 로그인 기간 확인
db.get(`
  SELECT company_id, name, login_period_start, login_period_end, 
         typeof(login_period_start) as start_type, 
         typeof(login_period_end) as end_type
  FROM company 
  WHERE company_id = 2
`, (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('회사 정보:');
    console.log('Company ID:', row.company_id);
    console.log('회사명:', row.name);
    console.log('로그인 시작일:', row.login_period_start, `(타입: ${row.start_type})`);
    console.log('로그인 종료일:', row.login_period_end, `(타입: ${row.end_type})`);
    
    // 날짜 변환 테스트
    console.log('\n=== 날짜 변환 테스트 ===');
    if (row.login_period_start) {
      const startDate = new Date(row.login_period_start);
      console.log('시작일 변환 결과:', startDate);
      console.log('시작일 유효성:', !isNaN(startDate.getTime()));
    }
    
    if (row.login_period_end) {
      const endDate = new Date(row.login_period_end);
      console.log('종료일 변환 결과:', endDate);
      console.log('종료일 유효성:', !isNaN(endDate.getTime()));
    }
    
    // 현재 날짜와 비교
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('\n현재 날짜:', currentDate);
    
    if (row.login_period_start && row.login_period_start !== 'Invalid date') {
      console.log('시작일 비교:', currentDate < row.login_period_start ? '시작 전' : '시작됨');
    }
    
    if (row.login_period_end && row.login_period_end !== 'Invalid date') {
      console.log('종료일 비교:', currentDate > row.login_period_end ? '만료됨' : '유효함');
    }
  }
  
  db.close();
}); 