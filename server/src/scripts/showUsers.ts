import sequelize from '../config/database';

(async () => {
  await sequelize.authenticate();
  const [results] = await sequelize.query('SELECT * FROM "user"');
  console.log(results);
  await sequelize.close();
})(); 