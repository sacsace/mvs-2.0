import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  SelectChangeEvent,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import axios from 'axios';
import { filterUsersByPermission, useMenuPermission } from '../hooks/useMenuPermission';

interface Approval {
  id: number;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  created_at: string;
  updated_at?: string;
  requester: {
    id: number;
    username: string;
    userid: string;
  };
  approver: {
    id: number;
    username: string;
    userid: string;
  };
  files: ApprovalFile[];
}

interface ApprovalFile {
  id: number;
  original_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploader: {
    username: string;
  };
}

interface User {
  id: number;
  username: string;
  userid: string;
  role: string;
}

const ApprovalPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { permission: approvalMenuPermission } = useMenuPermission('전자결재');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [reassignUserId, setReassignUserId] = useState<string>('');
  const [reassignNote, setReassignNote] = useState('');
  // URL 파라미터 관리 유틸리티
  const getTypeFromUrl = (shouldCleanSession: boolean = false): 'request' | 'received' => {
    console.log('🔍 getTypeFromUrl 호출됨 (shouldCleanSession:', shouldCleanSession, ')');
    console.log('📍 현재 location:', location.pathname + location.search);
    
    // 먼저 URL 파라미터 확인
    const searchParams = new URLSearchParams(location.search);
    const urlType = searchParams.get('type');
    
    // URL 파라미터가 없으면 세션 스토리지에서 확인
    const sessionType = sessionStorage.getItem('approvalPageType');
    
    console.log('🔍 URL 파라미터:', urlType);
    console.log('🔍 세션 스토리지:', sessionType);
    
    let result: 'request' | 'received' = 'request';
    
    if (urlType === 'received' || urlType === 'request') {
      result = urlType as 'request' | 'received';
      console.log('✅ URL 파라미터에서 타입 확인:', urlType);
    } else if (sessionType === 'received' || sessionType === 'request') {
      result = sessionType as 'request' | 'received';
      console.log('✅ 세션 스토리지에서 타입 확인:', sessionType);
    } else {
      console.log('🔍 기본 타입 사용: request');
    }
    
    // shouldCleanSession이 true일 때만 세션 스토리지 정리
    if (shouldCleanSession && sessionType) {
      sessionStorage.removeItem('approvalPageType');
      console.log('🧹 세션 스토리지 정리됨:', sessionType);
    }
    
    console.log('✅ 최종 탭 설정:', result);
    return result;
  };

  const updateUrlWithType = (type: 'request' | 'received') => {
    const newUrl = `/approval?type=${type}`;
    console.log('🔗 URL 업데이트:', newUrl);
    navigate(newUrl, { replace: true });
  };
  
  const [filterType, setFilterType] = useState<'request' | 'received'>(getTypeFromUrl(false));
  
  // 컴포넌트 마운트 시 filterType 재확인
  useEffect(() => {
    console.log('🚀 ApprovalPage 마운트됨');
    console.log('📍 현재 location:', location.pathname + location.search);
    
    // 세션 스토리지에서 우선 확인
    const sessionType = sessionStorage.getItem('approvalPageType');
    console.log('💾 마운트 시 세션 스토리지:', sessionType);
    
    if (sessionType === 'request' || sessionType === 'received') {
      console.log('✅ 세션 스토리지에서 타입 적용:', sessionType);
      setFilterType(sessionType as 'request' | 'received');
      // 사용 후 정리
      sessionStorage.removeItem('approvalPageType');
      return;
    }
    
    // 세션 스토리지가 없으면 URL에서 확인 (정리 없이)
    const correctType = getTypeFromUrl(false);
    if (correctType !== filterType) {
      console.log('🔄 마운트 시 filterType 수정:', filterType, '→', correctType);
      setFilterType(correctType);
    }
  }, []); // 빈 배열로 마운트 시에만 실행
  
  // filterType 변경 추적
  useEffect(() => {
    console.log('🔄 filterType 변경됨:', filterType);
  }, [filterType]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // 정렬 상태 관리
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // URL 파라미터 변경 감지 및 filterType 동기화
  useEffect(() => {
    console.log('🔄 URL 변경 감지 (location.search):', location.pathname + location.search);
    
    // 세션 스토리지 우선 확인
    const sessionType = sessionStorage.getItem('approvalPageType');
    if (sessionType === 'request' || sessionType === 'received') {
      console.log('💾 URL 변경 시 세션 스토리지 우선 적용:', sessionType);
      setFilterType(sessionType as 'request' | 'received');
      sessionStorage.removeItem('approvalPageType');
      return;
    }
    
    // URL 파라미터에서 확인 (세션 정리 포함)
    const urlType = getTypeFromUrl(true);
    console.log('📋 URL type:', urlType, '| 현재 filterType:', filterType);
    
    if (urlType !== filterType) {
      console.log('✅ 탭 동기화 실행:', filterType, '→', urlType);
      setFilterType(urlType);
    } else {
      console.log('✅ 탭 이미 동기화됨:', filterType);
    }
  }, [location.search, location.pathname]);

  // approvals 데이터가 로딩된 후 URL의 id 파라미터 확인하여 자동 열기
  useEffect(() => {
    if (approvals.length > 0) {
    const searchParams = new URLSearchParams(location.search);
      const id = searchParams.get('id');
      
      if (id) {
        const approvalId = parseInt(id);
        const approval = approvals.find(a => a.id === approvalId);
        if (approval) {
          handleViewApproval(approval);
          // URL에서 id 파라미터 제거 (한 번만 자동으로 열도록)
          const newSearchParams = new URLSearchParams(location.search);
          newSearchParams.delete('id');
          const newUrl = `${location.pathname}?${newSearchParams.toString()}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [approvals, location.search]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 3일 후 날짜 생성 함수
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  };

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    approver_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: getDefaultDueDate(),
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentUser();
      fetchApprovals();
    };
    initializeData();
  }, [filterType, filterStatus]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // 알림 읽음 처리
  useEffect(() => {
    const markNotificationsAsRead = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/approval/notifications/mark-read', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // 대시보드 알림 새로고침을 위한 플래그 설정
        localStorage.setItem('notificationUpdated', Date.now().toString());
        
        console.log('✅ 알림 읽음 처리 완료');
      } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
      }
    };

    markNotificationsAsRead();
  }, []); // 컴포넌트 마운트시 한 번만 실행

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      console.log('🔍 결재 요청 파라미터:', {
        filterType,
        filterStatus,
        url: `/api/approval?${params.toString()}`
      });

      const response = await axios.get(`/api/approval?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📋 결재 응답 데이터:', response.data);

      if (response.data.success) {
        console.log(`✅ ${response.data.data.length}개의 결재 데이터 로드됨`);
        setApprovals(response.data.data);
      }
    } catch (error) {
      console.error('결제 요청 목록 조회 오류:', error);
      setSnackbar({
        open: true,
        message: '결제 요청 목록을 불러오는데 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // filterType 또는 filterStatus가 변경될 때 데이터 다시 로딩
  useEffect(() => {
    console.log('🔄 필터 변경됨, 데이터 재로딩:', { filterType, filterStatus });
    fetchApprovals();
  }, [filterType, filterStatus]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCurrentUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('현재 사용자 조회 오류:', error);
    }
    return null;
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 사용자 목록 조회 시작');
      const response = await axios.get('/api/approval/users/company', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📊 API 응답:', response.data);

      if (response.data.success) {
        const allUsers = response.data.data;
        console.log('👥 전체 사용자:', allUsers);
        setUsers(allUsers);
        
        // 결제 승인자는 현재 사용자와 같거나 상위 권한자여야 함
        if (currentUser) {
          console.log('👤 현재 사용자:', currentUser);
          const approverCandidates = allUsers.filter((user: any) => {
            // 자신 제외
            if (user.id === currentUser.id) return false;
            
            // 역할 기반 필터링 (승인자는 같거나 상위 권한자)
            const roleHierarchy: { [key: string]: number } = {
              'root': 4,
              'admin': 3,
              'audit': 3,
              'user': 1
            };
            
            const currentUserLevel = roleHierarchy[currentUser.role] || 0;
            const userLevel = roleHierarchy[user.role] || 0;
            
            return userLevel >= currentUserLevel;
          });
          
          console.log('✅ 승인자 후보:', approverCandidates);
          setFilteredUsers(approverCandidates);
        } else {
          console.log('⚠️ 현재 사용자 정보 없음 - 전체 사용자 사용');
          setFilteredUsers(allUsers);
        }
      } else {
        console.error('❌ API 응답 실패:', response.data);
      }
    } catch (error) {
      console.error('❌ 사용자 목록 조회 오류:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // 마감일이 비어있으면 자동으로 3일 후로 설정
      const finalDueDate = formData.due_date || getDefaultDueDate();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('approver_id', formData.approver_id);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('due_date', finalDueDate);

      selectedFiles.forEach((file) => {
        formDataToSend.append('files', file);
      });

      const response = await axios.post('/api/approval', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: '결제 요청이 생성되었습니다.',
          severity: 'success',
        });
        setDialogOpen(false);
        resetForm();
        fetchApprovals();
      }
    } catch (error) {
      console.error('결제 요청 생성 오류:', error);
      setSnackbar({
        open: true,
        message: '결제 요청 생성에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleViewApproval = async (approval: Approval) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/approval/${approval.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSelectedApproval(response.data.data);
        
        // 재배정을 위한 사용자 목록 새로고침
        await fetchUsers();
        
        setViewDialogOpen(true);
        // 코멘트 로드
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

  const fetchComments = async (approvalId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/approval/${approvalId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setComments(res.data.data);
    } catch (e) {
      console.error('코멘트 목록 조회 오류:', e);
    }
  };

  const handleAddComment = async () => {
    if (!selectedApproval || !newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/approval/${selectedApproval.id}/comments`, { comment: newComment }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setNewComment('');
        fetchComments(selectedApproval.id);
      }
    } catch (e) {
      console.error('코멘트 작성 오류:', e);
    }
  };

  const handleReassign = async () => {
    if (!selectedApproval || !reassignUserId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/approval/${selectedApproval.id}/reassign`, { new_approver_id: Number(reassignUserId), note: reassignNote }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setSnackbar({ open: true, message: t('approverReassigned'), severity: 'success' });
        setReassignUserId('');
        setReassignNote('');
        setViewDialogOpen(false);
        fetchApprovals();
      }
    } catch (e) {
      console.error('재지정 오류:', e);
      setSnackbar({ open: true, message: '재지정에 실패했습니다.', severity: 'error' });
    }
  };

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
          message: '결제 요청이 처리되었습니다.',
          severity: 'success',
        });
        setViewDialogOpen(false);
        fetchApprovals();
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

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      approver_id: '',
      priority: 'medium',
      due_date: getDefaultDueDate(),
    });
    setSelectedFiles([]);
  };

  // 정렬 핸들러
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 같은 필드를 클릭한 경우 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭한 경우 해당 필드로 오름차순 설정
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUpward sx={{ fontSize: 14, ml: 0.5 }} /> : 
      <ArrowDownward sx={{ fontSize: 14, ml: 0.5 }} />;
  };

  // 필터링 및 정렬된 승인 목록
  const filteredAndSortedApprovals = (() => {
    console.log('🔍 필터링 - filterType:', filterType, '| 사용자:', currentUser?.username, '| 전체:', approvals.length);
    
    // 필터링
    let filtered = approvals.filter(approval => {
      const isRequested = approval.requester.username === currentUser?.username;
      const isReceived = approval.approver.username === currentUser?.username;
      
      const matchesType = 
        (filterType === 'request' && isRequested) ||
        (filterType === 'received' && isReceived);
      
      const matchesStatus = filterStatus === 'all' || approval.status === filterStatus;
      
      return matchesType && matchesStatus;
    });
    
    console.log('✅ 필터링 완료:', filtered.length, '개 결재');

    // 정렬
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (sortField) {
          case 'title':
            aValue = a.title?.toLowerCase() || '';
            bValue = b.title?.toLowerCase() || '';
            break;
          case 'requester':
            aValue = a.requester?.username?.toLowerCase() || '';
            bValue = b.requester?.username?.toLowerCase() || '';
            break;
          case 'approver':
            aValue = a.approver?.username?.toLowerCase() || '';
            bValue = b.approver?.username?.toLowerCase() || '';
            break;
          case 'priority':
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'due_date':
            aValue = new Date(a.due_date || 0);
            bValue = new Date(b.due_date || 0);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  })();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('waitingForApproval');
      case 'approved': return t('approved');
      case 'rejected': return t('rejected');
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ScheduleIcon sx={{ fontSize: '1.5rem', color: '#1976d2' }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
            {t('electronicApproval')}
          </Typography>
        </Box>
        {!!approvalMenuPermission.can_create && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { fetchUsers(); setDialogOpen(true); }}
            sx={{ fontSize: '0.8rem', textTransform: 'none', boxShadow: 'none', borderRadius: 2, py: 0.8, px: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}
          >
            {t('requestApproval')}
          </Button>
        )}
      </Box>

      {/* 탭 네비게이션 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
                value={filterType}
            onChange={(event, newValue) => {
              console.log('🎯 탭 클릭:', filterType, '→', newValue, '(URL 파라미터 업데이트)');
              
              // 탭 클릭 시 즉시 filterType 업데이트
              setFilterType(newValue);
              
              // 세션 스토리지도 업데이트 (백업)
              sessionStorage.setItem('approvalPageType', newValue);
              console.log('💾 탭 클릭 시 세션 스토리지 업데이트:', newValue);
              
              // URL도 업데이트
              updateUrlWithType(newValue);
            }}
            sx={{ 
              px: 2,
              '& .MuiTab-root': {
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 48,
                '&.Mui-selected': {
                  color: '#1976d2',
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1976d2',
                height: 3,
              }
            }}
          >
            <Tab 
              label={t('requestedApprovals')} 
              value="request"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                }
              }}
            />
            <Tab 
              label={t('receivedApprovals')} 
              value="received"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                }
              }}
            />
          </Tabs>
        </Box>
        
        {/* 상태 필터 */}
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>{t('statusFilter')}</InputLabel>
              <Select
                value={filterStatus}
                label={t('statusFilter')}
                onChange={(e: SelectChangeEvent) => setFilterStatus(e.target.value as any)}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>{t('all')}</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: '0.8rem' }}>{t('waitingForApproval')}</MenuItem>
                <MenuItem value="approved" sx={{ fontSize: '0.8rem' }}>{t('approved')}</MenuItem>
                <MenuItem value="rejected" sx={{ fontSize: '0.8rem' }}>{t('rejected')}</MenuItem>
              </Select>
            </FormControl>
            
            {/* 탭별 안내 텍스트 */}
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', ml: 2 }}>
              {filterType === 'request' 
                ? t('myRequestedApprovals') 
                : t('receivedApprovalsDescription')
              }
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 결제 요청 목록 */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(25, 118, 210, 0.06)', borderRadius: 2, border: '1px solid #e3eafc' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#f7fafd' }}>
                <TableCell 
                  sx={{ 
                    pl: 1.2, 
                    py: 1.5, 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    color: '#222', 
                    border: 0, 
                    background: 'inherit',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: '#e9f4ff' }
                  }}
                  onClick={() => handleSort('title')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {t('approvalTitle')}
                    {renderSortIcon('title')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1.5, 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    color: '#222', 
                    border: 0, 
                    background: 'inherit',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: '#e9f4ff' }
                  }}
                  onClick={() => handleSort(filterType === 'request' ? 'approver' : 'requester')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {filterType === 'request' ? t('approvalApprover') : t('approvalRequester')}
                    {renderSortIcon(filterType === 'request' ? 'approver' : 'requester')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1.5, 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    color: '#222', 
                    border: 0, 
                    background: 'inherit',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: '#e9f4ff' }
                  }}
                  onClick={() => handleSort('priority')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {t('approvalPriority')}
                    {renderSortIcon('priority')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1.5, 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    color: '#222', 
                    border: 0, 
                    background: 'inherit',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: '#e9f4ff' }
                  }}
                  onClick={() => handleSort('status')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {t('status')}
                    {renderSortIcon('status')}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 0.5, 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    color: '#222', 
                    border: 0, 
                    background: 'inherit',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: '#e9f4ff' }
                  }}
                  onClick={() => handleSort('due_date')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {t('dueDate')}
                    {renderSortIcon('due_date')}
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  {t('attachments')}
                </TableCell>
                <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  {t('actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedApprovals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <ScheduleIcon sx={{ fontSize: '3rem', color: '#ddd' }} />
                      <Typography variant="h6" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                        {filterType === 'request' 
                          ? t('noApprovals')
                          : t('noApprovals')
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {filterType === 'request' 
                          ? t('createApprovalRequest')
                          : t('noApprovals')
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedApprovals.map((approval) => (
                <TableRow 
                  key={approval.id} 
                  onClick={() => handleViewApproval(approval)}
                  sx={{ 
                    '&:hover': { backgroundColor: '#f8fafc' }, 
                    cursor: 'pointer' 
                  }}
                >
                    <TableCell sx={{ 
                      pl: 1.2, 
                      py: 1.5, 
                      fontSize: '0.8rem', 
                      border: 0,
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                    {approval.title}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontSize: '0.8rem', border: 0 }}>
                      {filterType === 'request' ? approval.approver.username : approval.requester.username}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, border: 0 }}>
                    <Chip
                      label={getPriorityText(approval.priority)}
                      color={getPriorityColor(approval.priority) as any}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5, border: 0 }}>
                    <Chip
                      label={getStatusText(approval.status)}
                      color={getStatusColor(approval.status) as any}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontSize: '0.8rem', border: 0 }}>
                    {new Date(approval.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontSize: '0.8rem', border: 0 }}>
                    {approval.files.length > 0 ? (
                      <Chip
                        icon={<AttachFileIcon />}
                        label={approval.files.length}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, border: 0 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewApproval(approval);
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <VisibilityIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 결제 요청 생성 다이얼로그 - 공식 서류 형태 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <Box sx={{ 
          p: 3, 
          backgroundColor: '#fff',
          minHeight: '500px',
          fontFamily: '"Noto Sans KR", "Malgun Gothic", sans-serif',
          // 전체 줄간격 30% 축소 (기본 1.5 → 1.05)
          lineHeight: 1.05,
          '& .MuiTypography-root': { lineHeight: 1.05 },
          '& .MuiTableCell-root': { lineHeight: 1.05, py: 0.8 }
        }}>
          {/* 문서 헤더 */}
          <Box sx={{ 
            textAlign: 'center', 
            mb: 4,
            borderBottom: '3px solid #1976d2',
            pb: 2
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              fontSize: '1.5rem',
              color: '#1976d2',
              mb: 1
            }}>
              {t('electronicApprovalRequest')}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666',
              fontSize: '0.8rem'
            }}>
              Electronic Approval Request Form
            </Typography>
          </Box>

          {/* 문서 정보 */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    문서 번호: REQ-{new Date().getFullYear()}-{String(Date.now()).slice(-6)}
                  </Typography>
                  <Typography variant="body2">
                    작성일자: {new Date().toLocaleDateString('ko-KR')}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                          {t('approvalRequester')}: {currentUser?.username || t('unknown')}
                  </Typography>
                  <Typography variant="body2">
                    {t('department')}: {currentUser?.department || t('general')}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* 요청 내용 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333',
              borderLeft: '4px solid #1976d2',
              pl: 2
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
                      border: '1px solid #ddd'
                    }}>
                      제목 *
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }}>
              <TextField
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                        variant="outlined"
                size="small"
                        placeholder="요청 제목을 입력하세요"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            fontSize: '0.9rem',
                            '& fieldset': { border: 'none' }
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ 
                      backgroundColor: '#f5f5f5', 
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      상세 내용 *
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }}>
                      <TextField
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="결제 요청 사유 및 상세 내용을 입력하세요"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            fontSize: '0.9rem',
                            '& fieldset': { border: 'none' }
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 승인 정보 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333',
              borderLeft: '4px solid #1976d2',
              pl: 2
            }}>
              {t('approvalInfoSection')}
            </Typography>
            
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ddd' }}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ 
                      backgroundColor: '#f5f5f5', 
                      fontWeight: 'bold',
                      width: '150px',
                      border: '1px solid #ddd'
                    }}>
                      {t('approverLabel')}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ddd', width: '50%' }}>
              <Autocomplete
                options={filteredUsers}
                getOptionLabel={(option) => `${option.username} (${option.userid})`}
                value={filteredUsers.find(user => user.id.toString() === formData.approver_id) || null}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, approver_id: newValue ? newValue.id.toString() : '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                            placeholder={t('selectApproverPlaceholder')}
                    size="small"
                    sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.9rem',
                                '& fieldset': { border: 'none' }
                              }
                    }}
                  />
                )}
                noOptionsText={t('noAvailableApprovers')}
                size="small"
                fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#f5f5f5', 
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      우선순위
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }}>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                          sx={{ 
                            fontSize: '0.9rem',
                            '& fieldset': { border: 'none' }
                          }}
                        >
                          <MenuItem value="low">{t('approvalLow')}</MenuItem>
                          <MenuItem value="medium">{t('approvalMedium')}</MenuItem>
                          <MenuItem value="high">{t('approvalHigh')}</MenuItem>
                </Select>
              </FormControl>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ 
                      backgroundColor: '#f5f5f5', 
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      완료 예정일
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }} colSpan={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                size="small"
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              fontSize: '0.9rem',
                              '& fieldset': { border: '1px solid #ddd' }
                            }
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          * 미선택 시 자동으로 3일 후로 설정됩니다
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 첨부 파일 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333',
              borderLeft: '4px solid #1976d2',
              pl: 2
            }}>
              3. 첨부 파일
            </Typography>
            
            <Paper sx={{ p: 3, border: '1px solid #ddd', backgroundColor: '#fafafa' }}>
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFileIcon />}
                  sx={{ 
                    fontSize: '0.9rem', 
                    textTransform: 'none',
                    mb: selectedFiles.length > 0 ? 2 : 0
                  }}
                >
                  파일 첨부
                </Button>
              </label>
              
              {selectedFiles.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    첨부된 파일 ({selectedFiles.length}개):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={index}
                        label={`${file.name} (${Math.round(file.size / 1024)}KB)`}
                      onDelete={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                      size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.8rem' }}
                    />
                  ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>

          {/* 서명란 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333',
              borderLeft: '4px solid #1976d2',
              pl: 2
            }}>
              4. {t('confirmationSectionTitle')}
            </Typography>
            
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ddd' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      backgroundColor: '#e3f2fd', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      구분
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#e3f2fd', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      성명
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#e3f2fd', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      날짜
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#e3f2fd', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      {t('confirmationHeader')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      요청자
                    </TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      {currentUser?.username || '사용자'}
                    </TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      {new Date().toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      minHeight: '50px'
                    }}>
                      <Box sx={{ 
                        display: 'inline-block',
                        padding: '5px 15px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        요청
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      {t('approvalApprover')}
                    </TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      {filteredUsers.find(user => user.id.toString() === formData.approver_id)?.username || '-'}
                    </TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      border: '1px solid #ddd'
                    }}>
                      -
                    </TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      minHeight: '50px'
                    }}>
                      <Box sx={{ 
                        height: '40px',
                        border: '1px dashed #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '0.8rem'
                      }}>
                        {t('approvalWaitingStatus')}
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 하단 버튼 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2,
            pt: 3,
            borderTop: '1px solid #eee'
          }}>
            <Button 
              onClick={() => setDialogOpen(false)} 
              variant="outlined"
              size="large"
              sx={{ 
                fontSize: '1rem', 
                textTransform: 'none',
                minWidth: '120px',
                py: 1
              }}
            >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
              size="large"
              disabled={!formData.title || !formData.content || !formData.approver_id}
              sx={{ 
                fontSize: '1rem', 
                textTransform: 'none',
                minWidth: '120px',
                py: 1,
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#115293' }
              }}
            >
              결재 요청
          </Button>
          </Box>
        </Box>
      </Dialog>

      {/* 결제 요청 상세 보기 다이얼로그 - 공식 서류 형태 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <Box sx={{ 
          p: 3, 
          backgroundColor: '#fff',
          fontFamily: '"Noto Sans KR", "Malgun Gothic", sans-serif',
          // 상세보기 역시 줄간격 30% 축소 적용
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
                <Typography variant="body2" sx={{ 
                  color: '#666',
                  fontSize: '0.8rem',
                  lineHeight: 1.05
                }}>
                  Electronic Approval Request Details
                  </Typography>
              </Box>

                                          {/* 문서 정보 */}
              <Box sx={{ mb: 2.2 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, backgroundColor: '#f8f9fa' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.7, lineHeight: 1.15 }}>
                        요청 번호: {selectedApproval.id}
                  </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.15 }}>
                        요청일자: {new Date(selectedApproval.created_at).toLocaleDateString('ko-KR')}
                  </Typography>
                    </Paper>
                </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, backgroundColor: '#f8f9fa' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.7, lineHeight: 1.15 }}>
                        {t('currentStatus')}: {selectedApproval.status === 'pending' ? t('approvalWaitingStatus') : 
                                   selectedApproval.status === 'approved' ? t('approved') : t('rejected')}
                  </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.15 }}>
                        {t('dueDate')}: {new Date(selectedApproval.due_date).toLocaleDateString('ko-KR')}
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
                  {t('requestContentSection')}
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
                          {t('approvalTitle')}
                        </TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {selectedApproval.title}
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
                          {t('detailedContent')}
                        </TableCell>
                        <TableCell sx={{ 
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5
                        }}>
                          <Typography variant="body2" sx={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.15
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
                          {t('approvalPriority')}
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
                {selectedApproval.files.length > 0 && (
                <Box sx={{ mb: 2.2 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1.5,
                    color: '#333',
                    borderLeft: '4px solid #1976d2',
                    pl: 1.5,
                    lineHeight: 1.15
                  }}>
                    {t('attachmentSection')}
                  </Typography>
                  
                  <Paper sx={{ p: 1.5, border: '1px solid #ddd', backgroundColor: '#fafafa' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.7, lineHeight: 1.15 }}>
                      {t('attachedFilesCount').replace('{count}', selectedApproval.files.length.toString())}
                    </Typography>
                    <List dense>
                      {selectedApproval.files.map((file) => (
                        <ListItem key={file.id} sx={{ py: 0.4, border: '1px solid #eee', mb: 0.8, borderRadius: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <AttachFileIcon sx={{ fontSize: '1rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.original_name}
                            secondary={`${formatFileSize(file.file_size)} • 업로드: ${file.uploader.username}`}
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
                  {t('confirmationSectionTitle')}
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
                          {t('categoryHeader')}
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
                          {t('nameHeader')}
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
                          {t('dateHeader')}
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
                          {t('confirmationHeader')}
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
                          {t('approvalRequester')}
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {selectedApproval.requester.username}
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
                          <Chip label={t('requestStatus')} color="info" size="small" />
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
                          {t('approvalApprover')}
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {selectedApproval.approver.username}
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5,
                          lineHeight: 1.15
                        }}>
                          {selectedApproval.status !== 'pending' 
                            ? new Date(selectedApproval.updated_at || selectedApproval.created_at).toLocaleDateString('ko-KR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell sx={{ 
                          textAlign: 'center',
                          border: '1px solid #ddd',
                          py: 1.0,
                          px: 1.5
                        }}>
                          <Chip 
                            label={selectedApproval.status === 'pending' ? t('approvalWaitingStatus') : 
                                   selectedApproval.status === 'approved' ? t('approved') : t('rejected')}
                            color={selectedApproval.status === 'pending' ? 'warning' : 
                                   selectedApproval.status === 'approved' ? 'success' : 'error'}
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                      {/* 재지정 이력 표시 */}
                      {comments.filter(c => c.comment && (c.comment.includes('재지정') || c.comment.includes('전달'))).map((reassignComment, index) => (
                        <TableRow key={`reassign-${index}`} sx={{ backgroundColor: '#f8f9fa' }}>
                          <TableCell sx={{ 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            border: '1px solid #ddd',
                            color: '#666',
                            py: 1.0,
                            px: 1.5,
                            lineHeight: 1.15
                          }}>
                            {t('reassignment')}
                          </TableCell>
                          <TableCell sx={{ 
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            color: '#666',
                            py: 1.0,
                            px: 1.5,
                            lineHeight: 1.15
                          }}>
                            {reassignComment.author?.username || t('unknown')}
                          </TableCell>
                          <TableCell sx={{ 
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            color: '#666',
                            py: 1.0,
                            px: 1.5,
                            lineHeight: 1.15
                          }}>
                            {new Date(reassignComment.created_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell sx={{ 
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            py: 1.0,
                            px: 1.5
                          }}>
                            <Chip 
                              label={t('reassignment')} 
                              color="info" 
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

                            {/* 코멘트 섹션 */}
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
                  {comments.length > 0 ? (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.7, lineHeight: 1.15 }}>
                        {t('processingHistoryCount').replace('{count}', comments.length.toString())}
                  </Typography>
                  <List dense>
                        {comments.map((c) => {
                          const isReassignment = c.comment && (c.comment.includes('재지정') || c.comment.includes('전달'));
                          return (
                            <ListItem key={c.id} sx={{ 
                              py: 0.8, 
                              alignItems: 'flex-start',
                              border: isReassignment ? '1px solid #ff9800' : '1px solid #eee', 
                              mb: 0.8, 
                              borderRadius: 1,
                              backgroundColor: isReassignment ? '#fff8e1' : '#fff'
                            }}>
                        <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem', lineHeight: 1.15 }}>
                                        {c.author?.username || t('unknown')}
                                      </Typography>
                                      {isReassignment && (
                                        <Chip 
                                          label={t('reassignment')} 
                                          size="small" 
                                          color="warning" 
                                          variant="outlined"
                                          sx={{ fontSize: '0.6rem', height: '20px' }}
                                        />
                                      )}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.15 }}>
                                      {new Date(c.created_at).toLocaleString('ko-KR')}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="body2" sx={{ 
                                    fontSize: '0.8rem', 
                                    whiteSpace: 'pre-wrap',
                                    mt: 0.4,
                                    color: isReassignment ? '#e65100' : '#555',
                                    fontWeight: isReassignment ? 'medium' : 'normal',
                                    lineHeight: 1.15
                                  }}>
                                    {c.comment}
                                  </Typography>
                                }
                        />
                      </ListItem>
                          );
                        })}
                  </List>
                    </Box>
                                    ) : (
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary', 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      py: 1.5,
                      lineHeight: 1.15
                    }}>
                      {t('noCommentsYet')}
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
                      placeholder={t('commentPlaceholder')}
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
                        {t('registerComment')}
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
                          ? t('approvalCompleted')
                          : t('approvalRejectedComment')
                        }
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* 재지정 섹션 - 승인자에게만 표시 */}
              {selectedApproval?.approver.username === currentUser?.username && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    mb: 2,
                    color: '#333',
                    borderLeft: '4px solid #ff9800',
                    pl: 2
                  }}>
                    5. {t('reassignApproval')}
                  </Typography>
                  
                  <Paper sx={{ p: 3, border: '1px solid #ddd', backgroundColor: '#fff8e1' }}>
                    <Typography variant="body2" sx={{ mb: 2, color: '#e65100' }}>
                      {t('reassignToAnotherApprover')}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={filteredUsers}
                        getOptionLabel={(option) => `${option.username} (${option.userid})`}
                        value={filteredUsers.find(user => user.id.toString() === reassignUserId) || null}
                        onChange={(event, newValue) => {
                          console.log('🔄 재배정 사용자 선택:', newValue);
                          setReassignUserId(newValue ? newValue.id.toString() : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('newApprover')}
                            size="small"
                              placeholder={t('selectNewApprover')}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { 
                                  fontSize: '0.85rem',
                                  backgroundColor: '#fff'
                                }
                            }}
                          />
                        )}
                        noOptionsText={t('noAvailableApprovers')}
                        size="small"
                        fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField 
                          value={reassignNote} 
                          onChange={(e) => setReassignNote(e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReassign();
                            }
                          }}
                          label={t('reassignReason')}
                          placeholder={t('reassignReasonPlaceholder')} 
                          fullWidth 
                          size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': { 
                              fontSize: '0.85rem',
                              backgroundColor: '#fff'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                        <Button 
                          variant="outlined" 
                          onClick={handleReassign}
                          disabled={!reassignUserId}
                          sx={{ 
                            textTransform: 'none',
                            color: '#e65100',
                            borderColor: '#e65100',
                            '&:hover': {
                              backgroundColor: '#fff3e0',
                              borderColor: '#e65100'
                            }
                          }}
                        >
                          {t('performReassign')}
                      </Button>
                    </Grid>
                  </Grid>
                  </Paper>
            </Box>
          )}

              {/* 하단 승인/거부 버튼 */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2,
                pt: 3,
                borderTop: '1px solid #eee'
              }}>
                {selectedApproval?.status === 'pending' && 
                 selectedApproval?.approver.username === currentUser?.username && (
            <>
              <Button
                onClick={() => handleStatusChange(selectedApproval.id, 'rejected')}
                startIcon={<CancelIcon />}
                      variant="outlined"
                color="error"
                      size="large"
                      sx={{ 
                        fontSize: '1rem', 
                        textTransform: 'none',
                        minWidth: '120px',
                        py: 1
                      }}
              >
                {t('rejectRequest')}
              </Button>
              <Button
                onClick={() => handleStatusChange(selectedApproval.id, 'approved')}
                startIcon={<CheckCircleIcon />}
                      variant="contained"
                color="success"
                      size="large"
                      sx={{ 
                        fontSize: '1rem', 
                        textTransform: 'none',
                        minWidth: '120px',
                        py: 1
                      }}
              >
                {t('approveRequest')}
              </Button>
            </>
          )}
                <Button 
                  onClick={() => setViewDialogOpen(false)}
                  variant="outlined"
                  size="large"
                  sx={{ 
                    fontSize: '1rem', 
                    textTransform: 'none',
                    minWidth: '120px',
                    py: 1
                  }}
                >
            {t('close')}
          </Button>
              </Box>
            </>
          )}
        </Box>
      </Dialog>

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
    </Box>
  );
};

export default ApprovalPage; 