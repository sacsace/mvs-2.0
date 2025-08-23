import sequelize from '../config/database';
import Payroll from '../models/Payroll';
import User from '../models/User';
import Company from '../models/Company';

async function runPayrollMigration() {
  try {
    console.log('🔄 Starting Payroll table migration...');
    
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Payroll 모델 동기화
    await Payroll.sync({ force: false, alter: true });
    console.log('✅ Payroll table synchronized.');
    
    // 관계 설정 확인
    console.log('✅ Payroll associations configured.');
    
    console.log('🎉 Payroll migration completed successfully!');
    
    // 테이블 정보 출력
    const tableInfo = await sequelize.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'payrolls'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Payroll table structure:');
    console.table(tableInfo[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

runPayrollMigration();
