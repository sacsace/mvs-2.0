const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkRootUser() {
  try {
    const [results] = await sequelize.query('SELECT id, username, role, default_language FROM user WHERE username = "root"');
    console.log('Root user data:', results[0]);
    
    if (results[0]) {
      console.log('Default language:', results[0].default_language);
      console.log('Type of default_language:', typeof results[0].default_language);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkRootUser(); 