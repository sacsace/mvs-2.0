import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('user', 'profile', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '사용자 프로필 정보 (개인정보, 사진 등)'
    });

    await queryInterface.addColumn('user', 'employment', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '직무 정보 (부서, 직책, 입사일 등)'
    });

    await queryInterface.addColumn('user', 'performance', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '성과 평가 정보'
    });

    await queryInterface.addColumn('user', 'education', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '교육 이력 정보'
    });

    await queryInterface.addColumn('user', 'skills', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '스킬 및 역량 정보'
    });

    await queryInterface.addColumn('user', 'attendance', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '근태 정보'
    });

    await queryInterface.addColumn('user', 'compensation', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '보상 정보'
    });

    console.log('✅ 사용자 프로필 컬럼들이 성공적으로 추가되었습니다.');
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('user', 'profile');
    await queryInterface.removeColumn('user', 'employment');
    await queryInterface.removeColumn('user', 'performance');
    await queryInterface.removeColumn('user', 'education');
    await queryInterface.removeColumn('user', 'skills');
    await queryInterface.removeColumn('user', 'attendance');
    await queryInterface.removeColumn('user', 'compensation');

    console.log('✅ 사용자 프로필 컬럼들이 성공적으로 제거되었습니다.');
  }
};
