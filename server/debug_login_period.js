const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== 로그인 기간 체크 디버깅 ===\n');

// 실제 서버 로직과 동일한 쿼리 실행
db.get(`
  SELECT login_period_start, login_period_end 
  FROM company 
  WHERE company_id = ? AND is_deleted = 0
`, [2], (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('서버 쿼리 결과:');
    console.log('login_period_start:', row.login_period_start);
    console.log('login_period_end:', row.login_period_end);
    console.log('시작일 타입:', typeof row.login_period_start);
    console.log('종료일 타입:', typeof row.login_period_end);
    
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('\n현재 날짜:', currentDate);
    
    // 서버 로직과 동일한 체크
    if (row) {
      const { login_period_start, login_period_end } = row;
      
      console.log('\n=== 로그인 기간 체크 ===');
      
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
        } else {
          console.log('시작일 체크 조건 불만족:', {
            hasValue: !!login_period_start,
            isInvalidDate: login_period_start === 'Invalid date',
            isNull: login_period_start === null
          });
        }
        
        // 종료일 체크
        if (login_period_end && login_period_end !== 'Invalid date' && login_period_end !== null) {
          console.log('종료일 체크 조건 만족');
          if (currentDate > login_period_end) {
            console.log('❌ 로그인 차단: 종료일 이후');
          } else {
            console.log('✅ 종료일 체크 통과');
          }
        } else {
          console.log('종료일 체크 조건 불만족:', {
            hasValue: !!login_period_end,
            isInvalidDate: login_period_end === 'Invalid date',
            isNull: login_period_end === null
          });
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