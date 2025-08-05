import sequelize from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';

async function updateAdminPassword() {
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
      console.error('Admin user not found');
      return;
    }

    console.log('기존 admin 사용자 정보:', {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      company_id: adminUser.company_id
    });

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash('admin', 10);

    // 비밀번호 업데이트
    await adminUser.update({
      password: hashedPassword,
      update_date: new Date()
    });

    console.log('Admin 사용자 비밀번호가 성공적으로 업데이트되었습니다.');
    
    // 수정된 사용자 정보 확인
    const updatedUser = await User.findOne({
      where: {
        username: 'admin',
        is_deleted: false
      }
    });

    console.log('업데이트된 사용자 정보:', {
      id: updatedUser?.id,
      username: updatedUser?.username,
      role: updatedUser?.role,
      company_id: updatedUser?.company_id,
      update_date: updatedUser?.update_date
    });

  } catch (error) {
    console.error('Admin 비밀번호 업데이트 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
updateAdminPassword(); 