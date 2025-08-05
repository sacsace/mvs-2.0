import Company from '../models/Company';
import sequelize from '../config/database';

async function viewCompanies() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const companies = await Company.findAll({
      where: {
        is_deleted: false
      },
      order: [['company_id', 'ASC']]
    });

    console.log('\n활성화된 회사 목록:');
    console.log('==================');
    companies.forEach(company => {
      console.log(JSON.stringify({
        회사ID: company.company_id,
        회사명: company.name,
        사업자번호: company.coi,
        PAN: company.pan,
        주소: company.address,
        IEC: company.iec,
        MSME: company.msme,
        은행명: company.bank_name,
        계좌소유자: company.account_holder,
        계좌번호: company.account_number,
        IFSC코드: company.ifsc_code,
        생성일: company.create_date,
        수정일: company.update_date
      }, null, 2));
    });

    // 통계 정보
    const totalCount = await Company.count();
    const activeCount = await Company.count({ where: { is_deleted: false } });
    const deletedCount = await Company.count({ where: { is_deleted: true } });

    console.log('\n회사 수 통계:');
    console.log('============');
    console.log(`전체 회사 수: ${totalCount}`);
    console.log(`활성 회사 수: ${activeCount}`);
    console.log(`삭제된 회사 수: ${deletedCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

viewCompanies(); 