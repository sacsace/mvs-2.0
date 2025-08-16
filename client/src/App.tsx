import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Box, Typography, Paper, Alert, Button } from "@mui/material";
import axios from "axios";
import { setupAxiosInterceptors, AuthUtils } from "./utils/auth";
import ProtectedRoute from "./components/ProtectedRoute";

// API 기본 설정
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

// Axios 인터셉터 설정
setupAxiosInterceptors();

function App() {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // 애플리케이션 시작 시 기존 토큰이 있으면 axios 헤더에 설정
        AuthUtils.setupAxiosToken();
        
        const response = await axios.get("/api/init/status");
        setIsInitialized(response.data.initialized);
      } catch (error) {
        console.error("Error checking system status:", error);
        // 오류 발생 시 초기화되지 않은 것으로 간주
        setIsInitialized(false);
      } finally {
        setLoading(false);
      }
    };

    checkSystemStatus();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // 시스템 초기화 안내 컴포넌트
  const SystemNotInitialized = () => (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary">
          🚀 시스템 초기화 필요
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="h6" gutterBottom>
            시스템이 초기화되지 않았습니다.
          </Typography>
          <Typography variant="body2" paragraph>
            관리자는 다음 명령을 실행하여 시스템을 초기화해주세요:
          </Typography>
          <Typography variant="body2" component="div" sx={{ 
            bgcolor: '#f0f0f0', 
            p: 2, 
            borderRadius: 1, 
            fontFamily: 'monospace',
            textAlign: 'left'
          }}>
            cd server<br/>
            npx ts-node src/scripts/initializeSystemData.ts
          </Typography>
        </Alert>

        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2" gutterBottom>
            <strong>초기 로그인 정보:</strong>
          </Typography>
          <Typography variant="body2">
            ID: <strong>root</strong><br/>
            Password: <strong>admin</strong>
          </Typography>
        </Alert>

        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          초기화 후 새로고침
        </Button>
      </Paper>
    </Box>
  );

  return (
    <LanguageProvider>
      <Routes>
        {!isInitialized ? (
          // 시스템이 초기화되지 않은 경우
          <Route path="*" element={<SystemNotInitialized />} />
        ) : (
          // 시스템이 초기화된 경우
          <>
            {/* 로그인 페이지 - 인증 불필요 */}
            <Route path="/login" element={<Login />} />
            
            {/* 기본 경로 리다이렉트 - 인증 상태에 따라 대시보드 또는 로그인으로 */}
            <Route 
              path="/" 
              element={
                AuthUtils.isLoggedIn() ? 
                  <Navigate to="/dashboard" replace /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            {/* 보호된 대시보드 및 모든 하위 경로 */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </>
        )}
      </Routes>
    </LanguageProvider>
  );
}

export default App; 