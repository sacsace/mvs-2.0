import sequelize from '../config/database';

async function assignAllMenuPermissionsToRoot() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // root 사용자 ID 조회
    const [rootUsers] = await sequelize.query('SELECT id FROM user WHERE username = ?', {
      replacements: ['root']
    });

    if (rootUsers.length === 0) {
      console.error('Root 사용자를 찾을 수 없습니다.');
      return;
    }

    const rootUserId = (rootUsers[0] as any).id;
    console.log(`Root 사용자 ID: ${rootUserId}`);

    // 모든 메뉴 조회
    const [allMenus] = await sequelize.query('SELECT menu_id FROM menu ORDER BY order_num');
    console.log(`총 ${allMenus.length}개의 메뉴를 찾았습니다.`);

    // 기존 root 권한 삭제
    await sequelize.query('DELETE FROM menu_permission WHERE user_id = ?', {
      replacements: [rootUserId]
    });
    console.log('기존 root 권한 데이터를 삭제했습니다.');

    // 모든 메뉴에 대한 권한 부여
    for (const menu of allMenus as any[]) {
      await sequelize.query(`
        INSERT INTO menu_permission (user_id, menu_id, can_read, can_create, can_update, can_delete, create_date)
        VALUES (?, ?, 1, 1, 1, 1, CURRENT_TIMESTAMP)
      `, {
        replacements: [rootUserId, menu.menu_id]
      });
    }

    console.log('Root 계정에 모든 메뉴 권한이 부여되었습니다.');

    // 부여된 권한 확인
    const [permissions] = await sequelize.query(`
      SELECT mp.*, m.name as menu_name, u.username
      FROM menu_permission mp
      JOIN menu m ON mp.menu_id = m.menu_id
      JOIN user u ON mp.user_id = u.id
      WHERE mp.user_id = ?
      ORDER BY m.order_num
    `, {
      replacements: [rootUserId]
    });

    console.log('\nRoot 계정의 메뉴 권한:');
    console.log('========================');
    permissions.forEach((perm: any) => {
      console.log(`${perm.menu_name}: 읽기(${perm.can_read}), 생성(${perm.can_create}), 수정(${perm.can_update}), 삭제(${perm.can_delete})`);
    });

  } catch (error) {
    console.error('메뉴 권한 부여 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

assignAllMenuPermissionsToRoot(); 