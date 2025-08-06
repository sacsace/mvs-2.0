import { Sequelize } from 'sequelize';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigration() {
  console.log('=== Migration Script Started ===');
  
  // 환경변수 확인
  console.log('Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
    // 보안을 위해 URL의 일부만 출력
    const url = process.env.DATABASE_URL;
    const maskedUrl = url.replace(/:([^@]+)@/, ':****@');
    console.log('DATABASE_URL (masked):', maskedUrl);
  }
  
  try {
    // Sequelize 연결 테스트
    if (process.env.DATABASE_URL) {
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: console.log
      });
      
      console.log('Testing database connection...');
      await sequelize.authenticate();
      console.log('Database connection successful!');
      await sequelize.close();
    }
    
    // 마이그레이션 실행
    console.log('Running migrations...');
    const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    if (stdout) console.log('Migration output:', stdout);
    if (stderr) console.log('Migration errors:', stderr);
    
    console.log('=== Migration completed ===');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 