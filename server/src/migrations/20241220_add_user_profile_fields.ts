import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  try {
    // 사용자 테이블에 확장된 프로필 필드들 추가
    await queryInterface.addColumn('user', 'profile', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '사용자 개인 정보 (사진, 연락처, 생년월일 등)'
    });

    await queryInterface.addColumn('user', 'employment', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '직무 이력 정보 (입사일, 부서, 직책 등)'
    });

    await queryInterface.addColumn('user', 'performance', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '성과 평가 정보 (평가일, 점수, 메모 등)'
    });

    await queryInterface.addColumn('user', 'education', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '교육 이력 정보 (학위, 전공, 대학교 등)'
    });

    await queryInterface.addColumn('user', 'skills', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '스킬 및 역량 정보 (기술 스킬, 외국어 등)'
    });

    await queryInterface.addColumn('user', 'attendance', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '근태 정보 (근무 시간, 연차, 결근 등)'
    });

    await queryInterface.addColumn('user', 'compensation', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '보상 정보 (급여, 상여금, 복리후생 등)'
    });

    console.log('✅ 사용자 프로필 필드들이 성공적으로 추가되었습니다.');
  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface) {
  try {
    // 추가된 컬럼들 제거
    await queryInterface.removeColumn('user', 'profile');
    await queryInterface.removeColumn('user', 'employment');
    await queryInterface.removeColumn('user', 'performance');
    await queryInterface.removeColumn('user', 'education');
    await queryInterface.removeColumn('user', 'skills');
    await queryInterface.removeColumn('user', 'attendance');
    await queryInterface.removeColumn('user', 'compensation');

    console.log('✅ 사용자 프로필 필드들이 성공적으로 제거되었습니다.');
  } catch (error) {
    console.error('❌ 롤백 중 오류 발생:', error);
    throw error;
  }
}
