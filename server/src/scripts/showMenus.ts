import sequelize from '../config/database';

(async (): Promise<void> => {
  await sequelize.authenticate();
  const [results] = await sequelize.query("SELECT * FROM menu ORDER BY order_num");
  console.log('메뉴 목록:');
  console.log('==========');
  for (const row of results as any[]) {
    console.log(`${row.order_num}. ${row.name} (아이콘: ${row.icon})`);
  }
  await sequelize.close();
})(); 