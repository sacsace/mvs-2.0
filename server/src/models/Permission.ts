import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PermissionAttributes {
  id?: number;
  name: string;
  description: string;
  level: 'root' | 'admin' | 'regular' | 'audit';
  company_access: 'all' | 'own' | 'none';
  created_at?: Date;
  updated_at?: Date;
}

class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public level!: 'root' | 'admin' | 'regular' | 'audit';
  public company_access!: 'all' | 'own' | 'none';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('root', 'admin', 'regular', 'audit'),
      allowNull: false,
      defaultValue: 'regular',
    },
    company_access: {
      type: DataTypes.ENUM('all', 'own', 'none'),
      allowNull: false,
      defaultValue: 'own',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Permission; 