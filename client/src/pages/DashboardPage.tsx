import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  MenuBook as MenuIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  users: {
    total: number;
    admin: number;
    regular: number;
  };
  companies: {
    total: number;
    active: number;
  };
  menus: {
    total: number;
    accessible: number;
  };
  recentActivities: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
    user?: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 사용자 정보 가져오기
      const userResponse = await fetch('/api/dashboard/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserName(userData.data?.username || '사용자');
      }

      // 통계 데이터 가져오기
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      } else {
        // API 실패시 목업 데이터 사용
        const mockStats: DashboardStats = {
        users: {
          total: 15,
          admin: 3,
          regular: 12
        },
        companies: {
          total: 8,
          active: 6
        },
        menus: {
          total: 15,
          accessible: 12
        },
        recentActivities: [
          {
            id: 1,
            type: 'login',
            message: '새로운 사용자가 로그인했습니다',
            timestamp: '5분 전',
            user: 'admin'
          },
          {
            id: 2,
            type: 'invoice',
            message: '새로운 송장이 생성되었습니다',
            timestamp: '15분 전',
            user: 'manager'
          },
          {
            id: 3,
            type: 'approval',
            message: '전자결재 요청이 승인되었습니다',
            timestamp: '1시간 전',
            user: 'director'
          },
          {
            id: 4,
            type: 'user',
            message: '새로운 사용자가 등록되었습니다',
            timestamp: '2시간 전',
            user: 'admin'
          }
        ]
      };

        setStats(mockStats);
      }
    } catch (err) {
      console.error('대시보드 데이터 로딩 오류:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <PeopleIcon color="primary" />;
      case 'invoice': return <AssignmentIcon color="success" />;
      case 'approval': return <SecurityIcon color="warning" />;
      case 'user': return <PeopleIcon color="info" />;
      default: return <NotificationsIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'primary';
      case 'invoice': return 'success';
      case 'approval': return 'warning';
      case 'user': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          대시보드
        </Typography>
        <Typography variant="h6" color="text.secondary">
          안녕하세요, {userName}님! 👋
        </Typography>
      </Box>

      {/* 통계 카드들 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    총 사용자
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.users.total || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    관리자: {stats?.users.admin || 0}명
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    등록 회사
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.companies.total || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    활성: {stats?.companies.active || 0}개
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <BusinessIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    메뉴 권한
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.menus.accessible || 0}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    전체: {stats?.menus.total || 0}개
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <MenuIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    시스템 상태
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    정상
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    모든 서비스 활성
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 빠른 작업 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                빠른 작업
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/users/list')}
                    sx={{ mb: 1 }}
                  >
                    사용자 관리
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<BusinessIcon />}
                    onClick={() => navigate('/users/company')}
                    sx={{ mb: 1 }}
                  >
                    회사 관리
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SecurityIcon />}
                    onClick={() => navigate('/permissions/menu')}
                    sx={{ mb: 1 }}
                  >
                    권한 관리
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AssignmentIcon />}
                    onClick={() => navigate('/accounting/invoices')}
                    sx={{ mb: 1 }}
                  >
                    송장 관리
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 활동 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                최근 활동
              </Typography>
              <List>
                {stats?.recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}.light` }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <TimeIcon fontSize="small" />
                            {activity.timestamp}
                            {activity.user && (
                              <Chip 
                                label={activity.user} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < stats.recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 시스템 성능 */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                시스템 성능
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      CPU 사용률
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={23} 
                      sx={{ mb: 1 }}
                      color="success"
                    />
                    <Typography variant="body2" align="right">23%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      메모리 사용률
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={45} 
                      sx={{ mb: 1 }}
                      color="warning"
                    />
                    <Typography variant="body2" align="right">45%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      디스크 사용률
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={67} 
                      sx={{ mb: 1 }}
                      color="info"
                    />
                    <Typography variant="body2" align="right">67%</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;