-- company 테이블 구조 확인
DESCRIBE company;

-- company 테이블의 모든 데이터 조회
SELECT 
    company_id,
    name as '회사명',
    coi as '사업자등록번호',
    pan as '대표자명',
    gst1 as '연락처',
    gst2 as '이메일',
    gst3 as '팩스',
    gst4 as '홈페이지',
    iec as 'IEC',
    msme as 'MSME',
    bank_name as '은행명',
    account_holder as '예금주',
    account_number as '계좌번호',
    ifsc_code as 'IFSC 코드',
    address as '주소',
    DATE_FORMAT(create_date, '%Y-%m-%d %H:%i:%s') as '생성일',
    DATE_FORMAT(update_date, '%Y-%m-%d %H:%i:%s') as '수정일',
    CASE WHEN is_deleted = 1 THEN '삭제' ELSE '활성' END as '상태'
FROM company
ORDER BY company_id;

-- 삭제되지 않은 회사만 조회
SELECT 
    company_id,
    name as '회사명',
    coi as '사업자등록번호',
    pan as '대표자명',
    gst1 as '연락처',
    gst2 as '이메일',
    address as '주소'
FROM company
WHERE is_deleted = 0
ORDER BY company_id;

-- 회사 수 통계
SELECT 
    COUNT(*) as '전체 회사 수',
    SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as '활성 회사 수',
    SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as '삭제된 회사 수'
FROM company; 