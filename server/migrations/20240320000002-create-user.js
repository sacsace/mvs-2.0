'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'company',
          key: 'company_id'
        }
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      create_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      update_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user');
  }
}; 