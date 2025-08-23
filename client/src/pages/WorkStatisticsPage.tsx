import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Category as CategoryIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import axios from 'axios';


interface Work {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'project' | 'meeting' | 'report' | 'planning' | 'review';
  start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assigner: {
    id: number;
    username: string;
    userid: string;
  };
  assignee?: {
    id: number;
    username: string;
    userid: string;
  };
}

interface User {
  id: number;
  username: string;
  userid: string;
  role: string;
  company_id: number;
}

const WorkStatisticsPage: React.FC = () => {
  const { t } = useLanguage();
  const [works, setWorks] = useState<Work[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [userDetailDialog, setUserDetailDialog] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // 현재 로그인한 사용자 정보 가져오기
      const currentUserResponse = await axios.get('/api/auth/me', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (currentUserResponse.data.success) {
        setCurrentUser(currentUserResponse.data.data);
      }

      // 업무 데이터와 사용자 데이터 가져오기
      const [worksResponse, usersResponse] = await Promise.all([
        axios.get('/api/works', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (worksResponse.data.success) {
        setWorks(worksResponse.data.data);
      }
      if (usersResponse.data.success) {
        // 현재 사용자의 회사에 속한 직원들만 필터링
        const companyUsers = usersResponse.data.data.filter((user: User) => 
          user.company_id === currentUserResponse.data.data.company_id
        );
        setUsers(companyUsers);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 계산
  const getWorkStats = () => {
    const total = works.length;
    const pending = works.filter(w => w.status === 'pending').length;
    const accepted = works.filter(w => w.status === 'accepted').length;
    const inProgress = works.filter(w => w.status === 'in_progress').length;
    const completed = works.filter(w => w.status === 'completed').length;
    const rejected = works.filter(w => w.status === 'rejected').length;
    
    const urgent = works.filter(w => w.priority === 'urgent').length;
    const high = works.filter(w => w.priority === 'high').length;
    const normal = works.filter(w => w.priority === 'normal').length;
    const low = works.filter(w => w.priority === 'low').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const onTimeRate = total > 0 ? Math.round((works.filter(w => {
      if (!w.due_date || w.status !== 'completed') return false;
      const dueDate = new Date(w.due_date);
      const completedDate = new Date(w.updated_at);
      return completedDate <= dueDate;
    }).length / total) * 100) : 0;

    return {
      total, pending, accepted, inProgress, completed, rejected,
      urgent, high, normal, low,
      completionRate, onTimeRate
    };
  };

  // 카테고리별 통계
  const getCategoryStats = () => {
    const categories = ['general', 'project', 'meeting', 'report', 'planning', 'review'];
    return categories.map(category => ({
      category,
      count: works.filter(w => w.category === category).length,
      percentage: works.length > 0 ? Math.round((works.filter(w => w.category === category).length / works.length) * 100) : 0
    })).filter(stat => stat.count > 0);
  };

  // 사용자별 업무 통계
  const getUserStats = () => {
    return users.map(user => {
      const assignedWorks = works.filter(w => w.assignee?.id === user.id);
      const completedWorks = assignedWorks.filter(w => w.status === 'completed');
      const pendingWorks = assignedWorks.filter(w => w.status === 'pending');
      const inProgressWorks = assignedWorks.filter(w => w.status === 'in_progress');
      
      return {
        user,
        totalAssigned: assignedWorks.length,
        completed: completedWorks.length,
        pending: pendingWorks.length,
        inProgress: inProgressWorks.length,
        completionRate: assignedWorks.length > 0 ? Math.round((completedWorks.length / assignedWorks.length) * 100) : 0
      };
    }).filter(stat => stat.totalAssigned > 0)
      .sort((a, b) => b.totalAssigned - a.totalAssigned);
  };

  // 기간별 필터링된 업무 데이터
  const getFilteredWorks = () => {
    let filtered = works;
    
    if (startDate && endDate) {
      filtered = works.filter(w => {
        const createdDate = new Date(w.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return createdDate >= start && createdDate <= end;
      });
    }
    
    if (selectedUser !== '') {
      filtered = filtered.filter(w => w.assignee?.id === selectedUser);
    }
    
    return filtered;
  };

  // 월별 업무 생성 추이
  const getMonthlyTrend = () => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0);
      
      const count = getFilteredWorks().filter(w => {
        const createdDate = new Date(w.created_at);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;
      
      return { month, count };
    });
  };

  // 사용자별 업무 진행 현황 차트 데이터
  const getUserProgressChartData = () => {
    return users.map(user => {
      const assignedWorks = getFilteredWorks().filter(w => w.assignee?.id === user.id);
      const completed = assignedWorks.filter(w => w.status === 'completed').length;
      const inProgress = assignedWorks.filter(w => w.status === 'in_progress').length;
      const pending = assignedWorks.filter(w => w.status === 'pending').length;
      
      return {
        name: user.id === currentUser?.id ? `${user.username} (나)` : user.username,
        완료: completed,
        진행중: inProgress,
        대기: pending,
        total: assignedWorks.length,
        isCurrentUser: user.id === currentUser?.id
      };
    }).filter(data => data.total > 0);
  };

  // 사용자별 상세 통계
  const getUserDetailStats = (userId: number) => {
    const userWorks = getFilteredWorks().filter(w => w.assignee?.id === userId);
    const total = userWorks.length;
    const completed = userWorks.filter(w => w.status === 'completed').length;
    const inProgress = userWorks.filter(w => w.status === 'in_progress').length;
    const pending = userWorks.filter(w => w.status === 'pending').length;
    const accepted = userWorks.filter(w => w.status === 'accepted').length;
    const rejected = userWorks.filter(w => w.status === 'rejected').length;
    
    const urgent = userWorks.filter(w => w.priority === 'urgent').length;
    const high = userWorks.filter(w => w.priority === 'high').length;
    const normal = userWorks.filter(w => w.priority === 'normal').length;
    const low = userWorks.filter(w => w.priority === 'low').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total, completed, inProgress, pending, accepted, rejected,
      urgent, high, normal, low, completionRate
    };
  };



  const filteredWorks = getFilteredWorks();
  const stats = getWorkStats();
  const categoryStats = getCategoryStats();
  const userStats = getUserStats();
  const monthlyTrend = getMonthlyTrend();
  const userProgressChartData = getUserProgressChartData();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* 헤더 섹션 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" component="h1" sx={{ 
          fontWeight: 700, 
          color: '#1a237e',
          fontSize: '0.85rem',
          letterSpacing: 0.5,
          mb: 1
        }}>
          📊 {t('workStatisticsDashboard')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
          {t('workStatisticsDescription')}
        </Typography>
      </Box>

             {/* 기간별 검색 필터 */}
       <Card sx={{ mb: 3, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
         <CardContent sx={{ p: 2.5 }}>
           <Typography variant="body1" sx={{ fontWeight: 500, mb: 2, fontSize: '0.85rem', color: '#374151' }}>
             📅 기간별 검색 및 필터
           </Typography>
           <Grid container spacing={2} alignItems="center">
             <Grid item xs={12} sm={3}>
               <TextField
                 label="시작일"
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 fullWidth
                 size="small"
                 InputLabelProps={{ shrink: true }}
               />
             </Grid>
             <Grid item xs={12} sm={3}>
               <TextField
                 label="종료일"
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 fullWidth
                 size="small"
                 InputLabelProps={{ shrink: true }}
               />
             </Grid>
             <Grid item xs={12} sm={3}>
                                 <FormControl fullWidth size="small">
                    <InputLabel>사용자 선택</InputLabel>
                    <Select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value as number | '')}
                      label="사용자 선택"
                    >
                      <MenuItem value="">전체 사용자</MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.username} {user.id === currentUser?.id ? '(나)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
             </Grid>
             <Grid item xs={12} sm={3}>
               <Button
                 variant="outlined"
                 onClick={() => {
                   setStartDate('');
                   setEndDate('');
                   setSelectedUser('');
                 }}
                 fullWidth
                 size="small"
               >
                 필터 초기화
               </Button>
             </Grid>
           </Grid>
         </CardContent>
       </Card>

       {/* 주요 지표 카드 */}
       <Grid container spacing={3} sx={{ mb: 4 }}>
                           <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: '#f8fafc',
              color: '#374151',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              height: '100%'
            }}>
              <TrendingUpIcon sx={{ fontSize: 24, mb: 1, color: '#1976d2' }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#1976d2', fontSize: '1.5rem' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.7rem' }}>
                {t('totalWorks')}
              </Typography>
            </Card>
          </Grid>
                           <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: '#f8fafc',
              color: '#374151',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              height: '100%'
            }}>
              <CheckCircleIcon sx={{ fontSize: 24, mb: 1, color: '#1976d2' }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#1976d2', fontSize: '1.5rem' }}>
                {stats.completionRate}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.7rem' }}>
                {t('completionRate')}
              </Typography>
            </Card>
          </Grid>
                           <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: '#f8fafc',
              color: '#374151',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              height: '100%'
            }}>
              <ScheduleIcon sx={{ fontSize: 24, mb: 1, color: '#1976d2' }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#1976d2', fontSize: '1.5rem' }}>
                {stats.onTimeRate}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.7rem' }}>
                {t('onTimeRate')}
              </Typography>
            </Card>
          </Grid>
                           <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: '#f8fafc',
              color: '#374151',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              height: '100%'
            }}>
              <WarningIcon sx={{ fontSize: 24, mb: 1, color: '#1976d2' }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#1976d2', fontSize: '1.5rem' }}>
                {stats.urgent}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.7rem' }}>
                {t('urgentWorks')}
              </Typography>
            </Card>
          </Grid>
      </Grid>

      {/* 상세 통계 섹션 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
                 {/* 업무 상태별 분포 */}
                 <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            height: '100%'
          }}>
            <Box sx={{ 
              p: 2.5, 
              background: '#f8fafc',
              color: '#374151',
              borderBottom: '1px solid #e5e7eb'
            }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem' }}>
              1. 업무 상태별 분포
            </Typography>
            </Box>
            <CardContent sx={{ p: 2.4 }}>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#ff9800' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workPending')} 
                    secondary={`${stats.pending}건 (${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.pending} size="small" color="warning" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#2196f3' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workAccepted')} 
                    secondary={`${stats.accepted}건 (${stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.accepted} size="small" color="info" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#3f51b5' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workInProgress')} 
                    secondary={`${stats.inProgress}건 (${stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.inProgress} size="small" color="primary" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#4caf50' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workCompleted')} 
                    secondary={`${stats.completed}건 (${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.completed} size="small" color="success" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#f44336' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workRejected')} 
                    secondary={`${stats.rejected}건 (${stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.rejected} size="small" color="error" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

                 {/* 우선순위별 분포 */}
                 <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            height: '100%'
          }}>
            <Box sx={{ 
              p: 2.5, 
              background: '#f8fafc',
              color: '#374151',
              borderBottom: '1px solid #e5e7eb'
            }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
              2. 우선순위별 분포
            </Typography>
            </Box>
            <CardContent sx={{ p: 2.4 }}>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#f44336' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workUrgent')} 
                    secondary={`${stats.urgent}건 (${stats.total > 0 ? Math.round((stats.urgent / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.urgent} size="small" color="error" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#ff9800' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workHigh')} 
                    secondary={`${stats.high}건 (${stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.high} size="small" color="warning" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#2196f3' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workNormal')} 
                    secondary={`${stats.normal}건 (${stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.normal} size="small" color="info" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: '#9e9e9e' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('workLow')} 
                    secondary={`${stats.low}건 (${stats.total > 0 ? Math.round((stats.low / stats.total) * 100) : 0}%)`}
                  />
                  <Chip label={stats.low} size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

                           {/* 사용자별 업무 진행 현황 차트 */}
        <Card sx={{ mb: 3, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <Box sx={{ 
            p: 2.5, 
            background: '#f8fafc',
            color: '#374151',
            borderBottom: '1px solid #e5e7eb'
          }}>
                                                <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
              4. 사용자별 업무 진행 현황
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userProgressChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="완료" fill="#4caf50" />
                <Bar dataKey="진행중" fill="#2196f3" />
                <Bar dataKey="대기" fill="#ff9800" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

       {/* 카테고리별 통계와 사용자별 통계 */}
       <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 카테고리별 통계 */}
                <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <Box sx={{ 
              p: 2.5, 
              background: '#f8fafc',
              color: '#374151',
              borderBottom: '1px solid #e5e7eb'
            }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
              3. 카테고리별 통계
            </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <TableContainer>
                <Table size="small">
                                     <TableHead>
                     <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                       <TableCell sx={{ 
                         fontWeight: 700, 
                         color: '#222',
                         fontSize: '0.85rem',
                         border: 0,
                         background: 'inherit'
                       }}>카테고리</TableCell>
                       <TableCell sx={{ 
                         fontWeight: 700, 
                         color: '#222',
                         fontSize: '0.85rem',
                         border: 0,
                         background: 'inherit'
                       }} align="center">건수</TableCell>
                       <TableCell sx={{ 
                         fontWeight: 700, 
                         color: '#222',
                         fontSize: '0.85rem',
                         border: 0,
                         background: 'inherit'
                       }} align="center">비율</TableCell>
                     </TableRow>
                   </TableHead>
                  <TableBody>
                    {categoryStats.map((stat) => (
                      <TableRow key={stat.category} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon sx={{ fontSize: 20, color: '#1a237e' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                              {stat.category === 'general' ? '일반' :
                               stat.category === 'project' ? '프로젝트' :
                               stat.category === 'meeting' ? '회의' :
                               stat.category === 'report' ? '보고서' :
                               stat.category === 'planning' ? '기획' : '검토'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.8rem', border: 0 }}>
                          <Chip label={stat.count} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.8rem', border: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a237e', fontSize: '0.8rem' }}>
                            {stat.percentage}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

                 {/* 사용자별 업무 통계 */}
                 <Grid item xs={12} md={6}>
           <Card sx={{ 
             borderRadius: '8px',
             boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
             border: '1px solid #e5e7eb'
           }}>
             <Box sx={{ 
               p: 2.5, 
               background: '#f8fafc',
               color: '#374151',
               borderBottom: '1px solid #e5e7eb'
             }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
              5. 사용자별 업무 현황
            </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <TableContainer>
                <Table size="small">
                                     <TableHead>
                     <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                               <TableCell sx={{ 
                          fontWeight: 700, 
                          color: '#222',
                          fontSize: '0.8rem',
                          border: 0,
                          background: 'inherit'
                        }}>사용자</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          color: '#222',
                          fontSize: '0.8rem',
                          border: 0,
                          background: 'inherit'
                        }} align="center">총 업무</TableCell>
                                                 <TableCell sx={{ 
                           fontWeight: 700, 
                           color: '#222',
                           fontSize: '0.8rem',
                           border: 0,
                           background: 'inherit'
                         }} align="center">완료율</TableCell>
                         <TableCell sx={{ 
                           fontWeight: 700, 
                           color: '#222',
                           fontSize: '0.8rem',
                           border: 0,
                           background: 'inherit'
                         }} align="center">상세보기</TableCell>
                      </TableRow>
                    </TableHead>
                  <TableBody>
                    {userStats.slice(0, 5).map((stat) => (
                      <TableRow key={stat.user.id} hover>
                        <TableCell>
                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Box sx={{ 
                               width: 32, 
                               height: 32, 
                               borderRadius: '50%', 
                               backgroundColor: stat.user.id === currentUser?.id ? '#1976d2' : '#e3f2fd',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               fontSize: '0.75rem',
                               fontWeight: 600,
                               color: stat.user.id === currentUser?.id ? '#ffffff' : '#1a237e'
                             }}>
                               {stat.user.username.charAt(0)}
                             </Box>
                             <Typography variant="body2" sx={{ 
                               fontWeight: 500, 
                               fontSize: '0.75rem',
                               color: stat.user.id === currentUser?.id ? '#1976d2' : 'inherit'
                             }}>
                               {stat.user.username} {stat.user.id === currentUser?.id ? '(나)' : ''}
                             </Typography>
                           </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.8rem', border: 0 }}>
                          <Chip label={stat.totalAssigned} size="small" color="primary" />
                        </TableCell>
                                                 <TableCell align="center" sx={{ fontSize: '0.8rem', border: 0 }}>
                           <Chip 
                             label={`${stat.completionRate}%`} 
                             size="small" 
                             color={stat.completionRate >= 80 ? 'success' : stat.completionRate >= 60 ? 'warning' : 'error'}
                           />
                         </TableCell>
                         <TableCell align="center" sx={{ fontSize: '0.8rem', border: 0 }}>
                           <Button
                             size="small"
                             variant="outlined"
                             onClick={() => {
                               setSelectedUserData(stat.user);
                               setUserDetailDialog(true);
                             }}
                             startIcon={<PersonIcon />}
                           >
                             상세보기
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </TableContainer>
             </CardContent>
           </Card>
         </Grid>
       </Grid>

            {/* 월별 업무 생성 추이 */}
      <Card sx={{ 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <Box sx={{ 
          p: 2.5, 
          background: '#f8fafc',
          color: '#374151',
          borderBottom: '1px solid #e5e7eb'
        }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
              5. 사용자별 업무 현황
            </Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {monthlyTrend.map((item, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                                 <Box sx={{ 
                   textAlign: 'center',
                   p: 2,
                   backgroundColor: item.count > 0 ? '#e3f2fd' : '#f5f5f5',
                   borderRadius: 2,
                   border: item.count > 0 ? '2px solid #2196f3' : '2px solid #e0e0e0',
                   transition: 'all 0.2s ease',
                   '&:hover': {
                     transform: item.count > 0 ? 'scale(1.05)' : 'scale(1.02)',
                     boxShadow: item.count > 0 ? '0 4px 12px rgba(33, 150, 243, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                   }
                 }}>
                   <Typography variant="h6" sx={{ 
                     fontWeight: 700, 
                     color: item.count > 0 ? '#1a237e' : '#9e9e9e',
                     mb: 1,
                     fontSize: '1.25rem'
                   }}>
                     {item.count}
                   </Typography>
                   <Typography variant="body2" sx={{ 
                     color: item.count > 0 ? '#1a237e' : '#9e9e9e',
                     fontWeight: 500,
                     fontSize: '0.875rem'
                   }}>
                     {item.month}
                   </Typography>
                 </Box>
              </Grid>
            ))}
          </Grid>
                 </CardContent>
       </Card>

       {/* 사용자 상세 통계 다이얼로그 */}
       <Dialog
         open={userDetailDialog}
         onClose={() => setUserDetailDialog(false)}
         maxWidth="md"
         fullWidth
       >
         <DialogTitle sx={{ 
           background: '#f8fafc', 
           color: '#374151',
           borderBottom: '1px solid #e5e7eb'
         }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <PersonIcon />
             <Typography variant="h6" sx={{ fontSize: '1rem' }}>
               {selectedUserData?.username} 상세 통계
             </Typography>
           </Box>
         </DialogTitle>
         <DialogContent sx={{ p: 3 }}>
           {selectedUserData && (
             <Box>
               <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                 <Tab label="요약" />
                 <Tab label="상태별 분포" />
                 <Tab label="우선순위별 분포" />
                 <Tab label="월별 추이" />
               </Tabs>

               {activeTab === 0 && (
                 <Grid container spacing={3}>
                   <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ textAlign: 'center', p: 2, background: '#f8fafc' }}>
                       <Typography variant="h4" sx={{ color: '#1976d2', fontSize: '1.5rem' }}>
                         {getUserDetailStats(selectedUserData.id).total}
                       </Typography>
                       <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem' }}>
                         총 업무
                       </Typography>
                     </Card>
                   </Grid>
                   <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ textAlign: 'center', p: 2, background: '#f8fafc' }}>
                       <Typography variant="h4" sx={{ color: '#4caf50', fontSize: '1.5rem' }}>
                         {getUserDetailStats(selectedUserData.id).completionRate}%
                       </Typography>
                       <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem' }}>
                         완료율
                       </Typography>
                     </Card>
                   </Grid>
                   <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ textAlign: 'center', p: 2, background: '#f8fafc' }}>
                       <Typography variant="h4" sx={{ color: '#2196f3', fontSize: '1.5rem' }}>
                         {getUserDetailStats(selectedUserData.id).inProgress}
                       </Typography>
                       <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem' }}>
                         진행중
                       </Typography>
                     </Card>
                   </Grid>
                   <Grid item xs={12} sm={6} md={3}>
                     <Card sx={{ textAlign: 'center', p: 2, background: '#f8fafc' }}>
                       <Typography variant="h4" sx={{ color: '#ff9800', fontSize: '1.5rem' }}>
                         {getUserDetailStats(selectedUserData.id).pending}
                       </Typography>
                       <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem' }}>
                         대기
                       </Typography>
                     </Card>
                   </Grid>
                 </Grid>
               )}

               {activeTab === 1 && (
                 <Box sx={{ height: 300 }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={[
                           { name: '완료', value: getUserDetailStats(selectedUserData.id).completed, color: '#4caf50' },
                           { name: '진행중', value: getUserDetailStats(selectedUserData.id).inProgress, color: '#2196f3' },
                           { name: '대기', value: getUserDetailStats(selectedUserData.id).pending, color: '#ff9800' },
                           { name: '승인', value: getUserDetailStats(selectedUserData.id).accepted, color: '#9c27b0' },
                           { name: '거부', value: getUserDetailStats(selectedUserData.id).rejected, color: '#f44336' }
                         ]}
                         cx="50%"
                         cy="50%"
                         outerRadius={80}
                         dataKey="value"
                       >
                         {[
                           { name: '완료', value: getUserDetailStats(selectedUserData.id).completed, color: '#4caf50' },
                           { name: '진행중', value: getUserDetailStats(selectedUserData.id).inProgress, color: '#2196f3' },
                           { name: '대기', value: getUserDetailStats(selectedUserData.id).pending, color: '#ff9800' },
                           { name: '승인', value: getUserDetailStats(selectedUserData.id).accepted, color: '#9c27b0' },
                           { name: '거부', value: getUserDetailStats(selectedUserData.id).rejected, color: '#f44336' }
                         ].map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip />
                       <Legend />
                     </PieChart>
                   </ResponsiveContainer>
                 </Box>
               )}

               {activeTab === 2 && (
                 <Box sx={{ height: 300 }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[
                       { name: '긴급', value: getUserDetailStats(selectedUserData.id).urgent, color: '#f44336' },
                       { name: '높음', value: getUserDetailStats(selectedUserData.id).high, color: '#ff9800' },
                       { name: '보통', value: getUserDetailStats(selectedUserData.id).normal, color: '#2196f3' },
                       { name: '낮음', value: getUserDetailStats(selectedUserData.id).low, color: '#9e9e9e' }
                     ]}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="name" />
                       <YAxis />
                       <Tooltip />
                       <Bar dataKey="value" fill="#1976d2" />
                     </BarChart>
                   </ResponsiveContainer>
                 </Box>
               )}

               {activeTab === 3 && (
                 <Box sx={{ height: 300 }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={monthlyTrend}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="month" />
                       <YAxis />
                       <Tooltip />
                       <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
                     </LineChart>
                   </ResponsiveContainer>
                 </Box>
               )}
             </Box>
           )}
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setUserDetailDialog(false)}>닫기</Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };
 
 export default WorkStatisticsPage;
