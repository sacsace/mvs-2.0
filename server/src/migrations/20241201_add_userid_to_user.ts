import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // userid 컬럼 추가 (로그인 ID용)
  await queryInterface.addColumn('user', 'userid', {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  });

  // 기존 username을 userid로 복사
  await queryInterface.sequelize.query(`
    UPDATE user SET userid = username WHERE userid IS NULL;
  `);

  // username 컬럼을 실제 이름으로 변경 (기존 데이터는 임시로 '사용자'로 설정)
  await queryInterface.sequelize.query(`
    UPDATE user SET username = '사용자' WHERE username = userid;
  `);

  // username 컬럼 제약 조건 변경 (unique 제거)
  await queryInterface.changeColumn('user', 'username', {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: false
  });
}

export async function down(queryInterface: QueryInterface) {
  // username을 다시 unique로 변경
  await queryInterface.changeColumn('user', 'username', {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  });

  // userid 컬럼 제거
  await queryInterface.removeColumn('user', 'userid');
} 