import sequelize from '../config/database';
import User from '../models/User';
import Company from '../models/Company';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';

async function clearDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // 외래 키 제약 조건을 고려하여 순서대로 삭제
    await MenuPermission.destroy({ where: {}, force: true });
    console.log('Menu permissions cleared');

    await Menu.destroy({ where: {}, force: true });
    console.log('Menus cleared');

    await User.destroy({ where: {}, force: true });
    console.log('Users cleared');

    await Company.destroy({ where: {}, force: true });
    console.log('Companies cleared');

    console.log('All data has been cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await sequelize.close();
  }
}

clearDatabase(); 