import sequelize from '../config/database';

async function createSafeMenuStructure() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 기존 메뉴 데이터 삭제
    await sequelize.query('DELETE FROM menu_permission');
    await sequelize.query('DELETE FROM menu');
    console.log('기존 메뉴 데이터를 삭제했습니다.');

    // 메뉴 구조 정의
    const menuStructure = [
      {
        name: '사용자 관리',
        icon: 'people',
        url: '/users',
        children: [
          { name: '사용자 목록', icon: 'list', url: '/users/list' },
          { name: '사용자 등록', icon: 'person_add', url: '/users/register' },
          { name: '사용자 관리', icon: 'admin_panel_settings', url: '/users/manage' }
        ]
      },
      {
        name: '권한 관리',
        icon: 'security',
        url: '/permissions',
        children: [
          { name: '권한 관리', icon: 'security', url: '/permissions/manage' },
          { name: '사용자 권한 관리', icon: 'person_add', url: '/permissions/users' },
          { name: '메뉴 권한 관리', icon: 'menu_book', url: '/permissions/menus' },
          { name: '역할 관리', icon: 'admin_panel_settings', url: '/permissions/roles' }
        ]
      },
      {
        name: '메뉴 관리',
        icon: 'menu',
        url: '/menus',
        children: []
      },
      {
        name: '인보이스 관리',
        icon: 'receipt',
        url: '/invoices',
        children: [
          { name: '인보이스 목록', icon: 'list_alt', url: '/invoices/list' },
          { name: '인보이스 생성', icon: 'add_circle', url: '/invoices/create' },
          { name: '인보이스 승인', icon: 'approval', url: '/invoices/approve' }
        ]
      },
      {
        name: '지출결의서 관리',
        icon: 'account_balance_wallet',
        url: '/expenses',
        children: [
          { name: '지출결의서 목록', icon: 'receipt_long', url: '/expenses/list' },
          { name: '지출결의서 작성', icon: 'edit_note', url: '/expenses/create' },
          { name: '지출결의서 승인', icon: 'verified', url: '/expenses/approve' }
        ]
      }
    ];

    // 최상위 메뉴들 생성
    for (let i = 0; i < menuStructure.length; i++) {
      const menu = menuStructure[i];
      
      // 최상위 메뉴 삽입
      await sequelize.query(`
        INSERT INTO menu (name, icon, order_num, parent_id, url, create_date)
        VALUES (?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)
      `, {
        replacements: [menu.name, menu.icon, i + 1, menu.url]
      });

      // 생성된 메뉴의 ID 가져오기
      const [insertedMenu] = await sequelize.query(`
        SELECT menu_id FROM menu WHERE name = ? AND parent_id IS NULL ORDER BY menu_id DESC LIMIT 1
      `, {
        replacements: [menu.name]
      });

      const parentId = (insertedMenu[0] as any).menu_id;
      console.log(`최상위 메뉴 생성: ${menu.name} (ID: ${parentId})`);

      // 하위 메뉴들 생성
      if (menu.children && menu.children.length > 0) {
        for (let j = 0; j < menu.children.length; j++) {
          const child = menu.children[j];
          await sequelize.query(`
            INSERT INTO menu (name, icon, order_num, parent_id, url, create_date)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, {
            replacements: [child.name, child.icon, j + 1, parentId, child.url]
          });
          
          console.log(`  └─ 하위 메뉴 생성: ${child.name}`);
        }
      }
    }

    console.log('\n모든 메뉴가 안전하게 생성되었습니다.');

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
    console.error('안전한 메뉴 구조 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

createSafeMenuStructure(); 