import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function updateMenuName() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 메뉴명 업데이트
    const [result] = await sequelize.query(`
      UPDATE menu 
      SET name = '결제 관리' 
      WHERE name = '지출결의서 관리'
    `);

    console.log('메뉴명 업데이트 완료:', result);

    // 업데이트된 메뉴 확인
    const [menus] = await sequelize.query(`
      SELECT menu_id, name, parent_id, order_num
      FROM menu
      WHERE name LIKE '%결제%' OR name LIKE '%지출%'
      ORDER BY menu_id ASC
    `);

    console.log('\n업데이트된 메뉴:');
    console.log('================');
    menus.forEach((menu: any) => {
      console.log(`ID: ${menu.menu_id}, 이름: ${menu.name}, 부모: ${menu.parent_id || '없음'}, 순서: ${menu.order_num}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

updateMenuName(); 