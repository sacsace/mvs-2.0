// PostgreSQL과 SQLite 호환성 문제 해결 스크립트
const { Client } = require('pg');

async function fixPostgreSQLCompatibility() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔧 PostgreSQL 호환성 문제 수정 시작...');
    await client.connect();

    // 1. company 테이블의 is_deleted 컬럼 타입 확인
    console.log('📊 company 테이블 스키마 확인:');
    const companySchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'company' AND column_name = 'is_deleted'
    `);
    
    if (companySchema.rows.length > 0) {
      const col = companySchema.rows[0];
      console.log(`is_deleted 컬럼: ${col.data_type} (nullable: ${col.is_nullable})`);
    }

    // 2. company 테이블 데이터 확인
    console.log('\n📋 company 테이블 데이터:');
    const companies = await client.query(`
      SELECT company_id, name, is_deleted 
      FROM company 
      LIMIT 5
    `);
    
    companies.rows.forEach(company => {
      console.log(`회사 ${company.company_id}: ${company.name} (삭제됨: ${company.is_deleted})`);
    });

    // 3. boolean 컬럼을 올바르게 수정
    console.log('\n🔧 boolean 컬럼 수정 시도...');
    
    try {
      // is_deleted가 integer 타입이면 boolean으로 변경
      await client.query(`
        ALTER TABLE company 
        ALTER COLUMN is_deleted TYPE boolean 
        USING CASE WHEN is_deleted = 0 THEN false ELSE true END
      `);
      console.log('✅ company.is_deleted 컬럼을 boolean으로 변경 완료');
    } catch (alterError) {
      console.log('⚠️ 컬럼 타입 변경 건너뜀 (이미 boolean이거나 다른 이유)');
    }

    // 4. user 테이블도 동일하게 수정
    try {
      await client.query(`
        ALTER TABLE "user" 
        ALTER COLUMN is_deleted TYPE boolean 
        USING CASE WHEN is_deleted = 0 THEN false ELSE true END
      `);
      console.log('✅ user.is_deleted 컬럼을 boolean으로 변경 완료');
    } catch (alterError) {
      console.log('⚠️ user 컬럼 타입 변경 건너뜀');
    }

    // 5. 수정 후 테스트 쿼리
    console.log('\n🧪 수정 후 테스트:');
    const testQuery = await client.query(`
      SELECT company_id, name, is_deleted 
      FROM company 
      WHERE company_id = 6 AND is_deleted = false
    `);
    
    console.log(`✅ 테스트 쿼리 성공: ${testQuery.rows.length}개 회사 조회됨`);

    // 6. Jinwoo Lee 사용자의 메뉴 권한 다시 확인
    console.log('\n👤 Jinwoo Lee 메뉴 권한 재확인:');
    const menuPerms = await client.query(`
      SELECT COUNT(*) as total_permissions,
             SUM(CASE WHEN can_read = true THEN 1 ELSE 0 END) as read_permissions
      FROM menu_permission 
      WHERE user_id = 6
    `);
    
    const perm = menuPerms.rows[0];
    console.log(`총 권한: ${perm.total_permissions}개, 읽기 권한: ${perm.read_permissions}개`);

    console.log('\n🎉 PostgreSQL 호환성 문제 수정 완료!');
    console.log('이제 웹사이트를 새로고침해보세요.');

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await client.end();
  }
}

fixPostgreSQLCompatibility();
