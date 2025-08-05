import { Sequelize } from 'sequelize';
import config from './index';

// PostgreSQL 또는 SQLite 선택 (환경변수로 제어)
const usePostgreSQL = process.env.DATABASE_URL || (process.env.DB_HOST && process.env.NODE_ENV === 'production');

const sequelize = usePostgreSQL 
  ? new Sequelize(process.env.DATABASE_URL || '', {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
    });

export default sequelize; 