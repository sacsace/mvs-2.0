-- Company 테이블에 새로운 필드들 추가
ALTER TABLE company ADD COLUMN website VARCHAR(255);
ALTER TABLE company ADD COLUMN email VARCHAR(100);
ALTER TABLE company ADD COLUMN phone VARCHAR(20);
ALTER TABLE company ADD COLUMN signature_url VARCHAR(500); 