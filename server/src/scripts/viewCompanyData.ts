import sequelize from '../config/database';
import Company from '../models/Company';

async function viewCompanyData() {
  try {
    console.log('📋 회사 데이터 조회 중...');
    
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    const companies = await Company.findAll({
      attributes: [
        'company_id', 'name', 'coi', 'pan', 'gst1', 
        'address', 'email', 'phone', 'partner_type', 
        'product_category', 'is_deleted'
      ]
    });

    console.log('\n📊 회사 데이터:');
    console.log('총 회사 개수:', companies.length);
    
    if (companies.length === 0) {
      console.log('❌ 회사 데이터가 없습니다!');
    } else {
      companies.forEach((company, index) => {
        console.log(`\n${index + 1}. 회사 정보:`);
        console.log(`   ID: ${company.company_id}`);
        console.log(`   이름: ${company.name}`);
        console.log(`   COI: ${company.coi}`);
        console.log(`   PAN: ${company.pan}`);
        console.log(`   GST1: ${company.gst1}`);
        console.log(`   주소: ${company.address}`);
        console.log(`   이메일: ${company.email}`);
        console.log(`   전화: ${company.phone}`);
        console.log(`   파트너 타입: ${company.partner_type}`);
        console.log(`   제품 카테고리: ${company.product_category}`);
        console.log(`   삭제됨: ${company.is_deleted}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

viewCompanyData();
