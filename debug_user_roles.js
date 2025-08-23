const sequelize = require('./dist/config/database.js').default;
const User = require('./dist/models/User.js').default;

async function checkUserRoles() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    const users = await User.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'userid', 'username', 'role'],
      raw: true
    });
    
    console.log('📋 모든 사용자 역할 정보:');
    users.forEach(user => {
      console.log(`  - ${user.userid} (${user.username}): ${user.role}`);
    });
    
    const heanUser = users.find(u => u.userid === 'hean');
    if (heanUser) {
      console.log(`\n🎯 hean 사용자 정보:`);
      console.log(`  - ID: ${heanUser.id}`);
      console.log(`  - 사용자명: ${heanUser.username}`);
      console.log(`  - 역할: ${heanUser.role}`);
    } else {
      console.log('\n❌ hean 사용자를 찾을 수 없습니다.');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('오류:', error.message);
  }
}

checkUserRoles();


