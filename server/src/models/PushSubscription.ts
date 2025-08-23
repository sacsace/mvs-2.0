import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PushSubscriptionAttributes {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface PushSubscriptionCreationAttributes 
  extends Optional<PushSubscriptionAttributes, 'id' | 'created_at' | 'updated_at'> {}

class PushSubscription extends Model<PushSubscriptionAttributes, PushSubscriptionCreationAttributes> 
  implements PushSubscriptionAttributes {
  public id!: number;
  public user_id!: number;
  public endpoint!: string;
  public p256dh_key!: string;
  public auth_key!: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PushSubscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    p256dh_key: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    auth_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'PushSubscription',
    tableName: 'push_subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default PushSubscription;
