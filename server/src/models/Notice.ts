import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface NoticeAttributes {
  id?: number;
  company_id: number;
  title: string;
  content: string;
  author_id: number;
  status: 'active' | 'inactive' | 'draft';
  priority: 'low' | 'medium' | 'high';
  start_date?: Date;
  end_date?: Date;
  view_count: number;
  is_pinned: boolean;
  created_by: number;
  updated_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface NoticeCreationAttributes extends Omit<NoticeAttributes, 'id' | 'view_count' | 'created_at' | 'updated_at'> {}

class Notice extends Model<NoticeAttributes, NoticeCreationAttributes> implements NoticeAttributes {
  public id!: number;
  public company_id!: number;
  public title!: string;
  public content!: string;
  public author_id!: number;
  public status!: 'active' | 'inactive' | 'draft';
  public priority!: 'low' | 'medium' | 'high';
  public start_date?: Date;
  public end_date?: Date;
  public view_count!: number;
  public is_pinned!: boolean;
  public created_by!: number;
  public updated_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Notice.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'draft'),
      allowNull: false,
      defaultValue: 'active',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'notice',
    timestamps: true,
    underscored: true,
  }
);

export default Notice;
