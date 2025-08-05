import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface ApprovalAttributes {
  id: number;
  title: string;
  content: string;
  requester_id: number;
  approver_id: number;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  due_date: Date;
  created_at: Date;
  updated_at: Date;
  company_id: number;
}

interface ApprovalCreationAttributes extends Omit<ApprovalAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Approval extends Model<ApprovalAttributes, ApprovalCreationAttributes> {
  public id!: number;
  public title!: string;
  public content!: string;
  public requester_id!: number;
  public approver_id!: number;
  public status!: 'pending' | 'approved' | 'rejected';
  public priority!: 'low' | 'medium' | 'high';
  public due_date!: Date;
  public created_at!: Date;
  public updated_at!: Date;
  public company_id!: number;
}

Approval.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
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
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'company_id',
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
    tableName: 'approval',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Approval; 