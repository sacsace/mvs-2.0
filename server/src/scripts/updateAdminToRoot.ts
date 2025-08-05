import sequelize from '../config/database';
import User from '../models/User';

async function updateAdminToRoot() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // admin 사용자 찾기
    const adminUser = await User.findOne({
      where: {
        username: 'admin',
        is_deleted: false
      }
    });

    if (!adminUser) {
      console.error('Admin 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log('기존 admin 사용자 정보:', {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      company_id: adminUser.company_id
    });

    // username을 root로 변경
    await adminUser.update({
      username: 'root',
      update_date: new Date()
    });

    console.log('Admin 사용자의 username이 root로 성공적으로 변경되었습니다.');

    // 변경된 사용자 정보 확인
    const updatedUser = await User.findOne({
      where: {
        username: 'root',
        is_deleted: false
      }
    });

    console.log('변경된 사용자 정보:', {
      id: updatedUser?.id,
      username: updatedUser?.username,
      role: updatedUser?.role,
      company_id: updatedUser?.company_id,
      update_date: updatedUser?.update_date
    });

    // 전체 사용자 목록 확인
    const allUsers = await User.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'username', 'role', 'company_id']
    });

    console.log('\n전체 사용자 목록:');
    console.log('==================');
    allUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('사용자명 변경 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

updateAdminToRoot(); 