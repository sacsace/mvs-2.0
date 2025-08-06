import { Company } from '../models';
import sequelize from '../config/database';

async function checkCompanyData() {
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
        회사코드: company.coi,
        주소: company.address,
        전화번호: company.phone,
        이메일: company.email,
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

    // 회사 테이블 구조 확인
    console.log('\n회사 테이블 구조:');
    console.log('===============');
    const tableInfo = await sequelize.query("PRAGMA table_info(company);");
    console.log(tableInfo[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkCompanyData(); 