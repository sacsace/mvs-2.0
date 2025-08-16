import React, { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthUtils } from '../utils/auth';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = AuthUtils.isLoggedIn();

  console.log('ProtectedRoute 확인:', {
    currentPath: location.pathname,
    isLoggedIn,
    token: AuthUtils.getToken() ? '존재함' : '없음'
  });

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isLoggedIn) {
    console.log('인증되지 않음 - 로그인 페이지로 리다이렉트');
    
    // 현재 경로를 저장하여 로그인 후 다시 돌아올 수 있도록 함
    return <Navigate 
      to="/login" 
      state={{ from: location.pathname }} 
      replace 
    />;
  }

  // 인증된 사용자에게 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute;
