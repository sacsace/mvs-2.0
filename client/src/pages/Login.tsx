import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Visibility, VisibilityOff, Warning as WarningIcon } from '@mui/icons-material';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userid: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState('');
  const [expiredDialogTitle, setExpiredDialogTitle] = useState('로그인 기간 만료');
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [expiryWarningMessage, setExpiryWarningMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // 입력 시 에러 메시지 초기화
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', formData);
      console.log('서버 응답:', response.data);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 만료 예정 경고가 있는지 확인
        if (response.data.expiryWarning) {
          console.log('만료 예정 경고:', response.data.expiryWarning);
          setExpiryWarningMessage(response.data.expiryWarning.message);
          setShowExpiryWarning(true);
        } else {
          // 만료 예정 경고가 없으면 바로 대시보드로 이동
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', error.response.data);
        
        // 403 에러인 경우 로그인 기간 관련 에러로 처리
        if (error.response.status === 403) {
          console.log('403 에러 감지 - 로그인 기간 관련 에러로 처리');
          
          const errorData = error.response.data;
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
        } else if (error.response.status === 401) {
          // 401 에러 (잘못된 아이디/비밀번호)
          setError('Login failed. Please check your username and password.');
        } else {
          // 다른 에러의 경우 서버 메시지 사용
          if (error.response.data && error.response.data.message) {
            setError(error.response.data.message);
          } else {
            setError('Login failed. Please check your username and password.');
          }
        }
      } else {
        setError('Login failed. Please check your username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: 'translateY(-20%)'
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Logo />
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: 360,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#1976d2',
              mb: 3,
              letterSpacing: '0.5px',
              fontSize: '1.35rem'
            }}
          >
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="User ID"
              name="userid"
              value={formData.userid}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              size="small"
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: '1px'
                  }
                }
              }}
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              size="small"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: '1px'
                  }
                }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.2,
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.25)',
                  backgroundColor: '#1565c0'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </Paper>
      </Box>
      <Footer />
      
      {/* 로그인 기간 만료 팝업 */}
      <Dialog
        open={showExpiredDialog}
        onClose={() => {
          setShowExpiredDialog(false);
          setFormData({ userid: "", password: "" });
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
              setFormData({ userid: "", password: "" });
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

      {/* 만료 예정 안내 팝업 */}
      <Dialog
        open={showExpiryWarning}
        onClose={() => setShowExpiryWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#ed6c02',
          fontWeight: 600
        }}>
          <WarningIcon sx={{ color: '#ed6c02' }} />
          로그인 기간 만료 예정
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ 
            whiteSpace: 'pre-line',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#333'
          }}>
            {expiryWarningMessage}
            {'\n\n관리자에게 문의하여 로그인 기간을 연장해 주세요.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setShowExpiryWarning(false);
              navigate('/dashboard');
            }}
            variant="contained"
            sx={{
              backgroundColor: '#ed6c02',
              '&:hover': {
                backgroundColor: '#e65100'
              }
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login; 