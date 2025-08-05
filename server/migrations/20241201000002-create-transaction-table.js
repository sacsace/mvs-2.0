'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // transaction 테이블 생성
    await queryInterface.createTable('transaction', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'company',
          key: 'company_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      partner_company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'company',
          key: 'company_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      transaction_type: {
        type: Sequelize.ENUM('purchase', 'sale'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'KRW',
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // 인덱스 생성
    await queryInterface.addIndex('transaction', ['company_id']);
    await queryInterface.addIndex('transaction', ['partner_company_id']);
    await queryInterface.addIndex('transaction', ['transaction_type']);
    await queryInterface.addIndex('transaction', ['transaction_date']);
    await queryInterface.addIndex('transaction', ['status']);
    await queryInterface.addIndex('transaction', ['created_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transaction');
  }
}; 