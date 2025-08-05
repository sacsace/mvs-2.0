import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('permissions', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      level: {
        type: DataTypes.ENUM('root', 'admin', 'regular', 'audit'),
        allowNull: false,
        defaultValue: 'regular',
      },
      company_access: {
        type: DataTypes.ENUM('all', 'own', 'none'),
        allowNull: false,
        defaultValue: 'own',
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

    // 기본 권한 데이터 삽입
    await queryInterface.bulkInsert('permissions', [
      {
        name: '시스템 관리자',
        description: '시스템 전체를 관리할 수 있는 최고 권한',
        level: 'root',
        company_access: 'all',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: '회사 관리자',
        description: '회사 내부 사용자와 데이터를 관리할 수 있는 권한',
        level: 'admin',
        company_access: 'own',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: '일반 사용자',
        description: '기본적인 시스템 사용 권한',
        level: 'regular',
        company_access: 'own',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: '감사자',
        description: '관리자 권한과 동일하며 모든 회사 정보를 검색할 수 있는 권한',
        level: 'audit',
        company_access: 'all',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('permissions');
  },
}; 