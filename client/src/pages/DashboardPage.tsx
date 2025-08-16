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

interface MenuItem {
  menu_id: number;
  name: string;
  name_en: string;
  parent_id: number | null;
  order_num: number;
  icon: string;
  url?: string;
  description?: string;
}

interface DashboardProps {
  menus?: MenuItem[];
  onMenuSelect?: (menu: MenuItem) => void;
}

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

interface Approval {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  requester: {
    username: string;
    userid: string;
  };
  approver: {
    username: string;
    userid: string;
  };
}

const DashboardPage: React.FC<DashboardProps> = ({ menus, onMenuSelect }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [receivedApprovals, setReceivedApprovals] = useState<Approval[]>([]);
  const [requestedApprovals, setRequestedApprovals] = useState<Approval[]>([]);
  const [userLastCheck, setUserLastCheck] = useState<Date | null>(null);

  // 메뉴 URL로 메뉴 객체 찾기
  const findMenuByUrl = (url: string): MenuItem | undefined => {
    return menus?.find(menu => menu.url === url);
  };

  // 메뉴 네비게이션 핸들러
  const handleMenuNavigation = (url: string) => {
    const menu = findMenuByUrl(url);
    if (menu && onMenuSelect) {
      onMenuSelect(menu);
    }
  };

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
      }

      // 받은 결제 목록 가져오기 (최대 5개)
      const receivedResponse = await fetch('/api/approval?type=received&limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        if (receivedData.success) {
          setReceivedApprovals(receivedData.data.slice(0, 5));
          setUserLastCheck(receivedData.userLastCheck ? new Date(receivedData.userLastCheck) : null);
        }
      }

      // 요청한 결제 목록 가져오기 (최대 5개)
      const requestedResponse = await fetch('/api/approval?type=requested&limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (requestedResponse.ok) {
        const requestedData = await requestedResponse.json();
        if (requestedData.success) {
          setRequestedApprovals(requestedData.data.slice(0, 5));
        }
      }

      if (!statsResponse.ok) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기';
      case 'approved': return '승인';
      case 'rejected': return '거부';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '1일 전';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 읽지 않은 결제인지 판단
  const isUnreadApproval = (approvalCreatedAt: string) => {
    if (!userLastCheck) return true; // 한 번도 확인하지 않았으면 읽지 않음
    const createdDate = new Date(approvalCreatedAt);
    return createdDate > userLastCheck;
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
        {/* 받은 결제 리스트 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" gutterBottom>
                  내가 받은 결제 요청
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => handleMenuNavigation('/approval?type=received')}
                  sx={{ fontSize: '0.8rem' }}
                >
                  전체보기
                </Button>
              </Box>
              {receivedApprovals.length > 0 ? (
                <List dense sx={{ pt: 0 }}>
                  {receivedApprovals.map((approval) => (
                    <ListItem 
                      key={approval.id} 
                      sx={{ 
                        px: 0, 
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderRadius: 1
                      }}
                      onClick={() => handleMenuNavigation('/approval?type=received')}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <AssignmentIcon sx={{ fontSize: '1rem' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {isUnreadApproval(approval.created_at) && (
                                <Box 
                                  sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    bgcolor: 'error.main',
                                    flexShrink: 0
                                  }} 
                                />
                              )}
                              <Typography 
                                variant="body2" 
                                noWrap 
                                sx={{ 
                                  flex: 1,
                                  fontWeight: isUnreadApproval(approval.created_at) ? 'bold' : 'normal'
                                }}
                              >
                                {approval.title}
                              </Typography>
                            </Box>
                            <Chip 
                              label={getStatusText(approval.status)}
                              color={getStatusColor(approval.status) as any}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontWeight: isUnreadApproval(approval.created_at) ? 'bold' : 'normal' }}
                          >
                            요청자: {approval.requester.username} • {formatDate(approval.created_at)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    받은 결제 요청이 없습니다
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 요청한 결제 리스트 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" gutterBottom>
                  내가 요청한 결제
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => handleMenuNavigation('/approval?type=requested')}
                  sx={{ fontSize: '0.8rem' }}
                >
                  전체보기
                </Button>
              </Box>
              {requestedApprovals.length > 0 ? (
                <List dense sx={{ pt: 0 }}>
                  {requestedApprovals.map((approval) => (
                    <ListItem 
                      key={approval.id} 
                      sx={{ 
                        px: 0, 
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderRadius: 1
                      }}
                      onClick={() => handleMenuNavigation('/approval?type=requested')}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          <AssignmentIcon sx={{ fontSize: '1rem' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {approval.title}
                            </Typography>
                            <Chip 
                              label={getStatusText(approval.status)}
                              color={getStatusColor(approval.status) as any}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            승인자: {approval.approver.username} • {formatDate(approval.created_at)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    요청한 결제가 없습니다
                  </Typography>
                </Box>
              )}
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
                          <Box display="flex" alignItems="center" gap={1} component="div">
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
                        secondaryTypographyProps={{ component: 'div' }}
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