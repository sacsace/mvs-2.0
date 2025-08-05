import React, { useState } from 'react';
import { Box, Typography, AppBar, Toolbar, IconButton, CssBaseline, useMediaQuery, Card, CardContent, Grid, Avatar, Tooltip, Button, Snackbar, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme } from '@mui/material/styles';
import Sidebar from '../components/Sidebar';

import { useLanguage } from '../contexts/LanguageContext';
import { Routes, Route, useNavigate } from 'react-router-dom';
import UserPage from './UserPage';
import MenuMngPage from './MenuMngPage';
import PartnerPage from './PartnerPage';
import MenuPermissionMngPage from './MenuPermissionMngPage';
import CompanyPage from './CompanyPage';

const drawerWidth = 240;

// 임시 서브 페이지 컴포넌트
const PaymentPage = () => <Box p={3}><Typography>결제 관리 페이지</Typography></Box>;
const NotFoundPage = ({ onShowPopup }: { onShowPopup: () => void }) => {
  React.useEffect(() => { onShowPopup(); }, [onShowPopup]);
  return <Box p={3}><Typography color="error">페이지 없음</Typography></Box>;
};

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(true);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const { t } = useLanguage();
  const [noPageOpen, setNoPageOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    if (isDesktop) {
      setDesktopOpen(!desktopOpen);
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // 예시 데이터 (실제 데이터 연동 시 교체)
  const summary = [
    { label: '총 고객 수', value: 0 },
    { label: '총 공급업체 수', value: 0 },
    { label: '총 사용자 수', value: 0 },
    { label: '총 세금계산서 수', value: 0 },
  ];
  const actions = [
    { label: '고객관리', icon: '👤' },
    { label: '협력업체 관리', icon: '🏢' },
    { label: '사용자 관리', icon: '👥' },
    { label: '사용자 권한 관리', icon: '⚙️' },
    { label: '전자세금계산서', icon: '📄' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f7f9fa', width: '100vw', overflow: 'auto' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{
        bgcolor: '#1976d2',
        color: '#fff',
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
        <Toolbar sx={{ minHeight: 56 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 700, letterSpacing: 1, fontSize: '1.05rem', mr: 1, cursor: 'pointer', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
              onClick={() => navigate('/dashboard')}
            >
              MVS
            </Typography>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ ml: 0, mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsNoneIcon />
          </IconButton>
          <Typography variant="subtitle2" sx={{ mr: 2, fontWeight: 500, fontSize: '0.95rem', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
            Minsub Lee
          </Typography>
          <Tooltip title={t('logout')}>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: desktopOpen ? drawerWidth : 0 }, flexShrink: 0, transition: 'width 0.3s' }}
        aria-label="navigation menu"
      >
        {desktopOpen && <Sidebar />}
      </Box>
      {/* 메인 컨텐츠 라우팅 */}
      <Box sx={{ flex: 1, mt: 7, px: 3, overflow: 'auto', height: 'calc(100vh - 56px)' }}>
        <Routes>
          <Route index element={
            <>
              {/* 기존 대시보드 통계/액션 화면 */}
              <Grid container spacing={2} sx={{ width: '100%', mb: 2 }}>
                {summary.map((item, idx) => (
                  <Grid item xs={12} sm={6} md={3} key={item.label}>
                    <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.04)', p: 2 }}>
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, fontWeight: 500, fontSize: '0.92rem' }}>
                          {item.label}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1.25rem' }}>
                          {item.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Grid container spacing={2} sx={{ width: '100%' }}>
                {actions.map((action, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={action.label}>
                    <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.04)', p: 2, display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#e3eafc', color: '#1976d2', mr: 2, width: 36, height: 36, fontSize: 20 }}>
                        {action.icon}
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.98rem' }}>
                        {action.label}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          } />
          <Route path="user" element={<UserPage />} />
          <Route path="menu-mng" element={<MenuMngPage />} />
          <Route path="menu-auth" element={<MenuPermissionMngPage />} />
          <Route path="partner" element={<PartnerPage />} />
          <Route path="company" element={<CompanyPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="*" element={<NotFoundPage onShowPopup={() => setNoPageOpen(true)} />} />
        </Routes>
        <Snackbar open={noPageOpen} autoHideDuration={2000} onClose={() => setNoPageOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="warning" sx={{ width: '100%' }} onClose={() => setNoPageOpen(false)}>
            페이지 없음
          </Alert>
        </Snackbar>
      </Box>
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          textAlign: 'center',
          py: 1,
          bgcolor: 'transparent',
          color: 'text.secondary',
          fontSize: '0.8rem',
          zIndex: 1201,
        }}
      >
        powered by Minsub Ventures Private Limited | mvs 2.0
      </Box>
    </Box>
  );
} 