import sequelize from './src/config/database';
import { QueryTypes } from 'sequelize';

const debugMenuApiDifference = async () => {
  console.log('🔍 메뉴 API 차이점 디버깅...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    const userId = 6; // Jinwoo Lee
    console.log(`\n👤 사용자 ID: ${userId} (Jinwoo Lee)`);

    // 1. 사용자의 메뉴 권한 확인
    console.log('\n1️⃣ 사용자 메뉴 권한 확인:');
    const menuPermissions = await sequelize.query(`
      SELECT 
        mp.menu_id,
        mp.can_read,
        mp.can_create,
        mp.can_update,
        mp.can_delete,
        m.name as menu_name,
        m.url as menu_url
      FROM menu_permission mp
      JOIN menu m ON mp.menu_id = m.menu_id
      WHERE mp.user_id = ?
      ORDER BY m.order_num
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    }) as any[];

    console.log(`총 권한 개수: ${menuPermissions.length}`);
    menuPermissions.forEach((perm: any, index: number) => {
      const permissions = [
        perm.can_read ? 'R' : '-',
        perm.can_create ? 'C' : '-', 
        perm.can_update ? 'U' : '-',
        perm.can_delete ? 'D' : '-'
      ].join('');
      console.log(`  ${index + 1}. ${perm.menu_name} (${permissions}) - URL: ${perm.menu_url}`);
    });

    // 2. 읽기 권한이 있는 메뉴만 필터링
    console.log('\n2️⃣ 읽기 권한이 있는 메뉴:');
    const readableMenuPermissions = menuPermissions.filter(mp => Boolean(mp.can_read));
    const menuIds = readableMenuPermissions.map(mp => mp.menu_id);
    
    console.log(`읽기 권한 메뉴 개수: ${readableMenuPermissions.length}`);
    console.log(`메뉴 ID 목록: [${menuIds.join(', ')}]`);
    
    readableMenuPermissions.forEach((perm: any, index: number) => {
      console.log(`  ${index + 1}. ${perm.menu_name} - ${perm.menu_url}`);
    });

    // 3. 실제 메뉴 조회 시뮬레이션 (/api/menu)
    console.log('\n3️⃣ /api/menu 엔드포인트 시뮬레이션:');
    if (menuIds.length === 0) {
      console.log('읽기 권한이 있는 메뉴가 없어서 빈 배열 반환');
    } else {
      const menus = await sequelize.query(`
        SELECT menu_id, name, url, parent_id, order_num
        FROM menu
        WHERE menu_id IN (${menuIds.map(() => '?').join(', ')})
        ORDER BY order_num
      `, {
        replacements: menuIds,
        type: QueryTypes.SELECT
      }) as any[];

      console.log(`조회된 메뉴 개수: ${menus.length}`);
      menus.forEach((menu: any, index: number) => {
        console.log(`  ${index + 1}. ${menu.name} - ${menu.url}`);
      });
    }

    // 4. 전체 메뉴 목록 확인
    console.log('\n4️⃣ 전체 메뉴 목록:');
    const allMenus = await sequelize.query(`
      SELECT menu_id, name, url, order_num
      FROM menu
      ORDER BY order_num
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    console.log(`전체 메뉴 개수: ${allMenus.length}`);
    allMenus.forEach((menu: any, index: number) => {
      const hasPermission = menuIds.includes(menu.menu_id);
      const status = hasPermission ? '✅' : '❌';
      console.log(`  ${index + 1}. ${menu.name} - ${menu.url} ${status}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
};

debugMenuApiDifference();
