import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface ApprovalFileAttributes {
  id: number;
  approval_id: number;
  original_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  created_at: Date;
}

interface ApprovalFileCreationAttributes extends Omit<ApprovalFileAttributes, 'id' | 'created_at'> {}

class ApprovalFile extends Model<ApprovalFileAttributes, ApprovalFileCreationAttributes> {
  public id!: number;
  public approval_id!: number;
  public original_name!: string;
  public file_name!: string;
  public file_path!: string;
  public file_size!: number;
  public mime_type!: string;
  public uploaded_by!: number;
  public created_at!: Date;
}

ApprovalFile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    approval_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'approval',
        key: 'id',
      },
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    uploaded_by: {
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
  },
  {
    sequelize,
    tableName: 'approval_file',
    timestamps: false,
  }
);

export default ApprovalFile; 