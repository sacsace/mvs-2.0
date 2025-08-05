import sequelize from '../config/database';
import Menu from '../models/Menu';

async function addApprovalMenu() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 전자결제 메뉴가 이미 존재하는지 확인
    const existingMenu = await Menu.findOne({
      where: { url: '/approval' }
    });

    if (existingMenu) {
      console.log('전자결제 메뉴가 이미 존재합니다.');
      return;
    }

    // 전자결제 메뉴 추가
    const approvalMenu = await Menu.create({
      name: '전자결제',
      name_en: 'Electronic Approval',
      parent_id: null,
      order_num: 10,
      icon: 'Schedule',
      url: '/approval',
      description: '전자결제 시스템'
    });

    console.log('전자결제 메뉴가 성공적으로 추가되었습니다.');
    console.log('메뉴 ID:', approvalMenu.menu_id);
    console.log('메뉴명:', approvalMenu.name);
    console.log('URL:', approvalMenu.url);

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

addApprovalMenu(); 