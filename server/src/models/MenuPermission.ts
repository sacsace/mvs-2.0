import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Menu from './Menu';
import User from './User';

class MenuPermission extends Model {
  public id!: number;
  public user_id!: number;
  public menu_id!: number;
  public can_read!: boolean;
  public can_create!: boolean;
  public can_update!: boolean;
  public can_delete!: boolean;
  public create_date!: Date;
}

MenuPermission.init(
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
        key: 'id'
      }
    },
    menu_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menu',
        key: 'menu_id'
      }
    },
    can_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    can_create: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    can_update: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    can_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    create_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    modelName: 'menu_permission',
    tableName: 'menu_permission',
    timestamps: false,
  }
);

// Menu와 MenuPermission 간의 관계 설정
Menu.hasMany(MenuPermission, { foreignKey: 'menu_id', as: 'permissions' });
MenuPermission.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu_info' });

// User와 MenuPermission 간의 관계 설정
User.hasMany(MenuPermission, { foreignKey: 'user_id', as: 'menu_permissions' });
MenuPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user_info' });

export default MenuPermission; 