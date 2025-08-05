import sequelize from '../config/database';

async function createNewMenuStructure() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 기존 메뉴 데이터 삭제
    await sequelize.query('DELETE FROM menu_permission');
    await sequelize.query('DELETE FROM menu');
    console.log('기존 메뉴 데이터를 삭제했습니다.');

    // 새로운 메뉴 구조 생성
    const menuData = [
      // 최상위 메뉴들
      { name: '사용자 관리', icon: 'people', order_num: 1, parent_id: null, url: '/users' },
      { name: '권한 관리', icon: 'security', order_num: 2, parent_id: null, url: '/permissions' },
      { name: '메뉴 관리', icon: 'menu', order_num: 3, parent_id: null, url: '/menus' },
      { name: '인보이스 관리', icon: 'receipt', order_num: 4, parent_id: null, url: '/invoices' },
      { name: '지출결의서 관리', icon: 'account_balance_wallet', order_num: 5, parent_id: null, url: '/expenses' }
    ];

    // 최상위 메뉴들 삽입
    for (const menu of menuData) {
      await sequelize.query(`
        INSERT INTO menu (name, icon, order_num, parent_id, url, create_date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, {
        replacements: [menu.name, menu.icon, menu.order_num, menu.parent_id, menu.url]
      });
    }

    console.log('최상위 메뉴들이 생성되었습니다.');

    // 사용자 관리 메뉴 ID 조회
    const [userMenu] = await sequelize.query('SELECT menu_id FROM menu WHERE name = ?', {
      replacements: ['사용자 관리']
    });
    const userMenuId = (userMenu[0] as any).menu_id;

    // 사용자 관리 하위 메뉴들
    const userSubMenus = [
      { name: '사용자 목록', icon: 'list', order_num: 1, parent_id: userMenuId, url: '/users/list' },
      { name: '사용자 등록', icon: 'person_add', order_num: 2, parent_id: userMenuId, url: '/users/register' },
      { name: '사용자 관리', icon: 'admin_panel_settings', order_num: 3, parent_id: userMenuId, url: '/users/manage' }
    ];

    // 사용자 관리 하위 메뉴들 삽입
    for (const subMenu of userSubMenus) {
      await sequelize.query(`
        INSERT INTO menu (name, icon, order_num, parent_id, url, create_date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, {
        replacements: [subMenu.name, subMenu.icon, subMenu.order_num, subMenu.parent_id, subMenu.url]
      });
    }

    console.log('사용자 관리 하위 메뉴들이 생성되었습니다.');

    // 권한 관리 메뉴 ID 조회
    const [permissionMenu] = await sequelize.query('SELECT menu_id FROM menu WHERE name = ?', {
      replacements: ['권한 관리']
    });
    const permissionMenuId = (permissionMenu[0] as any).menu_id;

    // 권한 관리 하위 메뉴들
    const permissionSubMenus = [
      { name: '권한 관리', icon: 'security', order_num: 1, parent_id: permissionMenuId, url: '/permissions/manage' },
      { name: '사용자 권한 관리', icon: 'person_add', order_num: 2, parent_id: permissionMenuId, url: '/permissions/users' },
      { name: '메뉴 권한 관리', icon: 'menu_book', order_num: 3, parent_id: permissionMenuId, url: '/permissions/menus' },
      { name: '역할 관리', icon: 'admin_panel_settings', order_num: 4, parent_id: permissionMenuId, url: '/permissions/roles' }
    ];

    // 권한 관리 하위 메뉴들 삽입
    for (const subMenu of permissionSubMenus) {
      await sequelize.query(`
        INSERT INTO menu (name, icon, order_num, parent_id, url, create_date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, {
        replacements: [subMenu.name, subMenu.icon, subMenu.order_num, subMenu.parent_id, subMenu.url]
      });
    }

    console.log('권한 관리 하위 메뉴들이 생성되었습니다.');

    // 인보이스 관리 메뉴 ID 조회
    const [invoiceMenu] = await sequelize.query('SELECT menu_id FROM menu WHERE name = ?', {
      replacements: ['인보이스 관리']
    });
    const invoiceMenuId = (invoiceMenu[0] as any).menu_id;

    // 인보이스 관리 하위 메뉴들
    const invoiceSubMenus = [
      { name: '인보이스 목록', icon: 'list_alt', order_num: 1, parent_id: invoiceMenuId, url: '/invoices/list' },
      { name: '인보이스 생성', icon: 'add_circle', order_num: 2, parent_id: invoiceMenuId, url: '/invoices/create' },
      { name: '인보이스 승인', icon: 'approval', order_num: 3, parent_id: invoiceMenuId, url: '/invoices/approve' }
    ];

    // 인보이스 관리 하위 메뉴들 삽입
    for (const subMenu of invoiceSubMenus) {
      await sequelize.query(`
        INSERT INTO menu (name, icon, order_num, parent_id, url, create_date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, {
        replacements: [subMenu.name, subMenu.icon, subMenu.order_num, subMenu.parent_id, subMenu.url]
      });
    }

    console.log('인보이스 관리 하위 메뉴들이 생성되었습니다.');

    // 지출결의서 관리 메뉴 ID 조회
    const [expenseMenu] = await sequelize.query('SELECT menu_id FROM menu WHERE name = ?', {
      replacements: ['지출결의서 관리']
    });
    const expenseMenuId = (expenseMenu[0] as any).menu_id;

    // 지출결의서 관리 하위 메뉴들
    const expenseSubMenus = [
      { name: '지출결의서 목록', icon: 'receipt_long', order_num: 1, parent_id: expenseMenuId, url: '/expenses/list' },
      { name: '지출결의서 작성', icon: 'edit_note', order_num: 2, parent_id: expenseMenuId, url: '/expenses/create' },
      { name: '지출결의서 승인', icon: 'verified', order_num: 3, parent_id: expenseMenuId, url: '/expenses/approve' }
    ];

    // 지출결의서 관리 하위 메뉴들 삽입
    for (const subMenu of expenseSubMenus) {
      await sequelize.query(`
        INSERT INTO menu (name, icon, order_num, parent_id, url, create_date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, {
        replacements: [subMenu.name, subMenu.icon, subMenu.order_num, subMenu.parent_id, subMenu.url]
      });
    }

    console.log('지출결의서 관리 하위 메뉴들이 생성되었습니다.');

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
    console.error('새로운 메뉴 구조 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

createNewMenuStructure(); 