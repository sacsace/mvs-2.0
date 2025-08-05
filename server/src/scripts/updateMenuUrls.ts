import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function updateMenuUrls() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // URL 업데이트 매핑
    const urlUpdates = [
      { oldUrl: '/expenses', newUrl: '/payments' },
      { oldUrl: '/expenses/list', newUrl: '/payments/list' },
      { oldUrl: '/expenses/create', newUrl: '/payments/create' },
      { oldUrl: '/expenses/write', newUrl: '/payments/write' },
      { oldUrl: '/expenses/approve', newUrl: '/payments/approve' }
    ];

    for (const update of urlUpdates) {
      const [result] = await sequelize.query(`
        UPDATE menu 
        SET url = ? 
        WHERE url = ?
      `, {
        replacements: [update.newUrl, update.oldUrl]
      });
      console.log(`URL 업데이트: ${update.oldUrl} → ${update.newUrl}`);
    }

    // 업데이트된 메뉴 확인
    const [menus] = await sequelize.query(`
      SELECT menu_id, name, url, parent_id, order_num
      FROM menu
      WHERE url LIKE '%payment%' OR url LIKE '%expense%'
      ORDER BY menu_id ASC
    `);

    console.log('\n업데이트된 메뉴 URL:');
    console.log('====================');
    menus.forEach((menu: any) => {
      console.log(`ID: ${menu.menu_id}, 이름: ${menu.name}, URL: ${menu.url}, 부모: ${menu.parent_id || '없음'}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

updateMenuUrls(); 