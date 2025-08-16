// JWT 토큰 캐시 문제 디버깅 스크립트
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

async function debugTokenCache() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 JWT 토큰 캐시 문제 디버깅...');
    await client.connect();

    // 1. 데이터베이스에서 실제 권한 확인
    console.log('📊 데이터베이스 실제 권한:');
    const dbPerms = await client.query(`
      SELECT 
        COUNT(*) as total_permissions,
        SUM(CASE WHEN can_read = true THEN 1 ELSE 0 END) as read_permissions,
        string_agg(DISTINCT m.name, ', ') as menu_names
      FROM menu_permission mp
      JOIN menu m ON mp.menu_id = m.menu_id
      WHERE mp.user_id = 6 AND mp.can_read = true
    `);
    
    const db = dbPerms.rows[0];
    console.log(`DB 총 권한: ${db.total_permissions}개`);
    console.log(`DB 읽기 권한: ${db.read_permissions}개`);
    console.log(`읽기 가능 메뉴: ${db.menu_names}`);

    // 2. 메뉴 조회 시뮬레이션
    console.log('\n🔍 메뉴 조회 API 시뮬레이션:');
    const menuQuery = await client.query(`
      SELECT m.*, mp.can_read
      FROM menu m
      LEFT JOIN menu_permission mp ON m.menu_id = mp.menu_id AND mp.user_id = 6
      WHERE mp.can_read = true OR mp.can_read IS NULL
      ORDER BY m.order_num
    `);
    
    console.log(`API 반환 메뉴 수: ${menuQuery.rows.length}개`);
    menuQuery.rows.forEach(menu => {
      console.log(`- ${menu.name} (ID: ${menu.menu_id}) - 읽기권한: ${menu.can_read}`);
    });

    // 3. 사용자 정보 확인
    console.log('\n👤 사용자 정보:');
    const userInfo = await client.query(`
      SELECT id, userid, username, role, company_id, is_deleted
      FROM "user"
      WHERE id = 6
    `);
    
    if (userInfo.rows.length > 0) {
      const user = userInfo.rows[0];
      console.log(`사용자: ${user.username} (${user.userid})`);
      console.log(`역할: ${user.role}, 회사: ${user.company_id}`);
      console.log(`활성상태: ${!user.is_deleted}`);
    }

    // 4. 해결책 제시
    console.log('\n💡 해결책:');
    console.log('1. 강제 로그아웃 후 재로그인');
    console.log('2. 브라우저 캐시 삭제');
    console.log('3. 서버 재시작');

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await client.end();
  }
}

debugTokenCache();
