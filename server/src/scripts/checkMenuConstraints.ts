import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkMenuConstraints() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 외래키 제약 조건 확인
    const [foreignKeys] = await sequelize.query("PRAGMA foreign_key_list(menu)");
    
    console.log('\n메뉴 테이블 외래키 제약 조건:');
    console.log('==============================');
    if (foreignKeys.length === 0) {
      console.log('외래키 제약 조건이 없습니다.');
    } else {
      foreignKeys.forEach((fk: any) => {
        console.log(`- ${fk.from} -> ${fk.table}.${fk.to} (ON DELETE: ${fk.on_delete}, ON UPDATE: ${fk.on_update})`);
      });
    }

    // 현재 메뉴 데이터 확인
    const [menus] = await sequelize.query('SELECT * FROM menu ORDER BY menu_id');
    
    console.log('\n현재 메뉴 데이터:');
    console.log('================');
    menus.forEach((menu: any) => {
      console.log(`${menu.menu_id}: ${menu.name} (parent_id: ${menu.parent_id})`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkMenuConstraints(); 