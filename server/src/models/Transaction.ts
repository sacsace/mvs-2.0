import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface TransactionAttributes {
  id: number;
  company_id: number;
  partner_company_id: number;
  transaction_type: 'purchase' | 'sale';
  amount: number;
  currency: string;
  transaction_date: Date;
  due_date?: Date;
  status: 'pending' | 'completed' | 'cancelled';
  description?: string;
  invoice_number?: string;
  tax_amount?: number;
  total_amount: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface TransactionCreationAttributes extends Omit<TransactionAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> {
  public id!: number;
  public company_id!: number;
  public partner_company_id!: number;
  public transaction_type!: 'purchase' | 'sale';
  public amount!: number;
  public currency!: string;
  public transaction_date!: Date;
  public due_date?: Date;
  public status!: 'pending' | 'completed' | 'cancelled';
  public description?: string;
  public invoice_number?: string;
  public tax_amount?: number;
  public total_amount!: number;
  public created_by!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Transaction.init(
  {
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
    partner_company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'company_id',
      },
    },
    transaction_type: {
      type: DataTypes.ENUM('purchase', 'sale'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'KRW',
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
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
    tableName: 'transaction',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Transaction; 