import sequelize from '../config/database';

async function createMenuPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 메뉴 권한 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS menu_permission (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        menu_id INTEGER NOT NULL,
        can_read BOOLEAN DEFAULT 1,
        can_create BOOLEAN DEFAULT 1,
        can_update BOOLEAN DEFAULT 1,
        can_delete BOOLEAN DEFAULT 1,
        create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (menu_id) REFERENCES menu(menu_id),
        UNIQUE(user_id, menu_id)
      )
    `);

    console.log('메뉴 권한 테이블이 생성되었습니다.');

    // admin 사용자 ID 조회
    const [adminUsers] = await sequelize.query('SELECT id FROM user WHERE username = ?', {
      replacements: ['admin']
    });

    if (adminUsers.length === 0) {
      console.error('Admin 사용자를 찾을 수 없습니다.');
      return;
    }

    const adminUserId = (adminUsers[0] as any).id;
    console.log(`Admin 사용자 ID: ${adminUserId}`);

    // 모든 메뉴 조회
    const [menus] = await sequelize.query('SELECT menu_id FROM menu ORDER BY order_num');
    console.log(`총 ${menus.length}개의 메뉴를 찾았습니다.`);

    // 기존 권한 데이터 삭제 (중복 방지)
    await sequelize.query('DELETE FROM menu_permission WHERE user_id = ?', {
      replacements: [adminUserId]
    });
    console.log('기존 admin 권한 데이터를 삭제했습니다.');

    // admin 계정에 모든 메뉴 권한 부여
    for (const menu of menus as any[]) {
      await sequelize.query(`
        INSERT INTO menu_permission (user_id, menu_id, can_read, can_create, can_update, can_delete, create_date)
        VALUES (?, ?, 1, 1, 1, 1, CURRENT_TIMESTAMP)
      `, {
        replacements: [adminUserId, menu.menu_id]
      });
    }

    console.log('Admin 계정에 모든 메뉴 권한이 부여되었습니다.');

    // 부여된 권한 확인
    const [permissions] = await sequelize.query(`
      SELECT mp.*, m.name as menu_name, u.username
      FROM menu_permission mp
      JOIN menu m ON mp.menu_id = m.menu_id
      JOIN user u ON mp.user_id = u.id
      WHERE mp.user_id = ?
      ORDER BY m.order_num
    `, {
      replacements: [adminUserId]
    });

    console.log('\nAdmin 계정의 메뉴 권한:');
    console.log('========================');
    permissions.forEach((perm: any) => {
      console.log(`${perm.menu_name}: 읽기(${perm.can_read}), 생성(${perm.can_create}), 수정(${perm.can_update}), 삭제(${perm.can_delete})`);
    });

  } catch (error) {
    console.error('메뉴 권한 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
createMenuPermissions(); 