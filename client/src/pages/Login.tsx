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
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
        
        // 로그인 성공 후 사용자 정보 가져오기
        try {
          const userResponse = await axios.get('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${response.data.token}`
            }
          });
          
          if (userResponse.data.success) {
            localStorage.setItem('user', JSON.stringify(userResponse.data.user));
          }
        } catch (userError) {
          console.error('사용자 정보 가져오기 실패:', userError);
        }
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your username and password.');
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
    </Box>
  );
};

export default Login; 