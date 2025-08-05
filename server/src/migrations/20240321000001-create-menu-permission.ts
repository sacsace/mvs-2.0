import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('menu_permission', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    menu_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menu',
        key: 'menu_id'
      }
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    create_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  });

  // menu_id와 role의 조합이 유니크해야 함
  await queryInterface.addIndex('menu_permission', ['menu_id', 'role'], {
    unique: true,
    name: 'menu_permission_menu_id_role_unique'
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('menu_permission');
} 