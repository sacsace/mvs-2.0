import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // 메뉴 권한 테이블 생성
  await queryInterface.createTable('menu_permissions', {
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

  // 인덱스 생성
  await queryInterface.addIndex('menu_permissions', ['menu_id', 'role'], {
    unique: true,
    name: 'menu_permissions_menu_id_role_unique'
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('menu_permissions');
} 