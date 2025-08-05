import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkMenuUrls() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 모든 메뉴의 URL 정보 조회
    const [menus] = await sequelize.query(`
      SELECT menu_id, name, url, parent_id, order_num
      FROM menu
      ORDER BY menu_id ASC
    `);

    console.log('\n메뉴 URL 정보:');
    console.log('==============');
    menus.forEach((menu: any) => {
      console.log(`ID: ${menu.menu_id}, 이름: ${menu.name}, URL: ${menu.url || '없음'}, 부모: ${menu.parent_id || '없음'}`);
    });

    // 결제 관련 메뉴만 조회
    const [paymentMenus] = await sequelize.query(`
      SELECT menu_id, name, url, parent_id, order_num
      FROM menu
      WHERE name LIKE '%결제%' OR url LIKE '%payment%'
      ORDER BY menu_id ASC
    `);

    console.log('\n결제 관련 메뉴:');
    console.log('===============');
    paymentMenus.forEach((menu: any) => {
      console.log(`ID: ${menu.menu_id}, 이름: ${menu.name}, URL: ${menu.url || '없음'}, 부모: ${menu.parent_id || '없음'}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkMenuUrls(); 