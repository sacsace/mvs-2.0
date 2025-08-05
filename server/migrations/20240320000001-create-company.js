'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('company', {
      company_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      coi: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      pan: {
        type: Sequelize.STRING(20)
      },
      gst1: {
        type: Sequelize.STRING(20)
      },
      gst2: {
        type: Sequelize.STRING(20)
      },
      gst3: {
        type: Sequelize.STRING(20)
      },
      gst4: {
        type: Sequelize.STRING(20)
      },
      iec: {
        type: Sequelize.STRING(20)
      },
      msme: {
        type: Sequelize.STRING(20)
      },
      bank_name: {
        type: Sequelize.STRING(100)
      },
      account_holder: {
        type: Sequelize.STRING(100)
      },
      account_number: {
        type: Sequelize.STRING(50)
      },
      ifsc_code: {
        type: Sequelize.STRING(20)
      },
      address: {
        type: Sequelize.STRING(255)
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
    await queryInterface.dropTable('company');
  }
}; 