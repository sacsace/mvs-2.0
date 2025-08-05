import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RolePermissionAttributes {
  id?: number;
  role_id: number;
  permission_id: number;
  granted_at?: Date;
  granted_by: string;
}

class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  public id!: number;
  public role_id!: number;
  public permission_id!: number;
  public granted_at!: Date;
  public granted_by!: string;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
    granted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    granted_by: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id'],
      },
    ],
  }
);

export default RolePermission; 