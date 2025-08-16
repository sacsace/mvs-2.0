// Railway에서 직접 실행할 수 있는 간단한 스크립트
const { Sequelize } = require('sequelize');

// Railway 환경변수에서 데이터베이스 URL 가져오기
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log
});

async function fixJinwooPermissions() {
  try {
    console.log('🔧 Jinwoo Lee 사용자 권한 수정 시작...');
    
    // 기존 권한 삭제
    console.log('1. 기존 권한 삭제 중...');
    await sequelize.query('DELETE FROM menu_permission WHERE user_id = 6');
    
    // 모든 메뉴에 권한 부여
    console.log('2. 새 권한 부여 중...');
    await sequelize.query(`
      INSERT INTO menu_permission (user_id, menu_id, can_read, can_create, can_update, can_delete, create_date)
      SELECT 
          6 as user_id,
          menu_id,
          true as can_read,
          true as can_create, 
          true as can_update,
          false as can_delete,
          NOW() as create_date
      FROM menu
      WHERE menu_id IS NOT NULL
    `);
    
    // 결과 확인
    console.log('3. 결과 확인 중...');
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN can_read THEN 1 ELSE 0 END) as readable
      FROM menu_permission 
      WHERE user_id = 6
    `);
    
    console.log('✅ 완료!');
    console.log(`📊 부여된 권한: ${results[0].total}개`);
    console.log(`📖 읽기 권한: ${results[0].readable}개`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await sequelize.close();
  }
}

fixJinwooPermissions();
