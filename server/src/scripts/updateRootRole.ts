import sequelize from '../config/database';
import User from '../models/User';
import logger from '../utils/logger';

async function updateRootRole() {
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

    // 역할을 ROOT로 수정
    await rootUser.update({
      role: 'ROOT',
      update_date: new Date()
    });

    logger.info('Root user role updated to ROOT successfully');
    
    // 수정된 사용자 정보 확인
    const updatedUser = await User.findOne({
      where: {
        username: 'root',
        is_deleted: false
      }
    });

    logger.info('Updated user information:', updatedUser?.toJSON());

  } catch (error) {
    logger.error('Error updating root role:', error);
  } finally {
    await sequelize.close();
  }
}

updateRootRole(); 