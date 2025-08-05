import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Menu extends Model {
  public menu_id!: number;
  public name!: string;
  public name_en!: string;
  public icon!: string;
  public order_num!: number;
  public parent_id!: number | null;
  public url!: string | null;
  public create_date!: Date;
  public children?: Menu[];
}

Menu.init(
  {
    menu_id: {
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
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    order_num: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    create_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'menu',
    tableName: 'menu',
    timestamps: false,
  }
);

// 자식 메뉴 관계 설정
Menu.hasMany(Menu, { as: 'children', foreignKey: 'parent_id' });
Menu.belongsTo(Menu, { as: 'parent', foreignKey: 'parent_id' });

export default Menu; 