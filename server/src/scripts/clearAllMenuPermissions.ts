import sequelize from '../config/database';
import MenuPermission from '../models/MenuPermission';

async function clearAllMenuPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 모든 메뉴 권한 삭제
    const deletedCount = await MenuPermission.destroy({
      where: {},
      force: true // 완전 삭제
    });

    console.log(`총 ${deletedCount}개의 메뉴 권한이 삭제되었습니다.`);
    console.log('모든 사용자의 메뉴 권한이 초기화되었습니다.');
    console.log('이제 관리자가 각 사용자에게 필요한 메뉴 권한을 개별적으로 부여해야 합니다.');

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

clearAllMenuPermissions(); 