import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class CompanyGst extends Model {
  public id!: number;
  public company_id!: number;
  public gst_number!: string;
  public address!: string;
  public is_primary!: boolean;
  public is_deleted!: boolean;
  public create_date!: Date;
  public update_date!: Date;
}

CompanyGst.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'company_id',
      },
    },
    gst_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    create_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    update_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'company_gst',
    tableName: 'company_gst',
    timestamps: false,
  }
);

export default CompanyGst; 