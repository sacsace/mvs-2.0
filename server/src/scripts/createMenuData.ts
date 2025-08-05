import sequelize from '../config/database';

async function createMenuData() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 메뉴 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS menu (
        menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        icon VARCHAR(50),
        order_num INTEGER,
        parent_id INTEGER,
        create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES menu(menu_id)
      )
    `);

    console.log('메뉴 테이블이 생성되었습니다.');

    // 기본 메뉴 데이터 삽입
    const menuData = [
      {
        name: '사용자 관리',
        icon: 'users',
        order_num: 1,
        parent_id: null
      },
      {
        name: '권한 관리',
        icon: 'shield',
        order_num: 2,
        parent_id: null
      },
      {
        name: '메뉴 관리',
        icon: 'menu',
        order_num: 3,
        parent_id: null
      },
      {
        name: 'Invoice 관리',
        icon: 'file-text',
        order_num: 4,
        parent_id: null
      },
      {
        name: '지출 결의서 관리',
        icon: 'credit-card',
        order_num: 5,
        parent_id: null
      }
    ];

    // 기존 메뉴 데이터 삭제 (중복 방지)
    await sequelize.query('DELETE FROM menu');
    console.log('기존 메뉴 데이터를 삭제했습니다.');

    // 새 메뉴 데이터 삽입
    for (const menu of menuData) {
      await sequelize.query(`
        INSERT INTO menu (name, icon, order_num, parent_id, create_date)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, {
        replacements: [menu.name, menu.icon, menu.order_num, menu.parent_id]
      });
    }

    console.log('기본 메뉴 데이터가 성공적으로 입력되었습니다.');

    // 입력된 메뉴 데이터 확인
    const [menus] = await sequelize.query('SELECT * FROM menu ORDER BY order_num');
    console.log('\n입력된 메뉴 목록:');
    console.log('==================');
    menus.forEach((menu: any) => {
      console.log(`${menu.order_num}. ${menu.name} (아이콘: ${menu.icon})`);
    });

  } catch (error) {
    console.error('메뉴 데이터 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
createMenuData(); 