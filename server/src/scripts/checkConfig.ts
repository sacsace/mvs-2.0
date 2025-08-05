import config from '../config';
import logger from '../utils/logger';

async function checkConfig() {
  try {
    // Database Configuration
    logger.info('Database Configuration:');
    logger.info(`Host: ${config.db.host}`);
    logger.info(`Port: ${config.db.port}`);
    logger.info(`Database: ${config.db.name}`);
    logger.info(`User: ${config.db.user}`);
    logger.info(`Password: ${config.db.password ? '******' : 'Not Set'}`);

    // Server Configuration
    logger.info('\nServer Configuration:');
    logger.info(`Port: ${config.server.port}`);
    logger.info(`Environment: ${config.server.env}`);

    // JWT Configuration
    logger.info('\nJWT Configuration:');
    logger.info(`Secret: ${config.jwt.secret ? '******' : 'Not Set'}`);
    logger.info(`Refresh Secret: ${config.jwt.refreshSecret ? '******' : 'Not Set'}`);
    logger.info(`Expires In: ${config.jwt.expiresIn}`);
    logger.info(`Refresh Expires In: ${config.jwt.refreshExpiresIn}`);

    // Company Configuration
    logger.info('\nCompany Configuration:');
    logger.info(`Default Name: ${config.company.defaultName}`);
    logger.info(`Default Admin Role: ${config.company.defaultAdminRole}`);

  } catch (error) {
    logger.error('Error checking configuration:', error);
  }
}

checkConfig(); 