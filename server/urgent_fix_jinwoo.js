// Railway 긴급 권한 수정 스크립트
const { Client } = require('pg');

async function urgentFixJinwoo() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚨 긴급 권한 수정 시작...');
    await client.connect();

    // 1. 현재 상태 확인
    console.log('📊 현재 Jinwoo Lee 권한 상태:');
    const currentPerms = await client.query(`
      SELECT mp.*, m.name as menu_name 
      FROM menu_permission mp 
      JOIN menu m ON mp.menu_id = m.menu_id 
      WHERE mp.user_id = 6
      ORDER BY mp.menu_id
    `);
    
    console.log(`총 권한: ${currentPerms.rows.length}개`);
    currentPerms.rows.forEach(row => {
      console.log(`메뉴 ${row.menu_id} (${row.menu_name}): R:${row.can_read} C:${row.can_create} U:${row.can_update} D:${row.can_delete}`);
    });

    // 2. 모든 권한을 읽기 가능으로 업데이트
    console.log('🔧 모든 권한을 읽기 가능으로 수정 중...');
    const updateResult = await client.query(`
      UPDATE menu_permission 
      SET can_read = true, can_create = true, can_update = true 
      WHERE user_id = 6
    `);
    
    console.log(`✅ ${updateResult.rowCount}개 권한 업데이트 완료`);

    // 3. 부족한 메뉴 권한 추가
    console.log('📝 부족한 메뉴 권한 추가 중...');
    const addResult = await client.query(`
      INSERT INTO menu_permission (user_id, menu_id, can_read, can_create, can_update, can_delete, create_date)
      SELECT 
          6 as user_id,
          m.menu_id,
          true as can_read,
          true as can_create, 
          true as can_update,
          false as can_delete,
          NOW() as create_date
      FROM menu m
      WHERE m.menu_id NOT IN (
          SELECT menu_id FROM menu_permission WHERE user_id = 6
      )
    `);
    
    console.log(`✅ ${addResult.rowCount}개 새 권한 추가 완료`);

    // 4. 최종 확인
    console.log('📊 최종 권한 상태:');
    const finalPerms = await client.query(`
      SELECT 
        COUNT(*) as total_permissions,
        SUM(CASE WHEN can_read THEN 1 ELSE 0 END) as read_permissions
      FROM menu_permission 
      WHERE user_id = 6
    `);
    
    const final = finalPerms.rows[0];
    console.log(`🎉 완료! 총 권한: ${final.total_permissions}개, 읽기 권한: ${final.read_permissions}개`);

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await client.end();
  }
}

urgentFixJinwoo();
