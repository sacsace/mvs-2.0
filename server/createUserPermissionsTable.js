const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function createUserPermissionsTable() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 사용자 권한 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        granted_by VARCHAR(100) NOT NULL,
        UNIQUE(user_id, permission_id),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);

    console.log('사용자 권한 테이블 생성 완료');

    // 기본 사용자 권한 데이터 삽입 (root 사용자에게 모든 권한 부여)
    const defaultUserPermissions = [
      {
        user_id: 1, // root 사용자
        permission_id: 1, // 시스템 관리자 권한
        granted_by: 'system'
      },
      {
        user_id: 1, // root 사용자
        permission_id: 2, // 회사 관리자 권한
        granted_by: 'system'
      },
      {
        user_id: 1, // root 사용자
        permission_id: 3, // 일반 사용자 권한
        granted_by: 'system'
      },
      {
        user_id: 1, // root 사용자
        permission_id: 4, // 감사자 권한
        granted_by: 'system'
      }
    ];

    for (const userPermission of defaultUserPermissions) {
      await sequelize.query(`
        INSERT OR IGNORE INTO user_permissions (user_id, permission_id, granted_by)
        VALUES (?, ?, ?)
      `, {
        replacements: [userPermission.user_id, userPermission.permission_id, userPermission.granted_by]
      });
    }

    console.log('기본 사용자 권한 데이터 삽입 완료');

    // 생성된 사용자 권한 확인
    const [results] = await sequelize.query(`
      SELECT 
        up.id,
        up.user_id,
        up.permission_id,
        up.granted_at,
        up.granted_by,
        u.username as user_name,
        p.name as permission_name
      FROM user_permissions up
      JOIN user u ON up.user_id = u.id
      JOIN permissions p ON up.permission_id = p.id
    `);
    
    console.log('\n생성된 사용자 권한 목록:');
    results.forEach(up => {
      console.log(`- ${up.user_name} (${up.user_id}) -> ${up.permission_name} (${up.permission_id})`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

createUserPermissionsTable(); 