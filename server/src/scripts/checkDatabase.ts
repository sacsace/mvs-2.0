import sequelize from '../config/database';
import User from '../models/User';
import logger from '../utils/logger';

async function checkDatabase() {
  try {
    // 1. 데이터베이스 연결 테스트
    logger.info('데이터베이스 연결 테스트 중...');
    await sequelize.authenticate();
    logger.info('데이터베이스 연결 성공!');

    // 2. 사용자 테이블 확인
    logger.info('\n사용자 테이블 확인 중...');
    const userCount = await User.count();
    logger.info(`총 사용자 수: ${userCount}`);

    // 3. 사용자 목록 조회
    if (userCount > 0) {
      logger.info('\n사용자 목록:');
      const users = await User.findAll({
        attributes: ['id', 'username', 'role', 'company_id', 'is_deleted'],
        where: { is_deleted: false }
      });

      users.forEach(user => {
        logger.info(`ID: ${user.id}, 사용자명: ${user.username}, 역할: ${user.role}, 회사ID: ${user.company_id}`);
      });
    } else {
      logger.info('등록된 사용자가 없습니다.');
    }

  } catch (error) {
    logger.error('데이터베이스 확인 중 오류 발생:', error);
  } finally {
    // 연결 종료
    await sequelize.close();
  }
}

// 스크립트 실행
checkDatabase(); 