import User from '../models/User';
import sequelize from '../config/database';
import logger from '../utils/logger';
import { execSync } from 'child_process';
import path from 'path';

async function initializeIfEmpty() {
  try {
    console.log('🔍 데이터베이스 상태 확인 중...');
    
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 동기화 (필요한 경우 테이블 생성)
    await sequelize.sync({ alter: false });
    console.log('✅ 테이블 동기화 완료');

    // 사용자 수 확인
    const userCount = await User.count();
    console.log(`📊 현재 사용자 수: ${userCount}`);

    if (userCount === 0) {
      console.log('🚀 데이터베이스가 비어있습니다. 초기화를 시작합니다...');
      
      // 초기화 스크립트 실행
      const scriptPath = path.join(__dirname, 'initializeWithoutConstraints.ts');
      const command = `npx ts-node "${scriptPath}"`;
      
      console.log('⚡ 초기화 스크립트 실행 중...');
      execSync(command, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..') 
      });
      
      console.log('🎉 데이터베이스 초기화 완료!');
    } else {
      console.log('✅ 데이터베이스에 이미 데이터가 존재합니다. 초기화를 건너뜁니다.');
    }

  } catch (error) {
    console.log('⚠️  초기화 확인 중 오류 발생:', error);
    console.log('💡 서버는 계속 시작됩니다...');
  } finally {
    await sequelize.close();
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  initializeIfEmpty()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ 초기화 확인 실패:', error);
      process.exit(0); // 오류가 있어도 서버는 시작되도록 0으로 종료
    });
}

export default initializeIfEmpty;
