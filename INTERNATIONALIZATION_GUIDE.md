# 국제화 (i18n) 가이드

## 개요
이 프로젝트는 한국어와 영어를 지원하는 다국어 시스템을 사용합니다. 새로운 페이지를 만들거나 기존 페이지를 수정할 때는 반드시 국제화를 적용해야 합니다.

## 기본 구조

### 1. 언어 컨텍스트 사용
모든 페이지 컴포넌트에서 `useLanguage` 훅을 import하고 사용합니다:

```typescript
import { useLanguage } from '../contexts/LanguageContext';

const MyPage: React.FC = () => {
  const { t } = useLanguage();
  
  // t() 함수를 사용하여 번역된 텍스트를 가져옵니다
  return (
    <Typography>{t('pageTitle')}</Typography>
  );
};
```

### 2. 번역 키 추가
새로운 텍스트를 추가할 때는 `client/src/contexts/LanguageContext.tsx`에 번역 키를 추가해야 합니다:

```typescript
const translations = {
  ko: {
    // 기존 번역들...
    
    // 새로운 페이지 번역
    myPageTitle: '내 페이지 제목',
    myPageDescription: '페이지 설명',
    myButtonText: '버튼 텍스트',
  },
  en: {
    // 기존 번역들...
    
    // 새로운 페이지 번역
    myPageTitle: 'My Page Title',
    myPageDescription: 'Page Description',
    myButtonText: 'Button Text',
  }
};
```

## 페이지 템플릿

### 기본 페이지 구조
```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  // 필요한 Material-UI 컴포넌트들...
} from '@mui/material';
import {
  // 필요한 아이콘들...
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

// 인터페이스 정의
interface MyData {
  id: number;
  name: string;
  // 기타 필드들...
}

const MyPage: React.FC = () => {
  // 다국어 지원 훅 사용 (필수)
  const { t } = useLanguage();
  
  // 상태 관리
  const [data, setData] = useState<MyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      // API 호출
      const response = await fetch('/api/my-data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (error) {
      setError(t('dataLoadError')); // 번역된 에러 메시지 사용
    } finally {
      setLoading(false);
    }
  };
  
  // 로딩 상태
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          {t('myPageTitle')} {/* 번역된 제목 사용 */}
        </Typography>
        <Button variant="contained" onClick={handleAdd}>
          {t('add')} {/* 번역된 버튼 텍스트 사용 */}
        </Button>
      </Box>
      
      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* 페이지 내용 */}
      {/* 모든 텍스트는 t() 함수를 사용하여 번역 */}
    </Box>
  );
};

export default MyPage;
```

## 번역 키 네이밍 규칙

### 1. 페이지별 접두사 사용
- `myPageTitle` - 페이지 제목
- `myPageDescription` - 페이지 설명
- `myPageAddButton` - 페이지별 버튼

### 2. 공통 키 재사용
- `add`, `edit`, `delete`, `save`, `cancel` - 공통 액션
- `loading`, `error`, `success` - 공통 상태
- `id`, `name`, `description` - 공통 필드

### 3. 동적 키 사용
```typescript
// 상태에 따른 동적 번역
{t(item.status)} // 'active', 'inactive' 등의 키

// 역할에 따른 동적 번역
{t(user.role)} // 'admin', 'user', 'root' 등의 키
```

## 필수 번역 키

### 기본 페이지
```typescript
// 페이지 제목과 설명
pageTitle: '페이지 제목',
pageDescription: '페이지 설명',

// 로딩과 에러
loading: '로딩 중...',
error: '오류가 발생했습니다.',
dataLoadError: '데이터를 불러오는데 실패했습니다.',

// CRUD 작업
add: '추가',
edit: '수정',
delete: '삭제',
save: '저장',
cancel: '취소',
confirm: '확인',

// 테이블 관련
id: 'ID',
name: '이름',
description: '설명',
actions: '작업',
noData: '데이터가 없습니다',

// 상태
active: '활성',
inactive: '비활성',
enabled: '사용',
disabled: '사용안함',
```

## 예시 페이지 참고

`client/src/pages/ExamplePage.tsx`를 참고하여 새로운 페이지를 만드세요. 이 파일은 국제화가 완전히 적용된 템플릿입니다.

## 주의사항

1. **하드코딩된 텍스트 금지**: 모든 사용자에게 보이는 텍스트는 번역 키를 사용해야 합니다.
2. **일관성 유지**: 동일한 의미의 텍스트는 같은 번역 키를 재사용하세요.
3. **키 이름 명확성**: 번역 키는 의미가 명확해야 합니다.
4. **한국어 우선**: 한국어 번역을 먼저 작성하고 영어 번역을 추가하세요.

## 테스트

새로운 페이지를 만든 후:
1. 언어 선택기를 사용하여 한국어/영어 전환 테스트
2. 모든 텍스트가 올바르게 번역되는지 확인
3. 동적 텍스트(상태, 역할 등)가 올바르게 표시되는지 확인 