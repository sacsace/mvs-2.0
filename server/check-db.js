const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    const [tables] = await sequelize.query('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('Tables:', tables.map(t => t.name));
    
    if (tables.length === 0) {
      console.log('No tables found in database');
      return;
    }
    
    // user 테이블이 있는지 확인
    const userTable = tables.find(t => t.name === 'user');
    if (userTable) {
      const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM user WHERE is_deleted = 0');
      console.log('User count:', userCount[0].count);
    } else {
      console.log('User table not found');
    }
    
    // company 테이블이 있는지 확인
    const companyTable = tables.find(t => t.name === 'company');
    if (companyTable) {
      const [companyCount] = await sequelize.query('SELECT COUNT(*) as count FROM company WHERE is_deleted = 0');
      console.log('Company count:', companyCount[0].count);
    } else {
      console.log('Company table not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase(); 