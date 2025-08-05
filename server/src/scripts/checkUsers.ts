import User from '../models/User';
import sequelize from '../config/database';

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const users = await User.findAll({
      attributes: ['id', 'username', 'company_id', 'role', 'is_deleted', 'create_date', 'update_date']
    });

    console.log('\nUser table data:');
    console.log('----------------');
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach(user => {
        console.log(JSON.stringify(user.toJSON(), null, 2));
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsers(); 