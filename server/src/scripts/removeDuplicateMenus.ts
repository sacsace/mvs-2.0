import sequelize from '../config/database';

(async () => {
  await sequelize.authenticate();

  // 1. 중복 메뉴의 menu_id 목록 추출 (menu_id가 가장 작은 것만 남김)
  const [duplicates] = await sequelize.query(`
    SELECT name, parent_id, order_num, MIN(menu_id) as keep_id, ARRAY_AGG(menu_id) as all_ids
    FROM menu
    GROUP BY name, parent_id, order_num
    HAVING COUNT(*) > 1
  `);

  let deleteMenuIds: number[] = [];
  for (const row of duplicates as any[]) {
    const ids: number[] = row.all_ids.filter((id: number) => id !== row.keep_id);
    deleteMenuIds = deleteMenuIds.concat(ids);
  }

  if (deleteMenuIds.length > 0) {
    // 2. menu_permission에서 중복 메뉴 권한 삭제
    await sequelize.query(`DELETE FROM menu_permission WHERE menu_id = ANY(ARRAY[:ids])`, { replacements: { ids: deleteMenuIds } });
    // 3. menu 테이블에서 중복 메뉴 삭제
    await sequelize.query(`DELETE FROM menu WHERE menu_id = ANY(ARRAY[:ids])`, { replacements: { ids: deleteMenuIds } });
    console.log('중복 메뉴 및 관련 권한이 삭제되었습니다:', deleteMenuIds);
  } else {
    console.log('중복된 메뉴가 없습니다.');
  }

  await sequelize.close();
})(); 