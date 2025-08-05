const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function createRolesTable() {
  try {
    console.log('데이터베이스 연결 시작...');
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // roles 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        name_en VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        description_en TEXT NOT NULL,
        level VARCHAR(20) NOT NULL DEFAULT 'custom',
        company_access VARCHAR(10) NOT NULL DEFAULT 'own',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('roles 테이블 생성 완료');

    // role_permissions 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        granted_by VARCHAR(50) NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles (id),
        FOREIGN KEY (permission_id) REFERENCES permissions (id),
        UNIQUE(role_id, permission_id)
      )
    `);
    console.log('role_permissions 테이블 생성 완료');

    // 기본 역할 데이터 삽입
    await sequelize.query(`
      INSERT OR IGNORE INTO roles (id, name, name_en, description, description_en, level, company_access, is_active) VALUES
      (1, '시스템 관리자', 'System Administrator', '전체 시스템에 대한 모든 권한을 가진 최고 관리자', 'Super administrator with full system access', 'root', 'all', 1),
      (2, '회사 관리자', 'Company Administrator', '회사 내 모든 기능에 대한 관리 권한', 'Company administrator with full company access', 'admin', 'own', 1),
      (3, '일반 사용자', 'Regular User', '기본적인 시스템 사용 권한', 'Basic system user with limited access', 'regular', 'own', 1),
      (4, '감사자', 'Auditor', '모든 회사 데이터를 조회할 수 있는 감사 권한', 'Auditor with read access to all company data', 'audit', 'all', 1),
      (5, '부서장', 'Department Manager', '부서 내 사용자와 데이터를 관리할 수 있는 권한', 'Department manager with team management access', 'custom', 'own', 1),
      (6, '팀장', 'Team Leader', '팀 내 작업을 관리할 수 있는 권한', 'Team leader with project management access', 'custom', 'own', 1)
    `);
    console.log('기본 역할 데이터 삽입 완료');

    // 기본 역할 권한 할당 (root 역할에 모든 권한 할당)
    await sequelize.query(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
      (1, 1, 'system'), (1, 2, 'system'), (1, 3, 'system'), (1, 4, 'system'),
      (2, 2, 'system'), (2, 3, 'system'),
      (3, 3, 'system'),
      (4, 2, 'system'), (4, 3, 'system'), (4, 4, 'system'),
      (5, 2, 'system'), (5, 3, 'system'),
      (6, 3, 'system')
    `);
    console.log('기본 역할 권한 할당 완료');

    // 생성된 역할 목록 조회
    const [roles] = await sequelize.query('SELECT * FROM roles WHERE is_active = 1 ORDER BY level, name');
    console.log('\n생성된 역할 목록:');
    roles.forEach(role => {
      console.log(`- ${role.name} (${role.name_en}) - ${role.level} 레벨`);
    });

    // 역할별 권한 조회
    const [rolePermissions] = await sequelize.query(`
      SELECT r.name as role_name, p.name as permission_name, rp.granted_by
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      ORDER BY r.name, p.name
    `);
    
    console.log('\n역할별 권한 할당:');
    rolePermissions.forEach(rp => {
      console.log(`- ${rp.role_name} -> ${rp.permission_name} (${rp.granted_by})`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

createRolesTable(); 