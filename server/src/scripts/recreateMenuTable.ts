import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function recreateMenuTable() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 메뉴 권한 데이터 삭제
    await sequelize.query('DELETE FROM menu_permission');
    console.log('메뉴 권한 데이터 삭제 완료');

    // 메뉴 테이블 삭제
    await sequelize.query('DROP TABLE IF EXISTS menu');
    console.log('메뉴 테이블 삭제 완료');

    // 메뉴 테이블 다시 생성
    await sequelize.query(`
      CREATE TABLE menu (
        menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        parent_id INTEGER,
        order_num INTEGER,
        icon VARCHAR(50),
        url VARCHAR(255),
        create_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('메뉴 테이블 생성 완료');

    // 올바른 계층 구조로 메뉴 삽입
    const menuData = [
      // 1단계: 최상위 메뉴
      { name: '사용자 관리', parent_id: null, order_num: 1, icon: 'people', url: '/users' },
      { name: '권한 관리', parent_id: null, order_num: 2, icon: 'security', url: '/permissions' },
      { name: '인보이스 관리', parent_id: null, order_num: 3, icon: 'receipt', url: '/invoices' },
      { name: '지출결의서 관리', parent_id: null, order_num: 4, icon: 'account_balance_wallet', url: '/expenses' },

      // 2단계: 사용자 관리 하위 메뉴
      { name: '사용자 목록', parent_id: 1, order_num: 1, icon: 'list', url: '/users/list' },
      { name: '사용자 등록', parent_id: 1, order_num: 2, icon: 'person_add', url: '/users/register' },
      { name: '사용자 관리', parent_id: 1, order_num: 3, icon: 'admin_panel_settings', url: '/users/manage' },

      // 2단계: 권한 관리 하위 메뉴
      { name: '권한 관리', parent_id: 2, order_num: 1, icon: 'security', url: '/permissions/manage' },
      { name: '사용자 권한 관리', parent_id: 2, order_num: 2, icon: 'person_add', url: '/permissions/user' },
      { name: '메뉴 권한 관리', parent_id: 2, order_num: 3, icon: 'menu_book', url: '/permissions/menu' },
      { name: '역할 관리', parent_id: 2, order_num: 4, icon: 'admin_panel_settings', url: '/permissions/role' },

      // 2단계: 인보이스 관리 하위 메뉴
      { name: '인보이스 목록', parent_id: 3, order_num: 1, icon: 'list_alt', url: '/invoices/list' },
      { name: '인보이스 생성', parent_id: 3, order_num: 2, icon: 'add_circle', url: '/invoices/create' },
      { name: '인보이스 승인', parent_id: 3, order_num: 3, icon: 'approval', url: '/invoices/approve' },

      // 2단계: 지출결의서 관리 하위 메뉴
      { name: '지출결의서 목록', parent_id: 4, order_num: 1, icon: 'receipt_long', url: '/expenses/list' },
      { name: '지출결의서 작성', parent_id: 4, order_num: 2, icon: 'edit_note', url: '/expenses/write' },
      { name: '지출결의서 승인', parent_id: 4, order_num: 3, icon: 'verified', url: '/expenses/approve' }
    ];

    // 메뉴 삽입
    for (const menu of menuData) {
      await sequelize.query(`
        INSERT INTO menu (name, parent_id, order_num, icon, url, create_date)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `, {
        replacements: [menu.name, menu.parent_id, menu.order_num, menu.icon, menu.url]
      });
    }

    console.log('메뉴 데이터 삽입 완료');

    // 생성된 메뉴 확인
    const [menus] = await sequelize.query(`
      SELECT * FROM menu
      ORDER BY order_num ASC, parent_id ASC
    `);

    console.log('\n생성된 메뉴 목록:');
    console.log('================');
    menus.forEach((menu: any) => {
      const indent = menu.parent_id ? '  ' : '';
      console.log(`${indent}${menu.menu_id}. ${menu.name} (부모: ${menu.parent_id || '없음'}, 순서: ${menu.order_num})`);
    });

    // root 사용자에게 모든 메뉴 권한 부여
    const [users] = await sequelize.query('SELECT id FROM users WHERE username = ?', {
      replacements: ['root']
    });

    if (users.length > 0) {
      const rootUserId = (users[0] as any).id;
      
      for (const menu of menus as any[]) {
        await sequelize.query(`
          INSERT INTO menu_permission (user_id, menu_id, can_read, can_create, can_update, can_delete, created_at, updated_at)
          VALUES (?, ?, 1, 1, 1, 1, datetime('now'), datetime('now'))
        `, {
          replacements: [rootUserId, menu.menu_id]
        });
      }
      console.log('root 사용자에게 모든 메뉴 권한 부여 완료');
    }

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

recreateMenuTable(); 