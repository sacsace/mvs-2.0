import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';

interface Company {
  company_id: number;
  gst1?: string;
  gst2?: string;
  gst3?: string;
  gst4?: string;
}

interface GstData {
  company_id: number;
  gst_number: string;
}

export async function up(queryInterface: QueryInterface) {
  // company_gst 테이블 생성
  await queryInterface.createTable('company_gst', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'company_id',
      },
    },
    gst_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    create_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    update_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  // 기존 GST 데이터를 새 테이블로 이전
  const companies = await queryInterface.sequelize.query<Company>(
    'SELECT company_id, gst1, gst2, gst3, gst4 FROM company WHERE is_deleted = false',
    { type: QueryTypes.SELECT }
  );

  for (const company of companies) {
    const gstNumbers = [company.gst1, company.gst2, company.gst3, company.gst4].filter(Boolean);
    for (const gstNumber of gstNumbers) {
      if (gstNumber) {
        await queryInterface.sequelize.query(
          'INSERT INTO company_gst (company_id, gst_number, create_date, update_date) VALUES (?, ?, NOW(), NOW())',
          {
            replacements: [company.company_id, gstNumber],
            type: QueryTypes.INSERT
          }
        );
      }
    }
  }

  // 기존 GST 컬럼 제거
  await queryInterface.removeColumn('company', 'gst1');
  await queryInterface.removeColumn('company', 'gst2');
  await queryInterface.removeColumn('company', 'gst3');
  await queryInterface.removeColumn('company', 'gst4');
}

export async function down(queryInterface: QueryInterface) {
  // 기존 GST 컬럼 복구
  await queryInterface.addColumn('company', 'gst1', {
    type: DataTypes.STRING(20),
    allowNull: true,
  });
  await queryInterface.addColumn('company', 'gst2', {
    type: DataTypes.STRING(20),
    allowNull: true,
  });
  await queryInterface.addColumn('company', 'gst3', {
    type: DataTypes.STRING(20),
    allowNull: true,
  });
  await queryInterface.addColumn('company', 'gst4', {
    type: DataTypes.STRING(20),
    allowNull: true,
  });

  // 데이터 복구
  const gstData = await queryInterface.sequelize.query<GstData>(
    'SELECT company_id, gst_number FROM company_gst WHERE is_deleted = false ORDER BY id',
    { type: QueryTypes.SELECT }
  );

  const companyGstMap = new Map<number, string[]>();
  for (const gst of gstData) {
    const existing = companyGstMap.get(gst.company_id) || [];
    companyGstMap.set(gst.company_id, [...existing, gst.gst_number]);
  }

  for (const [companyId, gstNumbers] of companyGstMap.entries()) {
    await queryInterface.sequelize.query(
      'UPDATE company SET gst1 = ?, gst2 = ?, gst3 = ?, gst4 = ? WHERE company_id = ?',
      {
        replacements: [
          gstNumbers[0] || null,
          gstNumbers[1] || null,
          gstNumbers[2] || null,
          gstNumbers[3] || null,
          companyId
        ],
        type: QueryTypes.UPDATE
      }
    );
  }

  // company_gst 테이블 삭제
  await queryInterface.dropTable('company_gst');
} 