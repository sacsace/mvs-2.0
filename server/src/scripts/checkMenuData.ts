import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkMenuData() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 메뉴 데이터 직접 조회
    const [menus] = await sequelize.query(`
      SELECT menu_id, name, parent_id, order_num, icon, url
      FROM menu
      ORDER BY menu_id ASC
    `);

    console.log('\n메뉴 데이터 (직접 조회):');
    console.log('=======================');
    menus.forEach((menu: any) => {
      console.log(`ID: ${menu.menu_id}, 이름: ${menu.name}, 부모: ${menu.parent_id || '없음'}, 순서: ${menu.order_num}`);
    });

    // 계층 구조로 표시
    console.log('\n계층 구조:');
    console.log('==========');
    const topLevelMenus = (menus as any[]).filter(menu => menu.parent_id === null);
    
    topLevelMenus.forEach(topMenu => {
      console.log(`${topMenu.menu_id}. ${topMenu.name}`);
      const subMenus = (menus as any[]).filter(menu => menu.parent_id === topMenu.menu_id);
      subMenus.forEach(subMenu => {
        console.log(`  ${subMenu.menu_id}. ${subMenu.name}`);
      });
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkMenuData(); 