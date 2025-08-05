import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('company', {
    company_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    coi: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    pan: {
      type: DataTypes.STRING(20),
    },
    gst1: {
      type: DataTypes.STRING(20),
    },
    gst2: {
      type: DataTypes.STRING(20),
    },
    gst3: {
      type: DataTypes.STRING(20),
    },
    gst4: {
      type: DataTypes.STRING(20),
    },
    iec: {
      type: DataTypes.STRING(20),
    },
    msme: {
      type: DataTypes.STRING(20),
    },
    bank_name: {
      type: DataTypes.STRING(100),
    },
    account_holder: {
      type: DataTypes.STRING(100),
    },
    account_number: {
      type: DataTypes.STRING(50),
    },
    ifsc_code: {
      type: DataTypes.STRING(20),
    },
    address: {
      type: DataTypes.STRING(255),
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
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('company');
} 