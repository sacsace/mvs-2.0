import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import { Lock as LockIcon, Person as PersonIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useLanguage } from "../contexts/LanguageContext";
import { AuthUtils } from "../utils/auth";

const login = async (userid: string, password: string) => {
  try {
    const response = await axios.post('/api/auth/login', {
      userid,
      password
    });
    return response.data;
  } catch (error) {
    console.log('=== 클라이언트 에러 처리 디버깅 ===');
    console.log('Error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.log('Error response status:', error.response.status);
      console.log('Error response data:', error.response.data);
      
      // 403 에러인 경우 로그인 기간 관련 에러로 처리
      if (error.response.status === 403) {
        console.log('403 에러 감지 - 로그인 기간 관련 에러로 처리');
        
        const errorData = error.response.data;
        if (errorData.message && errorData.message.includes('만료')) {
          // 로그인 기간 만료
          const endDate = errorData.login_period_end || '알 수 없음';
          throw new Error(`LOGIN_PERIOD_EXPIRED:${endDate}:${errorData.current_date || '오늘'}`);
        } else if (errorData.message && errorData.message.includes('시작되지')) {
          // 로그인 기간 미시작
          const startDate = errorData.login_period_start || '알 수 없음';
          throw new Error(`LOGIN_PERIOD_NOT_STARTED:${startDate}:${errorData.current_date || '오늘'}`);
        } else {
          throw new Error(errorData.message || '접근 권한이 없습니다.');
        }
      }
      
      // 다른 에러의 경우 서버 메시지 사용
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    // 기본 에러 메시지
    throw new Error('🔴 테스트 메시지 3: login 함수에서 기본 에러가 발생했습니다');
  }
};

export default function LoginPage() {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ userid: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState("");
  const [expiredDialogTitle, setExpiredDialogTitle] = useState("로그인 기간 만료");

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (AuthUtils.isLoggedIn()) {
      console.log('이미 로그인된 사용자 - 대시보드로 리다이렉트');
      const redirectTo = (location.state as any)?.from || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // 입력 시 에러 메시지 초기화
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    console.log('=== 로그인 시도 시작 ===');
    console.log('사용자 입력:', { userid: form.userid, password: '***' });

    try {
      const result = await login(form.userid, form.password);
      if (result.success) {
        // 로그인 성공 시 사용자 정보를 저장하고 대시보드로 이동
        console.log('로그인 성공 - 받은 사용자 정보:', result.user);
        
        // AuthUtils를 사용하여 토큰과 사용자 정보 저장
        AuthUtils.setToken(result.token);
        AuthUtils.setUser(result.user);
        
        // 사용자의 기본 언어 설정
        if (result.user.default_language) {
          setLanguage(result.user.default_language as 'ko' | 'en');
        }
        
        // 원래 접근하려던 페이지가 있으면 그 페이지로, 없으면 대시보드로 이동
        const redirectTo = (location.state as any)?.from || '/dashboard';
        console.log('로그인 후 이동할 페이지:', redirectTo);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      console.log('=== handleSubmit 에러 처리 ===');
      console.log('Error:', err);
      console.log('Error type:', typeof err);
      console.log('Error instanceof Error:', err instanceof Error);
      
      if (axios.isAxiosError(err) && err.response) {
        console.log('Error response status:', err.response.status);
        console.log('Error response data:', err.response.data);
        
        // 403 에러인 경우 로그인 기간 관련 에러로 처리
        if (err.response.status === 403) {
          console.log('403 에러 감지 - 로그인 기간 관련 에러로 처리');
          
          const errorData = err.response.data;
          let message = '';
          
          if (errorData.message && errorData.message.includes('만료')) {
            // 로그인 기간 만료
            const endDate = errorData.login_period_end || '알 수 없음';
            const currentDate = errorData.current_date || '오늘';
            message = `로그인 기간이 만료되었습니다.\n\n로그인 종료일: ${endDate}\n현재 날짜: ${currentDate}\n\n관리자에게 문의하여 로그인 기간을 연장해 주세요.`;
            setExpiredDialogTitle('로그인 기간 만료');
          } else if (errorData.message && errorData.message.includes('시작되지')) {
            // 로그인 기간 미시작
            const startDate = errorData.login_period_start || '알 수 없음';
            const currentDate = errorData.current_date || '오늘';
            message = `로그인 기간이 아직 시작되지 않았습니다.\n\n로그인 시작일: ${startDate}\n현재 날짜: ${currentDate}`;
            setExpiredDialogTitle('로그인 기간 미시작');
          } else {
            // 기타 403 에러
            message = errorData.message || '접근 권한이 없습니다.';
            setExpiredDialogTitle('접근 제한');
          }
          
          setExpiredMessage(message);
          setShowExpiredDialog(true);
        } else {
          // 다른 에러의 경우 서버 메시지 사용
          if (err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else {
            setError('🔴 테스트 메시지 1: 로그인에 실패했습니다.');
          }
        }
      } else {
        // login 함수에서 던진 에러 처리
        if (err instanceof Error) {
          const errorMessage = err.message;
          
          if (errorMessage.startsWith('LOGIN_PERIOD_EXPIRED:')) {
            const [, endDate, currentDate] = errorMessage.split(':');
            const message = `로그인 기간이 만료되었습니다.\n\n로그인 종료일: ${endDate}\n현재 날짜: ${currentDate}\n\n관리자에게 문의하여 로그인 기간을 연장해 주세요.`;
            setExpiredDialogTitle('로그인 기간 만료');
            setExpiredMessage(message);
            setShowExpiredDialog(true);
          } else if (errorMessage.startsWith('LOGIN_PERIOD_NOT_STARTED:')) {
            const [, startDate, currentDate] = errorMessage.split(':');
            const message = `로그인 기간이 아직 시작되지 않았습니다.\n\n로그인 시작일: ${startDate}\n현재 날짜: ${currentDate}`;
            setExpiredDialogTitle('로그인 기간 미시작');
            setExpiredMessage(message);
            setShowExpiredDialog(true);
          } else {
            setError(errorMessage);
          }
        } else {
          setError('🔴 테스트 메시지 2: 로그인 처리 중 오류가 발생했습니다.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-container">
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 400,
          width: '100%',
          mx: 'auto'
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Logo />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#2c3e50',
              mt: 2,
              mb: 1
            }}
          >
            MSV
          </Typography>
                      <Typography 
              variant="body1" 
              sx={{ 
                color: '#7f8c8d',
                fontWeight: 500
              }}
            >
              Welcome to Management System
            </Typography>
        </Box>

        <Paper className="login-card">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: '#2c3e50',
                mx: 'auto',
                mb: 2
              }}
            >
              <LockIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: '#2c3e50',
                mb: 1
              }}
            >
              🔴 테스트: Login 업데이트됨
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#7f8c8d'
              }}
            >
              Please enter your account information
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 500,
                  whiteSpace: 'pre-line'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              name="userid"
              label="User ID"
              value={form.userid}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ color: '#7f8c8d', mr: 1 }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#34495e',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#7f8c8d',
                },
              }}
            />
            
            <TextField
              fullWidth
              name="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <LockIcon sx={{ color: '#7f8c8d', mr: 1 }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#34495e',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#7f8c8d',
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(44, 62, 80, 0.15)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(44, 62, 80, 0.25)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  backgroundColor: '#bdc3c7',
                  color: '#ffffff',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Login'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#7f8c8d',
                  fontSize: '0.75rem'
                }}
              >
                Default account: root / admin
              </Typography>
            </Box>
          </Box>
        </Paper>

                 <Box sx={{ mt: 4, textAlign: 'center' }}>
           <Footer />
         </Box>
       </Box>

       {/* 로그인 기간 만료 팝업 */}
       <Dialog
         open={showExpiredDialog}
         onClose={() => {
           setShowExpiredDialog(false);
           setForm({ userid: "", password: "" });
           setError("");
         }}
         maxWidth="sm"
         fullWidth
       >
                 <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#d32f2f',
          fontWeight: 600
        }}>
          <WarningIcon sx={{ color: '#d32f2f' }} />
          {expiredDialogTitle}
        </DialogTitle>
         <DialogContent>
           <DialogContentText sx={{ 
             whiteSpace: 'pre-line',
             fontSize: '1rem',
             lineHeight: 1.6
           }}>
             {expiredMessage}
           </DialogContentText>
         </DialogContent>
         <DialogActions sx={{ p: 2 }}>
                             <Button 
            onClick={() => {
              setShowExpiredDialog(false);
              // 폼 초기화
              setForm({ userid: "", password: "" });
              setError("");
            }}
            variant="contained"
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#b71c1c'
              }
            }}
          >
            확인
          </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 } 