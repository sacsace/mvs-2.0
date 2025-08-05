import sequelize from '../config/database';

(async () => {
  await sequelize.authenticate();
  await sequelize.query('INSERT INTO "menu_permission" (menu_id, role, create_date) SELECT menu_id, \'admin\', NOW() FROM "menu"');
  console.log('모든 메뉴에 대해 admin 권한이 추가되었습니다.');
  await sequelize.close();
})(); 