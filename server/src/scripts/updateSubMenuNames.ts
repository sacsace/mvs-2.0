import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function updateSubMenuNames() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 하위 메뉴명 업데이트
    const updates = [
      { id: 15, name: '결제 목록' },
      { id: 16, name: '결제 작성' },
      { id: 17, name: '결제 승인' }
    ];

    for (const update of updates) {
      const [result] = await sequelize.query(`
        UPDATE menu 
        SET name = ? 
        WHERE menu_id = ?
      `, {
        replacements: [update.name, update.id]
      });
      console.log(`메뉴 ID ${update.id} 업데이트: ${update.name}`);
    }

    // 업데이트된 메뉴 확인
    const [menus] = await sequelize.query(`
      SELECT menu_id, name, parent_id, order_num
      FROM menu
      WHERE parent_id = 4
      ORDER BY order_num ASC
    `);

    console.log('\n결제 관리 하위 메뉴:');
    console.log('===================');
    menus.forEach((menu: any) => {
      console.log(`ID: ${menu.menu_id}, 이름: ${menu.name}, 순서: ${menu.order_num}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

updateSubMenuNames(); 