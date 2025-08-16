-- Jinwoo Lee 사용자 (ID: 6)에게 모든 메뉴 권한 부여

-- 1. 기존 권한 확인
SELECT 'Current permissions for Jinwoo Lee:' as info;
SELECT mp.*, m.name as menu_name 
FROM menu_permission mp 
JOIN menu m ON mp.menu_id = m.menu_id 
WHERE mp.user_id = 6;

-- 2. 기존 권한 모두 삭제
DELETE FROM menu_permission WHERE user_id = 6;

-- 3. 모든 메뉴에 대한 권한 부여 (admin 레벨: CRUD 중 D 제외)
INSERT INTO menu_permission (user_id, menu_id, can_read, can_create, can_update, can_delete, create_date)
SELECT 
    6 as user_id,
    menu_id,
    1 as can_read,
    1 as can_create, 
    1 as can_update,
    0 as can_delete,
    CURRENT_TIMESTAMP as create_date
FROM menu
WHERE menu_id IS NOT NULL;

-- 4. 결과 확인
SELECT 'New permissions for Jinwoo Lee:' as info;
SELECT mp.*, m.name as menu_name 
FROM menu_permission mp 
JOIN menu m ON mp.menu_id = m.menu_id 
WHERE mp.user_id = 6
ORDER BY m.order_num;

-- 5. 권한 개수 확인
SELECT 
    'Permission Summary:' as info,
    COUNT(*) as total_permissions,
    SUM(can_read) as read_permissions,
    SUM(can_create) as create_permissions,
    SUM(can_update) as update_permissions,
    SUM(can_delete) as delete_permissions
FROM menu_permission 
WHERE user_id = 6;
