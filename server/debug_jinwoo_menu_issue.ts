import sequelize from './src/config/database';
import { QueryTypes } from 'sequelize';

const debugJinwooMenuIssue = async () => {
  console.log('🔍 Jinwoo Lee 메뉴 문제 디버깅 시작...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. Jinwoo Lee 사용자 정보 확인
    const jinwooUsers = await sequelize.query(`
      SELECT id, userid, username, role, company_id
      FROM "user" 
      WHERE username LIKE '%Jinwoo%' OR userid LIKE '%jinwoo%' OR userid LIKE '%jwits%'
      ORDER BY id
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    console.log('\n👤 Jinwoo Lee 관련 사용자들:');
    console.log(jinwooUsers);

    if (!jinwooUsers || jinwooUsers.length === 0) {
      console.log('❌ Jinwoo Lee 사용자를 찾을 수 없습니다.');
      return;
    }

    // 가장 최신 Jinwoo Lee 사용자 선택 (ID 6인 것으로 보임)
    const jinwoo = jinwooUsers.find((u: any) => u.id === 6) || jinwooUsers[0];
    console.log(`\n📋 선택된 사용자: ${jinwoo.username} (ID: ${jinwoo.id})`);

    // 2. 회사 정보 확인
    const companies = await sequelize.query(`
      SELECT company_id, name
      FROM company 
      WHERE company_id = ? AND is_deleted = false
    `, {
      replacements: [jinwoo.company_id],
      type: QueryTypes.SELECT
    }) as any[];

    console.log('\n🏢 사용자 회사 정보:');
    console.log(companies);

    // 3. 메뉴 권한 상세 확인
    const menuPermissions = await sequelize.query(`
      SELECT 
        mp.user_id,
        mp.menu_id,
        mp.can_read,
        mp.can_create,
        mp.can_update,
        mp.can_delete,
        m.name as menu_name,
        m.url as menu_url,
        m.order_num,
        m.parent_id
      FROM menu_permission mp
      JOIN menu m ON mp.menu_id = m.menu_id
      WHERE mp.user_id = ?
      ORDER BY m.order_num, m.menu_id
    `, {
      replacements: [jinwoo.id],
      type: QueryTypes.SELECT
    }) as any[];

    console.log(`\n📋 Jinwoo Lee의 메뉴 권한 (${menuPermissions.length}개):`);
    menuPermissions.forEach((perm: any, index: number) => {
      const permissions = [
        perm.can_read ? 'R' : '-',
        perm.can_create ? 'C' : '-', 
        perm.can_update ? 'U' : '-',
        perm.can_delete ? 'D' : '-'
      ].join('');
      console.log(`  ${index + 1}. ${perm.menu_name} (${permissions}) - URL: ${perm.menu_url}`);
    });

    // 4. 읽기 권한이 있는 메뉴만 확인
    const readableMenus = menuPermissions.filter((perm: any) => perm.can_read);
    console.log(`\n📖 읽기 권한이 있는 메뉴 (${readableMenus.length}개):`);
    readableMenus.forEach((perm: any, index: number) => {
      console.log(`  ${index + 1}. ${perm.menu_name} - ${perm.menu_url}`);
    });

    // 5. 전체 메뉴 목록 확인
    const allMenus = await sequelize.query(`
      SELECT menu_id, name, url, parent_id, order_num
      FROM menu
      ORDER BY order_num, menu_id
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    console.log(`\n📄 전체 메뉴 목록 (${allMenus.length}개):`);
    allMenus.forEach((menu: any, index: number) => {
      const hasPermission = menuPermissions.some((p: any) => p.menu_id === menu.menu_id && p.can_read);
      const status = hasPermission ? '✅' : '❌';
      console.log(`  ${index + 1}. ${menu.name} - ${menu.url} ${status}`);
    });

    // 6. API 엔드포인트 테스트 시뮬레이션
    console.log('\n🔍 API 엔드포인트 시뮬레이션:');
    console.log(`GET /api/menus?userId=${jinwoo.id}`);
    
    // 실제 메뉴 API 로직과 동일한 쿼리
    const apiMenus = await sequelize.query(`
      SELECT DISTINCT m.menu_id, m.name, m.url, m.parent_id, m.order_num
      FROM menu m
      LEFT JOIN menu_permission mp ON m.menu_id = mp.menu_id AND mp.user_id = ?
      WHERE mp.can_read = true OR ? = 'root'
      ORDER BY m.order_num, m.menu_id
    `, {
      replacements: [jinwoo.id, jinwoo.role],
      type: QueryTypes.SELECT
    }) as any[];

    console.log(`API 응답 예상 메뉴 개수: ${apiMenus.length}`);
    apiMenus.forEach((menu: any, index: number) => {
      console.log(`  ${index + 1}. ${menu.name} - ${menu.url}`);
    });

    // 7. 문제 분석
    console.log('\n🔍 문제 분석:');
    if (menuPermissions.length === 0) {
      console.log('❌ 문제: 메뉴 권한이 전혀 없습니다!');
    } else if (readableMenus.length === 0) {
      console.log('❌ 문제: 읽기 권한이 있는 메뉴가 없습니다!');
    } else if (apiMenus.length === 0) {
      console.log('❌ 문제: API 쿼리 결과가 비어있습니다!');
    } else {
      console.log('✅ 메뉴 권한은 정상적으로 설정되어 있습니다.');
      console.log('💡 클라이언트에서 메뉴가 표시되지 않는다면 프론트엔드 문제일 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
};

debugJinwooMenuIssue();
