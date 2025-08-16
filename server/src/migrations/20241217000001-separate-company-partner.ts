import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // 1. Partners 테이블 생성
  await queryInterface.createTable('partners', {
    partner_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    partner_type: {
      type: DataTypes.ENUM('supplier', 'customer', 'both'),
      allowNull: false,
      defaultValue: 'customer',
    },
    coi: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    pan: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    gst1: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    gst2: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    gst3: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    gst4: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    iec: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    msme: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    account_holder: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    account_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ifsc_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    product_category: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    contact_designation: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    payment_terms: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    credit_limit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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

  // 2. 기존 Company 테이블에서 파트너 관련 데이터를 Partners 테이블로 이전
  await queryInterface.sequelize.query(`
    INSERT INTO partners (
      name, partner_type, coi, pan, gst1, gst2, gst3, gst4, iec, msme,
      bank_name, account_holder, account_number, ifsc_code, address,
      website, email, phone, product_category, is_deleted, create_date, update_date
    )
    SELECT 
      name, 
      COALESCE(partner_type, 'customer'),
      coi, pan, gst1, gst2, gst3, gst4, iec, msme,
      bank_name, account_holder, account_number, ifsc_code, address,
      website, email, phone, product_category, is_deleted, create_date, update_date
    FROM company 
    WHERE partner_company_id IS NOT NULL OR partner_type IS NOT NULL
  `);

  // 3. Company 테이블에서 파트너 관련 컬럼 제거
  await queryInterface.removeColumn('company', 'partner_company_id');
  await queryInterface.removeColumn('company', 'partner_type');
  await queryInterface.removeColumn('company', 'product_category');
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // 1. Company 테이블에 파트너 관련 컬럼 다시 추가
  await queryInterface.addColumn('company', 'partner_company_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'company',
      key: 'company_id',
    },
  });
  
  await queryInterface.addColumn('company', 'partner_type', {
    type: DataTypes.STRING(20),
    allowNull: true,
  });
  
  await queryInterface.addColumn('company', 'product_category', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  // 2. Partners 테이블의 데이터를 Company 테이블로 다시 이전 (선택사항)
  
  // 3. Partners 테이블 삭제
  await queryInterface.dropTable('partners');
};
