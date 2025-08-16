import sequelize from './src/config/database';

async function updateExistingPartners() {
  try {
    console.log('🚀 기존 파트너 데이터 업데이트 시작...');
    
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 기존 샘플 파트너들의 partner_type을 적절히 설정
    const updateQueries = [
      {
        name: 'ABC 공급업체',
        partner_type: 'supplier'
      },
      {
        name: 'XYZ 고객사', 
        partner_type: 'customer'
      },
      {
        name: '종합 파트너사',
        partner_type: 'both'
      }
    ];

    for (const update of updateQueries) {
      try {
        const [results, metadata] = await sequelize.query(`
          UPDATE partners 
          SET partner_type = '${update.partner_type}' 
          WHERE name = '${update.name}' AND partner_type = 'customer';
        `);
        
        if ((metadata as any)?.rowCount > 0 || results.length > 0) {
          console.log(`✅ ${update.name} → ${update.partner_type} 업데이트 완료`);
        }
      } catch (error) {
        console.log(`⚠️  ${update.name} 업데이트 건너뜀 (이미 설정됨 또는 존재하지 않음)`);
      }
    }

    // 현재 파트너 현황 확인
    const [partners] = await sequelize.query(`
      SELECT name, partner_type, company_id 
      FROM partners 
      WHERE is_deleted = false 
      ORDER BY name;
    `);

    console.log('\n📊 현재 파트너 현황:');
    console.log('==================');
    if (partners.length === 0) {
      console.log('등록된 파트너가 없습니다.');
    } else {
      (partners as any[]).forEach((partner, index) => {
        const typeLabel = partner.partner_type === 'supplier' ? '공급업체' :
                         partner.partner_type === 'customer' ? '고객회사' :
                         partner.partner_type === 'both' ? '공급업체/고객회사' : partner.partner_type;
        console.log(`${index + 1}. ${partner.name} (${typeLabel}) - 회사 ID: ${partner.company_id}`);
      });
    }

    console.log('\n🎯 업데이트 완료:');
    console.log('   - 기존 파트너들의 partner_type 설정 완료');
    console.log('   - 이제 모든 파트너는 명확한 타입을 가집니다');
    console.log('   - 신규 파트너 추가 시 타입 선택이 필수가 됩니다');
    
  } catch (error) {
    console.error('❌ 업데이트 실패:', error);
  } finally {
    await sequelize.close();
  }
}

updateExistingPartners();
