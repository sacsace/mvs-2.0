import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface ExpenseItemAttributes {
  id: number;
  expense_id: number;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

interface ExpenseItemCreationAttributes extends Omit<ExpenseItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

class ExpenseItem extends Model<ExpenseItemAttributes, ExpenseItemCreationAttributes> implements ExpenseItemAttributes {
  public id!: number;
  public expense_id!: number;
  public product_name!: string;
  public description!: string;
  public quantity!: number;
  public unit_price!: number;
  public total_price!: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExpenseItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expense_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'expenses',
        key: 'id',
      },
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: 'expense_items',
    timestamps: true,
    underscored: true,
  }
);

export default ExpenseItem;
