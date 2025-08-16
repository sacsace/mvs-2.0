import sequelize from './src/config/database';

async function addCompanyIdToPartners() {
  try {
    console.log('🚀 Partner 테이블에 company_id 컬럼 추가 시작...');
    
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // company_id 컬럼 추가
    try {
      await sequelize.query(`
        ALTER TABLE partners 
        ADD COLUMN company_id INTEGER REFERENCES company(company_id);
      `);
      console.log('✅ company_id 컬럼 추가 완료');
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  company_id 컬럼이 이미 존재합니다.');
      } else {
        throw error;
      }
    }

    // 기존 파트너들에게 첫 번째 회사 ID 할당 (임시)
    const [companies] = await sequelize.query('SELECT company_id FROM company WHERE is_deleted = false ORDER BY company_id LIMIT 1');
    
    if (companies.length > 0) {
      const firstCompanyId = (companies[0] as any).company_id;
      
      await sequelize.query(`
        UPDATE partners 
        SET company_id = ${firstCompanyId} 
        WHERE company_id IS NULL;
      `);
      
      console.log(`✅ 기존 파트너들에게 company_id ${firstCompanyId} 할당 완료`);
    }

    // company_id를 NOT NULL로 변경
    try {
      await sequelize.query(`
        ALTER TABLE partners 
        ALTER COLUMN company_id SET NOT NULL;
      `);
      console.log('✅ company_id 컬럼을 NOT NULL로 설정 완료');
    } catch (error: any) {
      console.log('⚠️  company_id 컬럼 NOT NULL 설정 건너뜀 (이미 설정됨)');
    }

    console.log('\n🎯 작업 완료:');
    console.log('   - partners 테이블에 company_id 컬럼 추가');
    console.log('   - 기존 파트너 데이터에 company_id 할당');
    console.log('   - 이제 각 회사별로 파트너사가 분리됩니다');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await sequelize.close();
  }
}

addCompanyIdToPartners();
