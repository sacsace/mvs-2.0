import bcrypt from 'bcrypt';
import User from '../models/User';
import sequelize from '../config/database';
import logger from '../utils/logger';

async function updateYdi1Password() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // ydi1 사용자 찾기
    const user = await User.findOne({
      where: { userid: 'ydi1' }
    });

    if (!user) {
      logger.error('ydi1 user not found');
      return;
    }

    logger.info(`Found user: ${user.userid} (${user.username})`);

    // 비밀번호를 'admin'으로 해시화
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    // 비밀번호 업데이트
    await user.update({ password: hashedPassword });
    
    logger.info('Password updated successfully for ydi1 user');
    logger.info('New password: admin');
    
  } catch (error) {
    logger.error('Error updating password:', error);
  } finally {
    await sequelize.close();
  }
}

updateYdi1Password(); 