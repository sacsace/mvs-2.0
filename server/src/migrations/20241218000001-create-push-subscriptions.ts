import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('push_subscriptions', {
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
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
  });

  // 사용자별 엔드포인트 유니크 인덱스 생성
  await queryInterface.addIndex('push_subscriptions', ['user_id', 'endpoint'], {
    unique: true,
    name: 'push_subscriptions_user_endpoint_unique'
  });

  // 활성 구독 조회를 위한 인덱스 생성
  await queryInterface.addIndex('push_subscriptions', ['user_id', 'is_active'], {
    name: 'push_subscriptions_user_active_idx'
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('push_subscriptions');
};
