import sequelize from './src/config/database';
import Partner from './src/models/Partner';

async function createPartnersTable() {
  try {
    console.log('🚀 Partners 테이블 생성 시작...');
    
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    // Partners 테이블 생성
    await Partner.sync({ force: false });
    console.log('✅ Partners 테이블 생성 완료');
    
    // 샘플 파트너 데이터 추가
    const samplePartners = [
      {
        name: 'ABC 공급업체',
        partner_type: 'supplier' as const,
        coi: 'SUPPLIER001',
        email: 'contact@abc-supplier.com',
        phone: '02-1234-5678',
        address: '서울시 강남구 테헤란로 123',
        contact_person: '김공급',
        contact_designation: '영업부장',
        contact_phone: '010-1234-5678',
        contact_email: 'kim@abc-supplier.com',
        payment_terms: '월말결제',
        credit_limit: 10000000,
        is_active: true,
        is_deleted: false
      },
      {
        name: 'XYZ 고객사',
        partner_type: 'customer' as const,
        coi: 'CUSTOMER001',
        email: 'orders@xyz-customer.com',
        phone: '02-9876-5432',
        address: '부산시 해운대구 센텀로 456',
        contact_person: '이고객',
        contact_designation: '구매팀장',
        contact_phone: '010-9876-5432',
        contact_email: 'lee@xyz-customer.com',
        payment_terms: '선불결제',
        credit_limit: 50000000,
        is_active: true,
        is_deleted: false
      },
      {
        name: '종합 파트너사',
        partner_type: 'both' as const,
        coi: 'PARTNER001',
        email: 'info@comprehensive-partner.com',
        phone: '031-1111-2222',
        address: '경기도 성남시 분당구 정자로 789',
        contact_person: '박종합',
        contact_designation: '사업부장',
        contact_phone: '010-1111-2222',
        contact_email: 'park@comprehensive-partner.com',
        payment_terms: '30일 후불',
        credit_limit: 30000000,
        is_active: true,
        is_deleted: false
      }
    ];

    for (const partnerData of samplePartners) {
      await Partner.create(partnerData);
      console.log(`✅ 샘플 파트너 추가: ${partnerData.name}`);
    }
    
    console.log('📊 완료된 작업:');
    console.log('   - partners 테이블 생성');
    console.log('   - 3개 샘플 파트너 데이터 추가');
    console.log('   - company 테이블은 시스템 접속용으로 유지');
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
  } finally {
    await sequelize.close();
  }
}

createPartnersTable();
