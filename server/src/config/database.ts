import { Sequelize } from 'sequelize';
import config from './index';

// PostgreSQL만 사용 (로컬/프로덕션 모두 Railway PostgreSQL 사용)
const defaultDatabaseUrl = 'postgresql://postgres:bPtdSGpmqLfBdaDjmswHLcokCfGUczgJ@autorack.proxy.rlwy.net:10154/railway';
const databaseUrl = process.env.DATABASE_URL || defaultDatabaseUrl;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

export default sequelize; 