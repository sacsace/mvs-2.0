import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn('menu', 'order_num', {
    type: DataTypes.INTEGER,
    allowNull: true
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('menu', 'order_num');
} 