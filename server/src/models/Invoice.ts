import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface InvoiceAttributes {
  id: number;
  invoice_number: string;
  invoice_type: 'regular' | 'e-invoice' | 'lotus' | 'proforma';
  company_id: number;
  partner_company_id: number;
  invoice_date: Date;
  due_date: Date;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  notes?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface InvoiceCreationAttributes extends Omit<InvoiceAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> {
  public id!: number;
  public invoice_number!: string;
  public invoice_type!: 'regular' | 'e-invoice' | 'lotus' | 'proforma';
  public company_id!: number;
  public partner_company_id!: number;
  public invoice_date!: Date;
  public due_date!: Date;
  public subtotal!: number;
  public tax_amount!: number;
  public total_amount!: number;
  public currency!: string;
  public status!: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  public description?: string;
  public notes?: string;
  public created_by!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    invoice_type: {
      type: DataTypes.ENUM('regular', 'e-invoice', 'lotus', 'proforma'),
      allowNull: false,
      defaultValue: 'regular',
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'company_id',
      },
    },
    partner_company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'company_id',
      },
    },
    invoice_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'KRW',
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: 'invoice',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Invoice; 