import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  server: {
    port: number;
    env: string;
  };
  company: {
    defaultName: string;
    defaultAdminRole: string;
  };
}

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

// PostgreSQL 환경변수는 DATABASE_URL이 없을 때만 경고
if (!process.env.DATABASE_URL) {
  const postgresEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  for (const envVar of postgresEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Warning: Missing environment variable: ${envVar}`);
    }
  }
}

// JWT 환경변수도 더 유연하게 처리
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: Missing JWT environment variable: ${envVar}`);
    // throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const config: Config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'mvs',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development',
  },
  company: {
    defaultName: process.env.DEFAULT_COMPANY_NAME || 'Default Company',
    defaultAdminRole: process.env.DEFAULT_ADMIN_ROLE || 'ROOT',
  },
};

export default config; 