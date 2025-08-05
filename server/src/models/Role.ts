import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RoleAttributes {
  id?: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  level: 'root' | 'admin' | 'regular' | 'audit' | 'custom';
  company_access: 'all' | 'own' | 'none';
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class Role extends Model<RoleAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public name_en!: string;
  public description!: string;
  public description_en!: string;
  public level!: 'root' | 'admin' | 'regular' | 'audit' | 'custom';
  public company_access!: 'all' | 'own' | 'none';
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name_en: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description_en: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('root', 'admin', 'regular', 'audit', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
    },
    company_access: {
      type: DataTypes.ENUM('all', 'own', 'none'),
      allowNull: false,
      defaultValue: 'own',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Role; 