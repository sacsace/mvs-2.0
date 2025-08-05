import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // 메뉴 테이블에 영문명 필드 추가
  await queryInterface.addColumn('menu', 'name_en', {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  // 사용자 테이블에 기본 언어 필드 추가
  await queryInterface.addColumn('user', 'default_language', {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'ko',
  });

  // 기존 메뉴 데이터에 영문명 추가
  await queryInterface.sequelize.query(`
    UPDATE menu SET name_en = name WHERE name_en IS NULL;
  `);
}

export async function down(queryInterface: QueryInterface) {
  // 메뉴 테이블에서 영문명 필드 제거
  await queryInterface.removeColumn('menu', 'name_en');
  
  // 사용자 테이블에서 기본 언어 필드 제거
  await queryInterface.removeColumn('user', 'default_language');
} 