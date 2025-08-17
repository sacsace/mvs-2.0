# MVS 2.0 시스템 개발 완성 프롬프트

## 🎯 **시스템 개요**
MVS 2.0은 React + Node.js + PostgreSQL 기반의 **기업용 업무 관리 시스템**입니다.
- **Frontend**: React (TypeScript), Material-UI
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL (로컬: `mvs`, 운영: Railway)
- **인증**: JWT 기반 인증 시스템

## 🗄️ **데이터베이스 설정**

### **PostgreSQL 설정**
```bash
# 데이터베이스 생성
psql -U postgres -d postgres -c "CREATE DATABASE mvs;"

# 연결 정보
- 로컬: postgresql://postgres:postgres@localhost:5432/mvs
- 운영: postgresql://postgres:bPtdSGpmqLfBdaDjmswHLcokCfGUczgJ@autorack.proxy.rlwy.net:10154/railway
```

### **핵심 테이블 (15개)**
1. **user** - 사용자 정보 (userid, username, password, role, company_id)
2. **company** - 회사 정보 (name, coi, login_period_start/end 등)
3. **menu** - 메뉴 구조 (계층형, parent_id 지원)
4. **menu_permission** - 사용자별 메뉴 권한 (CRUD 세분화)
5. **approval** - 전자결재 시스템
6. **approval_comment** - 결재 댓글
7. **approval_file** - 결재 첨부파일
8. **partners** - 파트너 업체 관리
9. **invoice** - 인보이스 관리
10. **transaction** - 거래 내역
11. **permissions, roles, role_permissions** - 역할 기반 권한
12. **user_permissions** - 사용자별 개별 권한
13. **company_gst** - 회사 GST 정보

## 👥 **사용자 권한 시스템**

### **역할 계층**
```typescript
ROLE_HIERARCHY = {
  'root': 4,    // 시스템 최고 관리자
  'admin': 3,   // 회사 관리자
  'audit': 2,   // 감사자 (Minsub Ventures Private Limited만 가능)
  'user': 1     // 일반 사용자
}
```

### **권한 로직**
1. **역할 기반 기본 권한** + **메뉴별 개별 권한 오버라이드**
2. **최초 사용자**: 상위 메뉴(parent_id: null)에 자동 읽기 권한 부여
3. **user 역할 기본 권한**:
   - 회사정보관리: 읽기만
   - 전자결재: 읽기, 생성, 수정
   - 나머지 메뉴: 권한 없음

### **권한 검증 로직**
```typescript
// server/src/utils/permissionChecker.ts
function mergePermissions(roleDefaults, menuPermissions) {
  // 역할 기본 권한과 개별 메뉴 권한 병합
}
```

## 🏗️ **메뉴 구조 (11개)**

### **계층형 메뉴**
```
📁 대시보드 (/dashboard)
📁 사용자 관리 (부모 메뉴)
   └── 사용자 목록 (/users/list)
   └── 회사 정보 관리 (/users/company)
   └── 파트너 업체 관리 (/users/partners)
📁 메뉴 권한 관리 (/permissions/menu) - 통합 권한 관리
📁 업무 관리 (부모 메뉴)
   └── 전자결재 (/approval)
📁 회계 관리 (부모 메뉴)
   └── 매출 관리 (/invoice)
   └── 매입/매출 통계 (/accounting/statistics)
```

## 🔧 **핵심 기능 구현**

### **1. 사용자 관리**
```typescript
// 사용자 삭제/재등록 로직
if (deletedUser) {
  // 삭제된 사용자 ID 변경하여 재사용 가능
  const newUserid = `${deletedUser.userid}_deleted_${timestamp}`;
  await deletedUser.update({ userid: newUserid });
}

// 새 사용자에게 상위 메뉴 기본 권한 부여
const parentMenus = await Menu.findAll({ where: { parent_id: null } });
const defaultPermissions = parentMenus.map(menu => ({
  user_id: user.id,
  menu_id: menu.menu_id,
  can_read: true,
  can_create: false,
  can_update: false,
  can_delete: false
}));
```

### **2. 회사 생성 날짜 검증**
```typescript
// server/src/routes/company.ts
const validateDate = (dateStr: any) => {
  if (!dateStr || dateStr === '' || dateStr === 'Invalid date' || typeof dateStr !== 'string') {
    return null;
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : dateStr;
};

await Company.create({
  // ... 기타 필드
  login_period_start: validateDate(login_period_start),
  login_period_end: validateDate(login_period_end)
});
```

