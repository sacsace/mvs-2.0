import sequelize from '../config/database';

async function updateMenuTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 메뉴 테이블에 url 컬럼 추가
    await sequelize.query(`
      ALTER TABLE menu ADD COLUMN url VARCHAR(255)
    `);

    console.log('메뉴 테이블에 URL 필드가 추가되었습니다.');

    // 기존 메뉴들에 기본 URL 설정
    const menuUrls = [
      { name: '사용자 관리', url: '/users' },
      { name: '권한 관리', url: '/permissions' },
      { name: '메뉴 관리', url: '/menus' },
      { name: 'Invoice 관리', url: '/invoices' },
      { name: '지출 결의서 관리', url: '/expenses' }
    ];

    for (const menuUrl of menuUrls) {
      await sequelize.query(`
        UPDATE menu SET url = ? WHERE name = ?
      `, {
        replacements: [menuUrl.url, menuUrl.name]
      });
    }

    console.log('기존 메뉴들에 URL이 설정되었습니다.');

    // 업데이트된 메뉴 목록 확인
    const [menus] = await sequelize.query('SELECT * FROM menu ORDER BY order_num');
    console.log('\n업데이트된 메뉴 목록:');
    console.log('==================');
    menus.forEach((menu: any) => {
      console.log(`${menu.order_num}. ${menu.name} - URL: ${menu.url}`);
    });

  } catch (error) {
    console.error('메뉴 테이블 업데이트 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
updateMenuTable(); 