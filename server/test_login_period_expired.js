const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 로그인 기간 만료 테스트 (인도 시간 기준) ===\n');

// 인도 시간 기준으로 현재 날짜 계산
const now = new Date();
const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // UTC+5:30 (인도 시간)
const currentDate = indiaTime.toISOString().split('T')[0]; // YYYY-MM-DD 형식

console.log('UTC 시간:', now.toISOString());
console.log('인도 시간:', indiaTime.toISOString());
console.log('현재 날짜 (인도 기준):', currentDate);

// company_id가 2인 회사의 로그인 기간 확인
db.get(`
  SELECT company_id, name, login_period_start, login_period_end 
  FROM company 
  WHERE company_id = 2
`, (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('회사 정보:');
    console.log('Company ID:', row.company_id);
    console.log('회사명:', row.name);
    console.log('로그인 시작일:', row.login_period_start);
    console.log('로그인 종료일:', row.login_period_end);
    
    // 서버 로직과 동일한 체크
    if (row) {
      const { login_period_start, login_period_end } = row;
      
      console.log('\n=== 로그인 기간 체크 (8월 5일 기준) ===');
      
      if (login_period_start || login_period_end) {
        console.log('로그인 기간이 설정되어 있음');
        
        // 시작일 체크
        if (login_period_start && login_period_start !== 'Invalid date' && login_period_start !== null) {
          console.log('시작일 체크 조건 만족');
          if (currentDate < login_period_start) {
            console.log('❌ 로그인 차단: 시작일 이전');
          } else {
            console.log('✅ 시작일 체크 통과');
          }
        }
        
        // 종료일 체크
        if (login_period_end && login_period_end !== 'Invalid date' && login_period_end !== null) {
                  console.log('종료일 체크 조건 만족');
        if (currentDate > login_period_end) {
          console.log('❌ 로그인 차단: 종료일 이후');
          console.log('로그인이 차단되어야 합니다!');
        } else {
          console.log('✅ 종료일 체크 통과');
        }
        }
      } else {
        console.log('로그인 기간이 설정되어 있지 않음');
      }
    } else {
      console.log('회사 정보를 찾을 수 없음');
    }
  }
  
  db.close();
}); 