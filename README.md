# MVS 2.0

MVS 2.0은 회사 관리 시스템으로, 사용자 관리, 회사 관리, 승인 시스템, 회계 통계 등의 기능을 제공합니다.

## 🚀 Railways 배포 가이드

### 1. 사전 준비

1. [Railways](https://railway.app/) 계정 생성
2. GitHub 저장소에 코드 푸시

### 2. Railways에서 프로젝트 배포

1. **Railways 대시보드 접속**
   - https://railway.app/dashboard 에 접속

2. **새 프로젝트 생성**
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - GitHub 저장소 연결

3. **환경 변수 설정**
   - 프로젝트 설정 → Variables 탭
   - 다음 환경 변수들을 추가:

```env
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
DEFAULT_COMPANY_NAME=Default Company
DEFAULT_ADMIN_ROLE=ROOT
```

4. **배포 설정 확인**
   - `railway.json` 파일이 올바르게 설정되어 있는지 확인
   - `package.json`의 스크립트가 올바른지 확인

5. **배포 실행**
   - "Deploy" 버튼 클릭
   - 빌드 및 배포 과정 모니터링

### 3. 배포 후 확인

1. **헬스체크**
   - `https://your-app.railway.app/api/init/health` 접속
   - 상태가 "healthy"인지 확인

2. **애플리케이션 접속**
   - Railways에서 제공하는 도메인으로 접속
   - 로그인 및 기능 테스트

### 4. PostgreSQL 데이터베이스 설정

Railways에서 PostgreSQL 서비스를 추가하고 설정해야 합니다:

1. **PostgreSQL 서비스 추가**
   - Railways 프로젝트에서 "New Service" → "Database" → "PostgreSQL" 선택
   - 서비스 이름 설정 (예: "mvs-postgres")

2. **환경 변수 연결**
   - PostgreSQL 서비스의 "Connect" 탭에서 `DATABASE_URL` 복사
   - 메인 애플리케이션 서비스의 Variables에 추가:
     - `DATABASE_URL`: PostgreSQL 연결 문자열

3. **데이터베이스 초기화**
   - 배포 후 자동으로 마이그레이션이 실행됩니다
   - 수동으로 실행하려면: `npm run migrate`

4. **환경 변수 설정 (PostgreSQL 사용 시)**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your_jwt_secret_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   DEFAULT_COMPANY_NAME=Default Company
   DEFAULT_ADMIN_ROLE=ROOT
   ```

## 🛠️ 로컬 개발

### 설치

```bash
# 모든 의존성 설치
npm run install:all

# 개발 서버 실행
npm run dev
```

### 빌드

```bash
# 프로덕션 빌드
npm run build
```

## 📁 프로젝트 구조

```
MVS 2.0/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── contexts/      # React Context
│   │   └── types/         # TypeScript 타입 정의
│   └── public/            # 정적 파일
├── server/                # Node.js 백엔드
│   ├── src/
│   │   ├── config/        # 설정 파일
│   │   ├── controllers/   # 컨트롤러
│   │   ├── models/        # Sequelize 모델
│   │   ├── routes/        # Express 라우터
│   │   └── utils/         # 유틸리티 함수
│   └── migrations/        # 데이터베이스 마이그레이션
└── uploads/               # 업로드된 파일
```

## 🔧 주요 기능

- 👥 사용자 관리
- 🏢 회사 관리
- ✅ 승인 시스템
- 📊 회계 통계
- 🧾 인보이스 관리
- 🔐 권한 관리
- 🌐 다국어 지원

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 