import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface ExpenseAttributes {
  id: number;
  title: string;
  description?: string;
  total_amount: number;
  gst_amount: number;
  grand_total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  requester_id: number;
  approver_id?: number;
  company_id: number;
  receipt_files?: string[];
  remarks?: string;
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

interface ExpenseCreationAttributes extends Omit<ExpenseAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public total_amount!: number;
  public gst_amount!: number;
  public grand_total!: number;
  public status!: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  public priority!: 'low' | 'medium' | 'high';
  public requester_id!: number;
  public approver_id!: number;
  public company_id!: number;
  public receipt_files!: string[];
  public remarks!: string;
  public created_by!: number;
  public updated_by!: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly company?: any;
  public readonly requester?: any;
  public readonly approver?: any;
  public readonly items?: any[];
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    gst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    grand_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'completed'),
      allowNull: false,
      defaultValue: 'draft',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'id',
      },
    },
    receipt_files: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    remarks: {
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
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
  }
);

export default Expense;
