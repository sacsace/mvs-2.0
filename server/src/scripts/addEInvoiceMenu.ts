import sequelize from '../config/database';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import User from '../models/User';

async function addEInvoiceMenu() {
  try {
    console.log('🚀 E-Invoice 메뉴 추가 시작...');
    
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 회계 관리 메뉴 찾기 (parent)
    const accountingMenu = await Menu.findOne({
      where: { name: '회계 관리' }
    });

    if (!accountingMenu) {
      console.log('❌ 회계 관리 메뉴를 찾을 수 없습니다.');
      return;
    }

    console.log('📋 회계 관리 메뉴 찾음:', accountingMenu.name, 'ID:', accountingMenu.menu_id);

    // 기존 E-Invoice 메뉴 확인
    const existingEInvoiceMenu = await Menu.findOne({
      where: { 
        name: 'E-Invoice 생성',
        parent_id: accountingMenu.menu_id 
      }
    });

    if (existingEInvoiceMenu) {
      console.log('✅ E-Invoice 메뉴가 이미 존재합니다:', existingEInvoiceMenu.name);
      return;
    }

    // 현재 회계 관리 하위 메뉴들의 최대 order_num 찾기
    const maxOrderNum = await Menu.max('order_num', {
      where: { parent_id: accountingMenu.menu_id }
    }) as number | null;

    // E-Invoice 메뉴 생성
    const einvoiceMenu = await Menu.create({
      name: 'E-Invoice 생성',
      name_en: 'E-Invoice Creation',
      url: '/e-invoice',
      parent_id: accountingMenu.menu_id,
      order_num: (maxOrderNum || 0) + 1
    });

    console.log('📋 E-Invoice 메뉴 생성 완료:', einvoiceMenu.name, 'ID:', einvoiceMenu.menu_id);

    // Root 사용자에게 E-Invoice 메뉴 권한 부여
    const rootUser = await User.findOne({
      where: { userid: 'root' }
    });

    if (rootUser) {
      await MenuPermission.create({
        user_id: rootUser.id,
        menu_id: einvoiceMenu.menu_id,
        can_read: true,
        can_write: true,
        can_delete: true
      });

      console.log('🔗 Root 사용자에게 E-Invoice 메뉴 권한 부여 완료');
    }

    // Admin 사용자들에게도 권한 부여
    const adminUsers = await User.findAll({
      where: { role: 'admin' }
    });

    for (const adminUser of adminUsers) {
      await MenuPermission.create({
        user_id: adminUser.id,
        menu_id: einvoiceMenu.menu_id,
        can_read: true,
        can_write: true,
        can_delete: false
      });
    }

    console.log(`🔗 ${adminUsers.length}명의 Admin 사용자에게 E-Invoice 메뉴 권한 부여 완료`);

    console.log('🎉 E-Invoice 메뉴 추가 완료!');

  } catch (error) {
    console.error('❌ E-Invoice 메뉴 추가 중 오류 발생:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  addEInvoiceMenu()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export default addEInvoiceMenu;
