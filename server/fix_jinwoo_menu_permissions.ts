import sequelize from './src/config/database';
import { QueryTypes } from 'sequelize';

const fixJinwooMenuPermissions = async () => {
  console.log('🔧 Jinwoo Lee 메뉴 권한 수정 시작...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. Jinwoo Lee 사용자 확인
    const jinwooUsers = await sequelize.query(`
      SELECT id, userid, username, role, company_id
      FROM "user" 
      WHERE userid = 'jwits'
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    if (!jinwooUsers || jinwooUsers.length === 0) {
      console.log('❌ Jinwoo Lee 사용자를 찾을 수 없습니다.');
      return;
    }

    const jinwoo = jinwooUsers[0];
    console.log(`\n👤 대상 사용자: ${jinwoo.username} (ID: ${jinwoo.id}, Role: ${jinwoo.role})`);

    // 2. 기존 메뉴 권한 삭제
    await sequelize.query(`
      DELETE FROM menu_permission WHERE user_id = ?
    `, {
      replacements: [jinwoo.id],
      type: QueryTypes.DELETE
    });
    console.log('🗑️ 기존 메뉴 권한 삭제 완료');

    // 3. Admin 역할에 맞는 메뉴 권한 설정
    // Admin은 모든 메뉴에 대해 읽기, 생성, 수정 권한 (삭제 제외)
    const allMenus = await sequelize.query(`
      SELECT menu_id, name FROM menu ORDER BY menu_id
    `, {
      type: QueryTypes.SELECT
    }) as any[];

    console.log(`\n📋 ${allMenus.length}개 메뉴에 대한 권한 설정 중...`);

    for (const menu of allMenus) {
      await sequelize.query(`
        INSERT INTO menu_permission (user_id, menu_id, can_read, can_create, can_update, can_delete)
        VALUES (?, ?, true, true, true, false)
      `, {
        replacements: [jinwoo.id, menu.menu_id],
        type: QueryTypes.INSERT
      });
      console.log(`✅ ${menu.name} - 권한 설정 완료`);
    }

    // 4. 설정 결과 확인
    const newPermissions = await sequelize.query(`
      SELECT 
        mp.can_read, mp.can_create, mp.can_update, mp.can_delete,
        m.name as menu_name, m.url as menu_url
      FROM menu_permission mp
      JOIN menu m ON mp.menu_id = m.menu_id
      WHERE mp.user_id = ?
      ORDER BY m.menu_id
    `, {
      replacements: [jinwoo.id],
      type: QueryTypes.SELECT
    }) as any[];

    console.log(`\n✅ 권한 설정 완료! 총 ${newPermissions.length}개 메뉴`);
    console.log('\n📋 설정된 권한:');
    newPermissions.forEach((perm: any, index: number) => {
      const permissions = [
        perm.can_read ? 'R' : '-',
        perm.can_create ? 'C' : '-', 
        perm.can_update ? 'U' : '-',
        perm.can_delete ? 'D' : '-'
      ].join('');
      console.log(`  ${index + 1}. ${perm.menu_name} (${permissions})`);
    });

    // 5. 읽기 권한 개수 확인
    const readableCount = newPermissions.filter((p: any) => p.can_read).length;
    console.log(`\n📖 읽기 권한이 있는 메뉴: ${readableCount}/${newPermissions.length}개`);

    if (readableCount > 0) {
      console.log('\n🎉 성공! 이제 Jinwoo Lee 사용자에게 메뉴가 표시됩니다.');
      console.log('💡 브라우저에서 로그아웃 후 다시 로그인해보세요.');
    } else {
      console.log('\n❌ 문제: 여전히 읽기 권한이 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
};

fixJinwooMenuPermissions();
