-- 활성화된 회사 정보 조회
SELECT 
    company_id as "회사ID",
    name as "회사명",
    coi as "사업자등록번호",
    pan as "대표자명",
    gst1 as "연락처",
    gst2 as "이메일",
    gst3 as "팩스",
    gst4 as "홈페이지",
    iec as "IEC",
    msme as "MSME",
    bank_name as "은행명",
    account_holder as "예금주",
    account_number as "계좌번호",
    ifsc_code as "IFSC 코드",
    address as "주소",
    TO_CHAR(create_date, 'YYYY-MM-DD HH24:MI:SS') as "생성일",
    TO_CHAR(update_date, 'YYYY-MM-DD HH24:MI:SS') as "수정일"
FROM company
WHERE is_deleted = false
ORDER BY company_id;

-- 활성화된 회사 수 통계
SELECT 
    COUNT(*) as "전체 회사 수",
    COUNT(CASE WHEN is_deleted = false THEN 1 END) as "활성 회사 수",
    COUNT(CASE WHEN is_deleted = true THEN 1 END) as "삭제된 회사 수"
FROM company; 