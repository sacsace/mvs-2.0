import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Partner extends Model {
  public partner_id!: number;
  public company_id!: number;
  public name!: string;
  public partner_type!: 'supplier' | 'customer' | 'both';
  public coi?: string;
  public pan?: string;
  public gst1?: string;
  public gst2?: string;
  public gst3?: string;
  public gst4?: string;
  public iec?: string;
  public msme?: string;
  public bank_name?: string;
  public account_holder?: string;
  public account_number?: string;
  public ifsc_code?: string;
  public address?: string;
  public website?: string;
  public email?: string;
  public phone?: string;
  public product_category?: string;
  public contact_person?: string;
  public contact_designation?: string;
  public contact_phone?: string;
  public contact_email?: string;
  public payment_terms?: string;
  public credit_limit?: number;
  public is_active!: boolean;
  public is_deleted!: boolean;
  public create_date!: Date;
  public update_date!: Date;
}

Partner.init(
  {
    partner_id: {
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
      type: DataTypes.TEXT,
    },
    website: {
      type: DataTypes.STRING(255),
    },
    email: {
      type: DataTypes.STRING(100),
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    product_category: {
      type: DataTypes.TEXT,
    },
    contact_person: {
      type: DataTypes.STRING(100),
    },
    contact_designation: {
      type: DataTypes.STRING(50),
    },
    contact_phone: {
      type: DataTypes.STRING(20),
    },
    contact_email: {
      type: DataTypes.STRING(100),
    },
    payment_terms: {
      type: DataTypes.STRING(100),
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
  },
  {
    sequelize,
    modelName: 'Partner',
    tableName: 'partners',
    timestamps: false,
  }
);

export default Partner;