### **3. 역할별 제한사항**
- **Auditor 역할**: "Minsub Ventures Private Limited"만 선택 가능
- **admin**: 일반 사용자만 추가 가능, 같은 회사 내만
- **audit**: 일반 사용자만 추가 가능, 같은 회사 내만
- **root**: 모든 권한 (단, 다른 root 생성 불가)

### **4. UI/UX 개선사항**
```css
/* 전역 폰트 적용 */
body { font-family: 'sans-serif' !important; }

/* 버튼 권한 기반 표시/숨김 */
{hasPermission && <Button>수정</Button>}

/* 사용자 삭제 확인 Dialog (Material-UI) */
<Dialog open={deleteDialogOpen}>
  <DialogTitle>사용자 삭제 확인</DialogTitle>
  <DialogContent>정말로 삭제하시겠습니까?</DialogContent>
</Dialog>
```

### **5. 전자결재 시스템**
- 결재자 검색 기능
- 파일 첨부 지원
- 댓글 시스템 (Enter 키 제출)
- 알림 카운트 표시
- 필터링 (받은/보낸 결재)

## 🚀 **배포 및 환경 설정**

### **로컬 개발 환경**
```bash
# 서버 시작
cd server && npm run dev

# 클라이언트 시작  
cd client && npm start

# 데이터베이스 초기 설정
node dist/scripts/setupInitialData.js
node dist/scripts/updateProductionMenus.js
```

### **Railway 배포 (운영)**
- 자동 배포: 사용자 지시 시에만
- DATABASE_URL 환경변수로 운영 DB 연결
- SSL 연결 설정 자동 적용

## 📊 **메모리 및 성능 최적화**

### **데이터베이스 연결 설정**
```typescript
// server/src/config/database.ts
const sequelize = new Sequelize(databaseUrl, {
  pool: { max: 2, acquire: 60000, idle: 30000, evict: 5000 },
  retry: { max: 3, backoffBase: 1000, backoffExponent: 1.5 },
  dialectOptions: {
    ssl: useLocalDB ? false : { require: true, rejectUnauthorized: false },
    connectTimeout: useLocalDB ? 5000 : 20000
  }
});
```

### **메모리 모니터링**
```typescript
// server/src/index.ts
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.rss / 1024 / 1024);
  if (memMB > 400) { // 400MB 이상 시 경고
    logger.warn(`높은 메모리 사용량: ${memMB}MB`);
  }
}, 300000); // 5분마다 체크
```

## 🔐 **보안 및 검증**

### **JWT 인증**
```typescript
// 토큰 검증 미들웨어
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};
```

### **로그인 기간 체크**
```typescript
// root가 아닌 사용자는 회사의 로그인 기간 검증
if (user.role !== 'root') {
  const companyResult = await sequelize.query(`
    SELECT login_period_start, login_period_end 
    FROM company WHERE company_id = ? AND is_deleted = false
  `);
  // 인도 시간 기준 날짜 검증
}
```

## 📝 **주요 해결된 이슈들**

1. **SQLite → PostgreSQL 완전 전환**
2. **Invalid date 오류 해결** (날짜 검증 로직 추가)
3. **메뉴 권한 시스템 통합** (역할+메뉴 기반)
4. **사용자 ID 재사용 문제** (soft delete 개선)
5. **포트 충돌 해결** (EADDRINUSE 3001)
6. **메모리 사용량 최적화** (임계값 200MB→400MB)
7. **데이터베이스 연결 안정성** (pool 설정, retry 로직)

## 🎯 **최종 시스템 상태**

### **관리자 계정**
- **ID**: admin
- **Password**: admin  
- **역할**: root
- **회사**: Minsub Ventures Private Limited

### **기본 설정 완료**
✅ 15개 테이블 생성 완료
✅ 11개 메뉴 구조 설정 완료
✅ 권한 시스템 구축 완료
✅ 전자결재 시스템 완료
✅ 회사/파트너 관리 완료
✅ 다국어 지원 (한국어/영어)
✅ 날짜 검증 로직 완료
✅ 폰트 통일 적용 완료

## 🚨 **중요 참고사항**

1. **Railway 배포는 명시적 지시 시에만 실행**
2. **로컬 개발은 mvs 데이터베이스 사용**
3. **Auditor 역할은 Minsub Ventures Private Limited만 가능**
4. **메뉴 수정/삭제는 root만 가능**
5. **상위 메뉴는 신규 사용자에게 자동 읽기 권한 부여**
6. **회사 생성 시 날짜 필드는 유효성 검증 필수**

---
**개발 완료 상태**: 모든 핵심 기능 구현 완료, 로컬 환경 안정화 완료
**다음 단계**: 사용자 요청 시 추가 기능 개발 또는 Railway 배포
