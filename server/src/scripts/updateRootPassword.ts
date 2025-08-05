import sequelize from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

async function updateRootPassword() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // root 사용자 찾기
    const rootUser = await User.findOne({
      where: {
        username: 'root',
        is_deleted: false
      }
    });

    if (!rootUser) {
      logger.error('Root user not found');
      return;
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash('root', 10);

    // 비밀번호 업데이트
    await rootUser.update({
      password: hashedPassword,
      update_date: new Date()
    });

    logger.info('Root user password updated successfully');
    
    // 수정된 사용자 정보 확인
    const updatedUser = await User.findOne({
      where: {
        username: 'root',
        is_deleted: false
      }
    });

    logger.info('Updated user information:', updatedUser?.toJSON());

  } catch (error) {
    logger.error('Error updating root password:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
updateRootPassword(); 