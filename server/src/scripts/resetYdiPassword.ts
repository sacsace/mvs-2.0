import bcrypt from 'bcryptjs';
import User from '../models/User';
import sequelize from '../config/database';

async function resetYdiPassword() {
  try {
    console.log('🔄 YDI 사용자 비밀번호 재설정 시작...');
    
    // 데이터베이스 연결
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    // YDI 사용자 찾기
    const user = await User.findOne({
      where: { userid: 'ydi' }
    });
    
    if (!user) {
      console.log('❌ YDI 사용자를 찾을 수 없습니다.');
      return;
    }
    
    console.log('🔍 YDI 사용자 발견:', {
      id: user.id,
      userid: user.userid,
      username: user.username,
      role: user.role,
      company_id: user.company_id
    });
    
    // 새 비밀번호 해싱
    const newPassword = 'admin';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔐 새 비밀번호 해싱 완료');
    console.log('새 해시:', hashedPassword);
    
    // 비밀번호 업데이트
    await user.update({
      password: hashedPassword,
      update_date: new Date()
    });
    
    console.log('✅ YDI 사용자 비밀번호가 "admin"으로 재설정되었습니다.');
    
    // 검증
    const updatedUser = await User.findOne({
      where: { userid: 'ydi' }
    });
    
    if (updatedUser) {
      const isValid = await bcrypt.compare('admin', updatedUser.password);
      console.log('🧪 비밀번호 검증 결과:', isValid ? '✅ 성공' : '❌ 실패');
    }
    
    console.log('🎉 작업 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

resetYdiPassword();
