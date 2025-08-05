import { Sequelize } from 'sequelize';
import Menu from '../models/Menu';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// 계층 구조로 변환하는 함수
function buildMenuTree(menus: any[], parentId: number | null = null): any[] {
  return menus
    .filter(menu => menu.parent_id === parentId)
    .map(menu => ({
      ...menu,
      children: buildMenuTree(menus, menu.menu_id)
    }));
}

async function testMenuTreeAPI() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    console.log('\n=== 메뉴 데이터 조회 ===');
    const menus = await Menu.findAll({
      order: [['order_num', 'ASC']],
      raw: true
    });
    console.log('조회된 메뉴 개수:', menus.length);

    console.log('\n=== 메뉴 데이터 상세 ===');
    menus.forEach((menu: any) => {
      console.log(`ID: ${menu.menu_id}, 이름: ${menu.name}, 부모: ${menu.parent_id || '없음'}, 순서: ${menu.order_num}`);
    });

    console.log('\n=== 메뉴 트리 구조 생성 ===');
    const menuTree = buildMenuTree(menus);
    console.log('메뉴 트리 생성 완료');
    console.log('최상위 메뉴 개수:', menuTree.length);

    console.log('\n=== 메뉴 트리 구조 상세 ===');
    const printTree = (tree: any[], level: number = 0) => {
      tree.forEach(menu => {
        const indent = '  '.repeat(level);
        console.log(`${indent}${menu.name} (ID: ${menu.menu_id})`);
        if (menu.children && menu.children.length > 0) {
          printTree(menu.children, level + 1);
        }
      });
    };
    printTree(menuTree);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

testMenuTreeAPI(); 