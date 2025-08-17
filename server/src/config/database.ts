import { Sequelize } from 'sequelize';
import config from './index';

// PostgreSQL만 사용
// 로컬 개발: 기본적으로 로컬 PostgreSQL 사용
// Railway: 환경변수 DATABASE_URL이 있을 때만 사용
const useLocalDB = !process.env.DATABASE_URL;
const railwayDatabaseUrl = 'postgresql://postgres:bPtdSGpmqLfBdaDjmswHLcokCfGUczgJ@autorack.proxy.rlwy.net:10154/railway';
const localDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/mvs';

const databaseUrl = process.env.DATABASE_URL || (useLocalDB ? localDatabaseUrl : railwayDatabaseUrl);

// 연결 정보 로깅
console.log(`🔗 PostgreSQL 연결: ${useLocalDB ? 'LOCAL' : 'RAILWAY'} (${databaseUrl.replace(/:[^:]*@/, ':****@')})`);

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 2,          // Railway 무료 플랜 고려하여 최대 2개로 제한
    min: 0,          // 최소 연결 수
    acquire: 60000,  // 연결 획득 타임아웃 (60초)
    idle: 30000,     // 유휴 연결 타임아웃 (30초)
    evict: 5000,     // 연결 체크 간격 (5초)
  },
  dialectOptions: {
    ssl: useLocalDB ? false : {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: useLocalDB ? 5000 : 20000,  // 로컬: 5초, Railway: 20초
    idle_in_transaction_session_timeout: 10000, // 트랜잭션 유휴 타임아웃
  },
  retry: {
    max: 3,           // 최대 재시도 횟수
    backoffBase: 1000, // 재시도 지연 시간 (1초)
    backoffExponent: 1.5, // 지연 시간 증가율
  }
});

export default sequelize; 