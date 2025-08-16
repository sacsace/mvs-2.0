import sequelize from '../config/database';

(async (): Promise<void> => {
  await sequelize.authenticate();
  
  const dialect = sequelize.getDialect();
  console.log(`데이터베이스 타입: ${dialect}`);
  
  if (dialect === 'postgres') {
    // PostgreSQL용 쿼리
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('테이블 목록:');
    for (const row of results as { table_name: string }[]) {
      console.log('- ' + row.table_name);
    }
  } else {
    // SQLite용 쿼리
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    
    console.log('테이블 목록:');
    for (const row of results as { name: string }[]) {
      console.log('- ' + row.name);
    }
  }
  
  await sequelize.close();
})(); 