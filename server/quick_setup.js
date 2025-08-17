const { execSync } = require('child_process');

console.log('🔧 PostgreSQL을 사용한 빠른 초기화 시작...');

const commands = [
  // 1. 회사 생성
  `psql -U postgres -d mvs -c "INSERT INTO company (name, coi, is_deleted, create_date, update_date) VALUES ('Minsub Ventures Private Limited', 'MSV001', false, NOW(), NOW()) ON CONFLICT DO NOTHING;"`,
  
  // 2. 관리자 계정 생성 (비밀번호: admin)
  `psql -U postgres -d mvs -c "INSERT INTO \"user\" (userid, username, password, company_id, role, default_language, is_deleted, create_date, update_date) VALUES ('admin', 'System Administrator', '\\$2a\\$10\\$CwTycUXWue0Thq9StjUM0ug5mYq9N9.cKS1W6B5.M.8X3JhKwdmVu', 1, 'root', 'ko', false, NOW(), NOW()) ON CONFLICT (userid) DO NOTHING;"`,
  
  // 3. 기본 메뉴 생성
  `psql -U postgres -d mvs -c "INSERT INTO menu (name, url, parent_id, order_num, create_date, update_date) VALUES ('회사 정보 관리', '/company', NULL, 1, NOW(), NOW()), ('전자결재', '/approval', NULL, 2, NOW(), NOW()), ('사용자 목록', '/users', NULL, 3, NOW(), NOW()), ('메뉴 권한 관리', '/menu-permissions', NULL, 4, NOW(), NOW()) ON CONFLICT DO NOTHING;"`,
];

try {
  // PostgreSQL 환경변수 설정
  process.env.PGPASSWORD = 'postgres';
  
  for (const cmd of commands) {
    console.log(`실행 중: ${cmd.substring(0, 50)}...`);
    execSync(cmd, { stdio: 'inherit' });
  }
  
  console.log('✅ 빠른 초기화 완료!');
  console.log('👤 관리자 계정: admin / admin');
  console.log('🌐 접속: http://localhost:3000');
  
} catch (error) {
  console.error('❌ 초기화 실패:', error.message);
}
