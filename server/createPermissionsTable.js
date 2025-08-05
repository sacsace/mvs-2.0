const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function createPermissionsTable() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 권한 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        level VARCHAR(20) NOT NULL CHECK (level IN ('root', 'admin', 'regular', 'audit')) DEFAULT 'regular',
        company_access VARCHAR(20) NOT NULL CHECK (company_access IN ('all', 'own', 'none')) DEFAULT 'own',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('권한 테이블 생성 완료');

    // 기본 권한 데이터 삽입
    const permissions = [
      {
        name: '시스템 관리자',
        description: '시스템 전체를 관리할 수 있는 최고 권한',
        level: 'root',
        company_access: 'all'
      },
      {
        name: '회사 관리자',
        description: '회사 내부 사용자와 데이터를 관리할 수 있는 권한',
        level: 'admin',
        company_access: 'own'
      },
      {
        name: '일반 사용자',
        description: '기본적인 시스템 사용 권한',
        level: 'regular',
        company_access: 'own'
      },
      {
        name: '감사자',
        description: '관리자 권한과 동일하며 모든 회사 정보를 검색할 수 있는 권한',
        level: 'audit',
        company_access: 'all'
      }
    ];

    for (const permission of permissions) {
      await sequelize.query(`
        INSERT OR IGNORE INTO permissions (name, description, level, company_access)
        VALUES (?, ?, ?, ?)
      `, {
        replacements: [permission.name, permission.description, permission.level, permission.company_access]
      });
    }

    console.log('기본 권한 데이터 삽입 완료');

    // 생성된 권한 확인
    const [results] = await sequelize.query('SELECT * FROM permissions');
    console.log('\n생성된 권한 목록:');
    results.forEach(permission => {
      console.log(`- ${permission.name} (${permission.level})`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

createPermissionsTable(); 