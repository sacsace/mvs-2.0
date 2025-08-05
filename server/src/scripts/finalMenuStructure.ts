import sequelize from '../config/database';

async function finalMenuStructure() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 기존 메뉴 데이터 삭제
    await sequelize.query('DELETE FROM menu_permission');
    await sequelize.query('DELETE FROM menu');
    console.log('기존 메뉴 데이터를 삭제했습니다.');

    // 1. 사용자 관리 (ID: 1)
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES (1, '사용자 관리', 'people', 1, NULL, '/users', CURRENT_TIMESTAMP)
    `);

    // 2. 권한 관리 (ID: 2)
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES (2, '권한 관리', 'security', 2, NULL, '/permissions', CURRENT_TIMESTAMP)
    `);

    // 3. 메뉴 관리 (ID: 3)
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES (3, '메뉴 관리', 'menu', 3, NULL, '/menus', CURRENT_TIMESTAMP)
    `);

    // 4. 인보이스 관리 (ID: 4)
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES (4, '인보이스 관리', 'receipt', 4, NULL, '/invoices', CURRENT_TIMESTAMP)
    `);

    // 5. 지출결의서 관리 (ID: 5)
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES (5, '지출결의서 관리', 'account_balance_wallet', 5, NULL, '/expenses', CURRENT_TIMESTAMP)
    `);

    console.log('최상위 메뉴들이 생성되었습니다.');

    // 사용자 관리 하위 메뉴들
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES 
      (11, '사용자 목록', 'list', 1, 1, '/users/list', CURRENT_TIMESTAMP),
      (12, '사용자 등록', 'person_add', 2, 1, '/users/register', CURRENT_TIMESTAMP),
      (13, '사용자 관리', 'admin_panel_settings', 3, 1, '/users/manage', CURRENT_TIMESTAMP)
    `);

    // 권한 관리 하위 메뉴들
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES 
      (21, '권한 관리', 'security', 1, 2, '/permissions/manage', CURRENT_TIMESTAMP),
      (22, '사용자 권한 관리', 'person_add', 2, 2, '/permissions/users', CURRENT_TIMESTAMP),
      (23, '메뉴 권한 관리', 'menu_book', 3, 2, '/permissions/menus', CURRENT_TIMESTAMP),
      (24, '역할 관리', 'admin_panel_settings', 4, 2, '/permissions/roles', CURRENT_TIMESTAMP)
    `);

    // 인보이스 관리 하위 메뉴들
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES 
      (41, '인보이스 목록', 'list_alt', 1, 4, '/invoices/list', CURRENT_TIMESTAMP),
      (42, '인보이스 생성', 'add_circle', 2, 4, '/invoices/create', CURRENT_TIMESTAMP),
      (43, '인보이스 승인', 'approval', 3, 4, '/invoices/approve', CURRENT_TIMESTAMP)
    `);

    // 지출결의서 관리 하위 메뉴들
    await sequelize.query(`
      INSERT INTO menu (menu_id, name, icon, order_num, parent_id, url, create_date)
      VALUES 
      (51, '지출결의서 목록', 'receipt_long', 1, 5, '/expenses/list', CURRENT_TIMESTAMP),
      (52, '지출결의서 작성', 'edit_note', 2, 5, '/expenses/create', CURRENT_TIMESTAMP),
      (53, '지출결의서 승인', 'verified', 3, 5, '/expenses/approve', CURRENT_TIMESTAMP)
    `);

    console.log('모든 하위 메뉴들이 생성되었습니다.');

    // 생성된 메뉴 목록 확인
    const [allMenus] = await sequelize.query(`
      SELECT m.*, p.name as parent_name 
      FROM menu m 
      LEFT JOIN menu p ON m.parent_id = p.menu_id 
      ORDER BY m.order_num, m.parent_id, m.menu_id
    `);

    console.log('\n생성된 메뉴 목록:');
    console.log('==================');
    allMenus.forEach((menu: any) => {
      const indent = menu.parent_id ? '  └─ ' : '';
      console.log(`${indent}${menu.name} (URL: ${menu.url})`);
    });

  } catch (error) {
    console.error('메뉴 구조 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

finalMenuStructure(); 