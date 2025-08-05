import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface UserPermissionAttributes {
  id?: number;
  user_id: number;
  permission_id: number;
  granted_at?: Date;
  granted_by: string;
}

class UserPermission extends Model<UserPermissionAttributes> implements UserPermissionAttributes {
  public id!: number;
  public user_id!: number;
  public permission_id!: number;
  public readonly granted_at!: Date;
  public granted_by!: string;
}

UserPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
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
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user_permissions',
    timestamps: true,
    createdAt: 'granted_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'permission_id'],
      },
    ],
  }
);

export default UserPermission; 