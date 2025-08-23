import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Company extends Model {
  public company_id!: number;
  public name!: string;
  public coi!: string;
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
  public signature_url?: string;
  public stamp_url?: string;
  public login_period_start?: string;
  public login_period_end?: string;
  public is_deleted!: boolean;
  public create_date!: Date;
  public update_date!: Date;
}

Company.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'company_id',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name',
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
    website: {
      type: DataTypes.STRING(255),
    },
    email: {
      type: DataTypes.STRING(100),
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    signature_url: {
      type: DataTypes.STRING(500),
    },
    stamp_url: {
      type: DataTypes.STRING(500),
    },
    login_period_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    login_period_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    modelName: 'Company',
    tableName: 'company',
    timestamps: false,
  }
);

export default Company; 