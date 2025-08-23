import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { initializePushNotifications, isPushNotificationSupported } from '../utils/pushNotifications';
import NotificationSettings from '../components/NotificationSettings';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  MenuBook as MenuIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Announcement as AnnouncementIcon,
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
  notices?: any[];
  onNoticeClick?: (notice: any) => void;
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
  requester?: {
    username: string;
    userid: string;
  };
  approver?: {
    username: string;
    userid: string;
  };
}

const DashboardPage: React.FC<DashboardProps> = ({ menus, onMenuSelect, notices: propNotices, onNoticeClick }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [receivedApprovals, setReceivedApprovals] = useState<Approval[]>([]);
  const [requestedApprovals, setRequestedApprovals] = useState<Approval[]>([]);
  const [userLastCheck, setUserLastCheck] = useState<Date | null>(null);
  
  // 결제 요청 상세보기 관련 상태
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [reassignUserId, setReassignUserId] = useState<string>('');
  const [reassignNote, setReassignNote] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  // 통계 데이터 상태
  const [accountingStats, setAccountingStats] = useState<any>(null);
  const [workStats, setWorkStats] = useState<any>(null);
  
  // 공지사항 상태
  const [notices, setNotices] = useState<any[]>([]);

  // 파일 크기 포맷팅 함수
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 우선순위 색상 반환 함수
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  // 메뉴 URL로 메뉴 객체 찾기
  const findMenuByUrl = (url: string): MenuItem | undefined => {
    return menus?.find(menu => menu.url === url);
  };

  // 전자결재 페이지 네비게이션 (메뉴 시스템 사용)
  const navigateToApprovalPage = (type: 'request' | 'received') => {
    console.log('🚀 전자결재 페이지 이동 요청:', type);
    console.log('📋 사용 가능한 메뉴들:', menus);
    
    // 기존 세션 스토리지 정리
    const oldSessionType = sessionStorage.getItem('approvalPageType');
    if (oldSessionType) {
      console.log('🧹 기존 세션 스토리지 정리:', oldSessionType);
      sessionStorage.removeItem('approvalPageType');
    }
    
    // 전자결재 메뉴 찾기
    const approvalMenu = menus?.find(menu => 
      menu.name === '전자결재' || 
      menu.name_en === 'Electronic Approval' ||
      menu.menu_id === 13 ||
      menu.url?.includes('approval')
    );
    
    console.log('🔍 찾은 전자결재 메뉴:', approvalMenu);
    
    if (approvalMenu && onMenuSelect) {
      // 메뉴에 파라미터 추가해서 메뉴 시스템으로 이동
      const menuWithParams = {
        ...approvalMenu,
        url: `${approvalMenu.url || '/approval'}?type=${type}`
      };
      
      console.log('✅ 메뉴 시스템으로 이동:', menuWithParams);
      
      // 페이지 이동 전에 URL 파라미터를 세션 스토리지에 저장
      sessionStorage.setItem('approvalPageType', type);
      console.log('💾 세션 스토리지에 저장:', type);
      console.log('🔗 최종 URL:', menuWithParams.url);
      
      // 실제 브라우저 URL도 업데이트
      try {
        console.log('🌐 브라우저 URL 업데이트:', menuWithParams.url);
        window.history.pushState({}, '', menuWithParams.url);
      } catch (error) {
        console.warn('⚠️ 브라우저 URL 업데이트 실패:', error);
      }
      
      onMenuSelect(menuWithParams);
    } else {
      console.error('❌ 전자결재 메뉴를 찾을 수 없습니다.');
      console.log('사용 가능한 메뉴:', menus?.map(m => ({ id: m.menu_id, name: m.name, url: m.url })));
      
      // 백업: 직접 이동
      window.location.href = `/approval?type=${type}`;
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // 푸시 알림 초기화 (사용자가 이전에 활성화했다면)
    const initPushNotifications = async () => {
      if (isPushNotificationSupported() && localStorage.getItem('pushNotificationsEnabled') === 'true') {
        try {
          await initializePushNotifications();
          console.log('푸시 알림 자동 초기화 완료');
        } catch (error) {
          console.error('푸시 알림 자동 초기화 실패:', error);
        }
      }
    };
    
    initPushNotifications();
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
        setCurrentUser(userData.data); // 현재 사용자 정보 저장
        console.log('대시보드에서 가져온 사용자 정보:', userData.data);
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
      const requestedResponse = await fetch('/api/approval?type=request&limit=5', {
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
      
      // 매입/매출 통계 데이터 가져오기
      await fetchAccountingStats();

      // 업무 통계 데이터 가져오기
      await fetchWorkStats();
      
      // 공지사항 데이터 가져오기
      await fetchNotices();
      
    } catch (err) {
      console.error('대시보드 데이터 로딩 오류:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 매입/매출 통계 데이터 가져오기
  const fetchAccountingStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 인도 회계 년도 기준으로 날짜 설정
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      
      let startDate: string;
      let endDate: string;
      
      if (currentMonth >= 4) {
        startDate = `${currentYear}-04-01`;
        endDate = `${currentYear + 1}-03-31`;
      } else {
        startDate = `${currentYear - 1}-04-01`;
        endDate = `${currentYear}-03-31`;
      }

      const response = await fetch(`/api/accounting/statistics?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAccountingStats(data.data);
        }
      }
    } catch (error) {
      console.error('매입/매출 통계 조회 오류:', error);
    }
  };

  // 업무 통계 데이터 가져오기
  const fetchWorkStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 이번 달 기준으로 날짜 설정
      const today = new Date();
      const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = today.toISOString().split('T')[0];

      const response = await fetch(`/api/business/statistics?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkStats(data.data);
        }
      }
    } catch (error) {
      console.error('업무 통계 조회 오류:', error);
    }
  };

  // 공지사항 데이터 가져오기
  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notice?limit=3', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotices(data.data);
        }
      }
    } catch (error) {
      console.error('공지사항 조회 오류:', error);
    }
  };



  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('pending');
      case 'approved': return t('approved');
      case 'rejected': return t('rejected');
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
      case 'high': return t('approvalHigh');
      case 'medium': return t('approvalMedium');
      case 'low': return t('approvalLow');
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
        return `${diffMinutes}${t('minutesAgo')}`;
      }
      return `${diffHours}${t('hoursAgo')}`;
    } else if (diffDays === 1) {
      return `1${t('dayAgo')}`;
    } else if (diffDays < 7) {
      return `${diffDays}${t('daysAgo')}`;
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

  // 결제 요청 상세보기
  const handleViewApproval = async (approval: Approval) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/approval/${approval.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log('결제 요청 상세 데이터:', response.data.data);
        setSelectedApproval(response.data.data);
        // 재배정을 위한 사용자 목록 새로고침
        await fetchUsers();
        setViewDialogOpen(true);
        fetchComments(approval.id);
      }
    } catch (error) {
      console.error('결제 요청 상세 조회 오류:', error);
      setSnackbar({
        open: true,
        message: '결제 요청 상세 정보를 불러오는데 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 재지정을 위한 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/approval/users/company', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const allUsers = res.data.data;
        if (currentUser) {
          const roleHierarchy: { [key: string]: number } = {
            'root': 4,
            'admin': 3,
            'audit': 3,
            'user': 1
          };
          const currentUserLevel = roleHierarchy[currentUser.role] || 0;
          const approverCandidates = allUsers.filter((u: any) => {
            if (u.id === currentUser.id) return false;
            const userLevel = roleHierarchy[u.role] || 0;
            return userLevel >= currentUserLevel;
          });
          setFilteredUsers(approverCandidates);
        } else {
          setFilteredUsers(allUsers);
        }
      }
    } catch (e) {
      console.error('사용자 목록 조회 오류:', e);
    }
  };

  // 재지정 실행
  const handleReassign = async () => {
    if (!selectedApproval || !reassignUserId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/approval/${selectedApproval.id}/reassign`, {
        new_approver_id: Number(reassignUserId),
        note: reassignNote,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSnackbar({ open: true, message: '승인자를 재지정했습니다.', severity: 'success' });
        setReassignUserId('');
        setReassignNote('');
        setViewDialogOpen(false);
        fetchDashboardData();
      }
    } catch (e) {
      console.error('재지정 오류:', e);
      setSnackbar({ open: true, message: '재지정에 실패했습니다.', severity: 'error' });
    }
  };

  // 코멘트 조회
  const fetchComments = async (approvalId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/approval/${approvalId}/comments`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (response.data.success) setComments(response.data.data);
    } catch (e) {
      console.error('코멘트 목록 조회 오류:', e);
    }
  };

  // 코멘트 추가
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedApproval) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/approval/${selectedApproval.id}/comments`, 
        { comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setNewComment('');
        fetchComments(selectedApproval.id);
        setSnackbar({
          open: true,
          message: '코멘트가 등록되었습니다.',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('코멘트 추가 오류:', error);
      setSnackbar({
        open: true,
        message: '코멘트 추가에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 승인/거부 처리
  const handleStatusChange = async (approvalId: number, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/approval/${approvalId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: status === 'approved' ? '승인되었습니다.' : '거부되었습니다.',
          severity: 'success',
        });
        setViewDialogOpen(false);
        // 대시보드 데이터 새로고침
        fetchDashboardData();
      }
    } catch (error) {
      console.error('결제 요청 상태 변경 오류:', error);
      setSnackbar({
        open: true,
        message: '결제 요청 처리에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  // 파일 다운로드
  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/approval/file/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      setSnackbar({
        open: true,
        message: '파일 다운로드에 실패했습니다.',
        severity: 'error',
      });
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
      <Box mb={4} display="flex" justifyContent="flex-start" alignItems="center">
        <Typography variant="h6" color="text.secondary">
          {t('welcomeMessage').replace('{name}', userName)}
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
                    {t('totalUsers')}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.users.total || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {t('adminCount')}: {stats?.users.admin || 0} {t('unitPeople')}
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
                    {t('registeredCompanies')}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.companies.total || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {t('activeCount')}: {stats?.companies.active || 0} {t('unit')}
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
                    {t('myRequestedPayments')}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {requestedApprovals.filter(a => a.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    {t('requested')} ({t('pending')})
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Approval overview card (replaces system status) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('approvalOverview')}
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {receivedApprovals.filter(a => a.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('toApprove')} ({t('pending')})
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 통계 요약 섹션 */}
      <Grid container spacing={3} mb={4}>
        {/* 매입/매출 통계 간단 요약 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  매입/매출 통계 요약
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => {
                    // 매입/매출 통계 페이지로 이동
                    const menu: MenuItem = {
                      menu_id: -999,
                      name: '매입/매출 통계',
                      name_en: 'Accounting Statistics',
                      parent_id: null,
                      order_num: 0,
                      icon: 'trending_up',
                      url: '/accounting/statistics',
                      description: 'Accounting statistics'
                    };
                    if (onMenuSelect) onMenuSelect(menu);
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                      color: 'white'
                    }
                  }}
                >
                  상세보기
                </Button>
              </Box>
              
              {/* 간단한 통계 정보 */}
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={1} sx={{ backgroundColor: '#fff3e0', borderRadius: 1 }}>
                      <Typography variant="h6" color="error.main" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        ₹{accountingStats?.summary?.purchase?.total_amount?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        총 매입
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={1} sx={{ backgroundColor: '#e8f5e8', borderRadius: 1 }}>
                      <Typography variant="h6" color="success.main" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        ₹{accountingStats?.summary?.sale?.total_amount?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        총 매출
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                인도 회계 년도 기준 (4월 1일 ~ 3월 31일)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 업무 통계 간단 요약 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  업무 통계 요약
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => {
                    // 업무 통계 페이지로 이동
                    const menu: MenuItem = {
                      menu_id: -999,
                      name: '업무 통계',
                      name_en: 'Work Statistics',
                      parent_id: null,
                      order_num: 0,
                      icon: 'assignment',
                      url: '/business/statistics',
                      description: 'Work statistics'
                    };
                    if (onMenuSelect) onMenuSelect(menu);
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                      color: 'white'
                    }
                  }}
                >
                  상세보기
                </Button>
              </Box>
              
              {/* 간단한 통계 정보 */}
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center" p={1} sx={{ backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                      <Typography variant="h6" color="info.main" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                        {workStats?.status?.find((s: any) => s.status === 'in_progress')?.count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        진행중
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center" p={1} sx={{ backgroundColor: '#e8f5e8', borderRadius: 1 }}>
                      <Typography variant="h6" color="success.main" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                        {workStats?.status?.find((s: any) => s.status === 'completed')?.count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        완료
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center" p={1} sx={{ backgroundColor: '#fff3e0', borderRadius: 1 }}>
                      <Typography variant="h6" color="warning.main" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                        {workStats?.status?.find((s: any) => s.status === 'pending')?.count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        대기
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                이번 달 업무 현황
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 공지사항 섹션 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  최근 공지사항
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => {
                    // 공지사항 페이지로 이동
                    const menu: MenuItem = {
                      menu_id: -999,
                      name: '공지사항',
                      name_en: 'Notice',
                      parent_id: null,
                      order_num: 0,
                      icon: 'announcement',
                      url: '/information/notice',
                      description: 'Company notices'
                    };
                    if (onMenuSelect) onMenuSelect(menu);
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                      color: 'white'
                    }
                  }}
                >
                  전체보기
                </Button>
              </Box>
              
              {propNotices && propNotices.length > 0 ? (
                <Grid container spacing={2}>
                  {propNotices.slice(0, 3).map((notice) => (
                    <Grid item xs={12} md={4} key={notice.id}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          backgroundColor: notice.is_pinned ? '#fff3e0' : '#ffffff',
                          position: 'relative',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 2,
                            borderColor: '#1976d2'
                          }
                        }}
                        onClick={() => onNoticeClick && onNoticeClick(notice)}
                      >
                        {notice.is_pinned && (
                          <Chip
                            label="고정"
                            size="small"
                            color="warning"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              fontSize: '0.7rem',
                              height: '20px'
                            }}
                          />
                        )}
                        <Box sx={{ mb: 1 }}>
                          <Chip
                            label={notice.priority === 'high' ? '높음' : notice.priority === 'medium' ? '보통' : '낮음'}
                            size="small"
                            color={notice.priority === 'high' ? 'error' : notice.priority === 'medium' ? 'warning' : 'info'}
                            sx={{ fontSize: '0.7rem', height: '20px', mb: 1 }}
                          />
                        </Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 1,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {notice.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 1,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {notice.content}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {notice.Author?.username || '작성자'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    등록된 공지사항이 없습니다.
                  </Typography>
                </Box>
              )}
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
                  {t('myReceivedPaymentRequests')}
                </Typography>
                <Button 
                  size="small" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 내가 받은 결제 요청 전체보기 클릭 → received 탭으로 이동');
                    console.log('📥 전달할 파라미터: received');
                    console.log('🧹 브라우저 스토리지 초기화 시작');
                    sessionStorage.removeItem('approvalPageType');
                    navigateToApprovalPage('received');
                  }}
                  sx={{ 
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                      color: 'white'
                    }
                  }}
                >
                  {t('viewAll')}
                </Button>
              </Box>
              {receivedApprovals.length > 0 ? (
                <List dense sx={{ pt: 0 }}>
                  {receivedApprovals.slice(0, 3).map((approval) => (
                    <ListItem 
                      key={approval.id} 
                      sx={{ 
                        px: 0, 
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderRadius: 1
                      }}
                      onClick={() => handleViewApproval(approval)}
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
                                  fontWeight: isUnreadApproval(approval.created_at) ? 'bold' : 'normal',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '200px' // 제목 최대 너비 제한
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
                            {t('approvalRequester')}: {approval.requester?.username || t('unknown')} • {formatDate(approval.created_at)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    {t('noReceivedRequests')}
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
                  {t('myRequestedPayments')}
                </Typography>
                <Button 
                  size="small" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 내가 요청한 결제 전체보기 클릭 → request 탭으로 이동');
                    console.log('📤 전달할 파라미터: request');
                    console.log('🧹 브라우저 스토리지 초기화 시작');
                    sessionStorage.removeItem('approvalPageType');
                    navigateToApprovalPage('request');
                  }}
                  sx={{ 
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                      color: 'white'
                    }
                  }}
                >
                  {t('viewAll')}
                </Button>
              </Box>
              {requestedApprovals.length > 0 ? (
                <List dense sx={{ pt: 0 }}>
                  {requestedApprovals.slice(0, 3).map((approval) => (
                    <ListItem 
                      key={approval.id} 
                      sx={{ 
                        px: 0, 
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderRadius: 1
                      }}
                      onClick={() => handleViewApproval(approval)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          <AssignmentIcon sx={{ fontSize: '1rem' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography 
                              variant="body2" 
                              noWrap 
                              sx={{ 
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '200px' // 제목 최대 너비 제한
                              }}
                            >
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
                            {t('approvalApprover')}: {approval.approver?.username || t('unknown')} • {formatDate(approval.created_at)}
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

      </Grid>

      {/* 결제 요청 상세 보기 다이얼로그 (Approval 상세 디자인과 동일 포맷) */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <Box sx={{ 
          p: 3, 
          backgroundColor: '#fff',
          fontFamily: '"Noto Sans KR", "Malgun Gothic", sans-serif',
          lineHeight: 1.05,
          '& .MuiTypography-root': { lineHeight: 1.05 },
          '& .MuiTableCell-root': { lineHeight: 1.05, py: 0.8 }
        }}>
          {selectedApproval && (
            <>
              {/* 문서 헤더 */}
              <Box sx={{ 
                textAlign: 'center', 
                mb: 2.2,
                borderBottom: '3px solid #1976d2',
                pb: 1.5
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.3rem',
                  color: '#1976d2',
                  mb: 0.7,
                  lineHeight: 1.15
                }}>
                  {t('electronicApprovalRequestDetails')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', lineHeight: 1.05 }}>
                  Electronic Approval Request Details
                </Typography>
              </Box>

              {/* 상단 요약 박스: 요청 번호/요청일자, 현재 상태/마감일 */}
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={1.2}>
        <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', backgroundColor: '#fafafa', borderRadius: 1.5, boxShadow: 'none' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t('documentNumber')}: <b>{selectedApproval.id}</b>
              </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('approvalRequestDate')}: {new Date(selectedApproval.created_at).toLocaleDateString('ko-KR')}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', backgroundColor: '#fafafa', borderRadius: 1.5, boxShadow: 'none' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t('approvalCurrentStatus')}: <b>{getStatusText(selectedApproval.status)}</b>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('dueDateLabel')}: {selectedApproval.due_date ? new Date(selectedApproval.due_date).toLocaleDateString('ko-KR') : '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                          </Box>

              

                            {/* 요청 내용 */}
              <Box sx={{ mb: 2.2 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 1.5,
                  color: '#333',
                  borderLeft: '4px solid #1976d2',
                  pl: 1.5,
                  lineHeight: 1.15
                }}>
                  1. 요청 내용
                </Typography>
                
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ddd' }}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ 
                          backgroundColor: '#f5f5f5', 
                          fontWeight: 'bold',
                          width: '150px',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          제목
                        </TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15,
                          maxWidth: '400px',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          <Typography variant="body2" sx={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {selectedApproval.title}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ 
                          backgroundColor: '#f5f5f5', 
                          fontWeight: 'bold',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          상세 내용
                        </TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          maxWidth: '400px',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          <Typography variant="body2" sx={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.15,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {selectedApproval.content}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ 
                          backgroundColor: '#f5f5f5', 
                          fontWeight: 'bold',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          우선순위
                        </TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5
                        }}>
                              <Chip 
                            label={getPriorityText(selectedApproval.priority)}
                            color={getPriorityColor(selectedApproval.priority) as any}
                                size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                          </Box>

                                          {/* 첨부 파일 */}
              {selectedApproval.files && selectedApproval.files.length > 0 && (
                <Box sx={{ mb: 2.2 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1.5,
                    color: '#333',
                    borderLeft: '4px solid #1976d2',
                    pl: 1.5,
                    lineHeight: 1.15
                  }}>
                    2. 첨부 파일
                  </Typography>
                  
                  <Paper sx={{ p: 1.5, border: '1px solid #ddd', backgroundColor: '#fafafa' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.7, lineHeight: 1.15 }}>
                      {t('attachedFilesCount').replace('{count}', selectedApproval.files.length.toString())}
                    </Typography>
                    <List dense>
                      {selectedApproval.files.map((file: any) => (
                        <ListItem key={file.id} sx={{ py: 0.4, border: '1px solid #eee', mb: 0.8, borderRadius: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <AttachFileIcon sx={{ fontSize: '1rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.original_name}
                            secondary={`${formatFileSize(file.file_size || 0)} • 업로드: ${file.uploader?.username || '알 수 없음'}`}
                            sx={{
                              '& .MuiListItemText-primary': { fontSize: '0.85rem', lineHeight: 1.15 },
                              '& .MuiListItemText-secondary': { fontSize: '0.75rem', lineHeight: 1.15 }
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleFileDownload(file.id, file.original_name)}
                            sx={{ color: '#1976d2' }}
                          >
                            <DownloadIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                    </ListItem>
                ))}
              </List>
                  </Paper>
                </Box>
              )}

                            {/* 확인란 */}
              <Box sx={{ mb: 2.2 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 1.5,
                  color: '#333',
                  borderLeft: '4px solid #1976d2',
                  pl: 1.5,
                  lineHeight: 1.15
                }}>
                  3. 확인란
              </Typography>
                
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ddd' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          backgroundColor: '#e3f2fd', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          구분
                        </TableCell>
                        <TableCell sx={{ 
                          backgroundColor: '#e3f2fd', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          성명
                        </TableCell>
                        <TableCell sx={{ 
                          backgroundColor: '#e3f2fd', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          날짜
                        </TableCell>
                        <TableCell sx={{ 
                          backgroundColor: '#e3f2fd', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          확인
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          요청자
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {selectedApproval.requester?.username}
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {new Date(selectedApproval.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5
                        }}>
                          <Chip label="요청" color="info" size="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          승인자
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {selectedApproval.approver?.username}
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {selectedApproval.status !== 'pending' ? new Date((selectedApproval as any).updated_at || selectedApproval.created_at).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5
                        }}>
                          <Chip 
                            label={selectedApproval.status === 'pending' ? '승인 대기' : selectedApproval.status === 'approved' ? '승인' : '거부'}
                            color={selectedApproval.status === 'pending' ? 'warning' : selectedApproval.status === 'approved' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                  </Box>

                            {/* 코멘트 및 처리 이력 */}
              <Box sx={{ mb: 2.2 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  mb: 1.5,
                  color: '#333',
                  borderLeft: '4px solid #1976d2',
                  pl: 1.5,
                  lineHeight: 1.15
                }}>
{t('commentsAndHistory')}
                    </Typography>
                <Paper sx={{ p: 1.5, border: '1px solid #ddd', backgroundColor: '#fafafa' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.7, lineHeight: 1.15 }}>
                    {t('processingHistoryCount').replace('{count}', comments.length.toString())}
                  </Typography>
                  {comments.length > 0 ? (
                    <List dense>
                      {comments.map((comment: any) => (
                        <ListItem key={comment.id} sx={{ py: 0.4, border: '1px solid #eee', mb: 0.8, borderRadius: 1 }}>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem', lineHeight: 1.15 }}>
                                {comment.author?.username || comment.user?.username || '사용자'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.15 }}>
                                {new Date(comment.created_at).toLocaleString('ko-KR')}
                              </Typography>
                  </Box>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.8rem', 
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.15
                            }}>
                              {comment.comment || comment.content || ''}
                    </Typography>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary', 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      py: 1.5,
                      lineHeight: 1.15
                    }}>
                      아직 코멘트가 없습니다.
                    </Typography>
                  )}
                  
                  {selectedApproval.status === 'pending' ? (
                    <Box sx={{ display: 'flex', gap: 0.8, mt: 1.5 }}>
                      <TextField
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        placeholder="코멘트를 입력하세요 (Enter: 등록, Shift+Enter: 줄바꿈)"
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            fontSize: '0.85rem',
                            backgroundColor: '#fff'
                          }
                        }}
                      />
                      <Button 
                        variant="contained" 
                        onClick={handleAddComment}
                        sx={{ 
                          textTransform: 'none',
                          minWidth: '80px',
                          py: 1.0
                        }}
                      >
                        등록
                      </Button>
                  </Box>
                  ) : (
                    <Box sx={{ 
                      mt: 1.5, 
                      p: 1.5, 
                      border: '1px solid #ddd', 
                      borderRadius: 1,
                      backgroundColor: '#f5f5f5',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        lineHeight: 1.15
                      }}>
                        {selectedApproval.status === 'approved' 
                          ? '승인 완료된 요청입니다. 더 이상 코멘트를 추가할 수 없습니다.'
                          : '거부된 요청입니다. 더 이상 코멘트를 추가할 수 없습니다.'
                        }
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* 결재 재지정 - 승인자에게만 보여줌 */}
              {selectedApproval?.approver?.username === currentUser?.username && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333', borderLeft: '4px solid #ff9800', pl: 2 }}>
                    5. 결재 재지정
                  </Typography>
                  <Paper sx={{ p: 3, border: '1px solid #ddd', backgroundColor: '#fff8e1' }}>
                    <Typography variant="body2" sx={{ mb: 2, color: '#e65100' }}>
                      다른 승인자에게 결재를 재지정할 수 있습니다.
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={filteredUsers}
                          getOptionLabel={(option: any) => `${option.username} (${option.userid})`}
                          value={filteredUsers.find((u: any) => u.id.toString() === reassignUserId) || null}
                          onChange={(e, v: any) => setReassignUserId(v ? v.id.toString() : '')}
                          renderInput={(params) => (
                            <TextField {...params} label="새 승인자" size="small" placeholder="새 승인자를 선택하세요..." />
                          )}
                          noOptionsText="승인 가능한 사용자가 없습니다"
                          size="small"
                          fullWidth
                        />
                </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          value={reassignNote}
                          onChange={(e) => setReassignNote(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReassign(); } }}
                          label="재지정 사유"
                          placeholder="재지정 사유를 입력하세요 (선택)"
                          fullWidth
                          size="small"
                        />
              </Grid>
                      <Grid item xs={12}>
                        <Button variant="outlined" onClick={handleReassign} disabled={!reassignUserId} sx={{ textTransform: 'none', color: '#e65100', borderColor: '#e65100', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#e65100' } }}>
                          결재 재지정
                        </Button>
        </Grid>
      </Grid>
                  </Paper>
                </Box>
              )}

              {/* 하단 승인/거부/닫기 - 이미지와 동일 버튼 배치 */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, pt: 3, borderTop: '1px solid #eee' }}>
                {selectedApproval?.status === 'pending' && selectedApproval?.approver?.username === currentUser?.username && (
                  <>
                    <Button startIcon={<CancelIcon />} color="error" variant="outlined" onClick={() => handleStatusChange(selectedApproval.id, 'rejected')} sx={{ minWidth: 100 }}>
                      {t('rejectRequest')}
                    </Button>
                    <Button startIcon={<CheckCircleIcon />} color="success" variant="contained" onClick={() => handleStatusChange(selectedApproval.id, 'approved')} sx={{ minWidth: 100 }}>
                      {t('approveRequest')}
                    </Button>
                  </>
                )}
                <Button onClick={() => setViewDialogOpen(false)} variant="outlined" sx={{ minWidth: 100 }}>
                  {t('close')}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 알림 설정 다이얼로그 */}
      <Dialog 
        open={showNotificationSettings} 
        onClose={() => setShowNotificationSettings(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">알림 설정</Typography>
            <IconButton onClick={() => setShowNotificationSettings(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DashboardPage;