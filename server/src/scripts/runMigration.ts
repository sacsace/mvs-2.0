import { QueryInterface, DataTypes } from 'sequelize';
import sequelize from '../config/database';

async function runMigration() {
  try {
    console.log('다국어 지원 마이그레이션 시작...');

    // 메뉴 테이블에 영문명 필드 추가
    console.log('메뉴 테이블에 name_en 필드 추가 중...');
    await sequelize.query(`
      ALTER TABLE menu ADD COLUMN name_en VARCHAR(50);
    `);

    // 사용자 테이블에 기본 언어 필드 추가
    console.log('사용자 테이블에 default_language 필드 추가 중...');
    await sequelize.query(`
      ALTER TABLE user ADD COLUMN default_language VARCHAR(10) NOT NULL DEFAULT 'ko';
    `);

    // 기존 메뉴 데이터에 영문명 추가 (한글명을 기본값으로)
    console.log('기존 메뉴 데이터에 영문명 설정 중...');
    await sequelize.query(`
      UPDATE menu SET name_en = name WHERE name_en IS NULL;
    `);

    // 기존 사용자 데이터에 기본 언어 설정
    console.log('기존 사용자 데이터에 기본 언어 설정 중...');
    await sequelize.query(`
      UPDATE user SET default_language = 'ko' WHERE default_language IS NULL;
    `);

    console.log('다국어 지원 마이그레이션 완료!');
    
    // 결과 확인
    const menuCount = await sequelize.query('SELECT COUNT(*) as count FROM menu') as any;
    const userCount = await sequelize.query('SELECT COUNT(*) as count FROM user') as any;
    
    console.log(`메뉴 개수: ${menuCount[0][0].count}`);
    console.log(`사용자 개수: ${userCount[0][0].count}`);

  } catch (error) {
    console.error('마이그레이션 오류:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration(); 