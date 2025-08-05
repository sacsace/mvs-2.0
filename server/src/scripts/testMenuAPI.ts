import { Sequelize } from 'sequelize';
import config from '../config/database';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function testMenuAPI() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 메뉴 데이터 조회
    const [menus] = await sequelize.query(`
      SELECT * FROM menu 
      ORDER BY order_num ASC, parent_id ASC
    `);

    console.log('메뉴 데이터:', menus);

    // 계층 구조로 변환하는 함수
    function buildMenuTree(menus: any[], parentId: number | null = null): any[] {
      return menus
        .filter((menu: any) => menu.parent_id === parentId)
        .map((menu: any) => ({
          ...menu,
          children: buildMenuTree(menus, menu.menu_id)
        }));
    }

    const menuTree = buildMenuTree(menus as any[]);
    console.log('메뉴 트리:', JSON.stringify(menuTree, null, 2));

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

testMenuAPI(); 