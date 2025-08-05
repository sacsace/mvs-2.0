import sequelize from '../config/database';

(async (): Promise<void> => {
  await sequelize.authenticate();
  const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('테이블 목록:');
  for (const row of results as { name: string }[]) {
    console.log('- ' + row.name);
  }
  await sequelize.close();
})(); 