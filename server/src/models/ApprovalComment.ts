import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface ApprovalCommentAttributes {
  id: number;
  approval_id: number;
  user_id: number;
  comment: string;
  created_at: Date;
}

interface ApprovalCommentCreationAttributes extends Omit<ApprovalCommentAttributes, 'id' | 'created_at'> {}

class ApprovalComment extends Model<ApprovalCommentAttributes, ApprovalCommentCreationAttributes> {
  public id!: number;
  public approval_id!: number;
  public user_id!: number;
  public comment!: string;
  public created_at!: Date;
}

ApprovalComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    approval_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'approval',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: 'approval_comment',
    timestamps: false,
  }
);

export default ApprovalComment;


