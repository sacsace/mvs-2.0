const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

async function resetRootPassword() {
  try {
    const newPassword = 'admin'; // You can change this to any password you want
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the root user's password
    await sequelize.query(
      'UPDATE user SET password = ? WHERE role = "root"',
      {
        replacements: [hashedPassword]
      }
    );
    
    console.log('=== Root Password Reset ===');
    console.log('New password:', newPassword);
    console.log('Password has been updated successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Username: Minsub Lee');
    console.log('Password:', newPassword);
    
  } catch (error) {
    console.error('Error resetting root password:', error);
  } finally {
    await sequelize.close();
  }
}

resetRootPassword(); 