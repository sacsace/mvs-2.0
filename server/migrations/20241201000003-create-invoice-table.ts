import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('invoice', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      invoice_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'regular',
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'company',
          key: 'company_id',
        },
      },
      partner_company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'company',
          key: 'company_id',
        },
      },
      invoice_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'KRW',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'draft',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // 인덱스 추가
    await queryInterface.addIndex('invoice', ['company_id']);
    await queryInterface.addIndex('invoice', ['partner_company_id']);
    await queryInterface.addIndex('invoice', ['created_by']);
    await queryInterface.addIndex('invoice', ['invoice_date']);
    await queryInterface.addIndex('invoice', ['status']);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('invoice');
  },
}; 