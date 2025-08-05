import sequelize from '../config/database';
import Menu from '../models/Menu';

async function addAccountingMenu() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 매입/매출 통계 메뉴가 이미 존재하는지 확인
    const existingMenu = await Menu.findOne({
      where: { url: '/accounting/statistics' }
    });

    if (existingMenu) {
      console.log('매입/매출 통계 메뉴가 이미 존재합니다.');
      console.log('메뉴 ID:', existingMenu.menu_id);
      console.log('메뉴명:', existingMenu.name);
      console.log('URL:', existingMenu.url);
      return;
    }

    // 매입/매출 통계 메뉴 추가
    const accountingMenu = await Menu.create({
      name: '매입/매출 통계',
      name_en: 'Purchase/Sale Statistics',
      parent_id: null,
      order_num: 11,
      icon: 'Analytics',
      url: '/accounting/statistics',
      description: '매입/매출 통계 및 분석'
    });

    console.log('매입/매출 통계 메뉴가 성공적으로 추가되었습니다.');
    console.log('메뉴 ID:', accountingMenu.menu_id);
    console.log('메뉴명:', accountingMenu.name);
    console.log('URL:', accountingMenu.url);

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

addAccountingMenu(); 