import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
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
  const location = useLocation();
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
  const [filterType, setFilterType] = useState<'all' | 'requested' | 'received'>('requested');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // URL 파라미터에서 type 확인하여 필터 설정
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type');
    if (type === 'received' || type === 'requested') {
      setFilterType(type);
    }
  }, [location.search]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    approver_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
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
      if (filterType !== 'all') params.append('type', filterType);
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
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('approver_id', formData.approver_id);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('due_date', formData.due_date);

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
        setSnackbar({ open: true, message: '승인자를 재지정했습니다.', severity: 'success' });
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
      due_date: '',
    });
    setSelectedFiles([]);
  };

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
      case 'pending': return '대기중';
      case 'approved': return '승인';
      case 'rejected': return '거부';
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
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
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
            전자 결제
          </Typography>
        </Box>
        {!!approvalMenuPermission.can_create && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { fetchUsers(); setDialogOpen(true); }}
            sx={{ fontSize: '0.8rem', textTransform: 'none', boxShadow: 'none', borderRadius: 2, py: 0.8, px: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}
          >
            결제요청
          </Button>
        )}
      </Box>

      {/* 필터 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>구분</InputLabel>
              <Select
                value={filterType}
                label="구분"
                onChange={(e: SelectChangeEvent) => setFilterType(e.target.value as any)}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>전체</MenuItem>
                <MenuItem value="requested" sx={{ fontSize: '0.8rem' }}>요청한 결제</MenuItem>
                <MenuItem value="received" sx={{ fontSize: '0.8rem' }}>받은 결제</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>상태</InputLabel>
              <Select
                value={filterStatus}
                label="상태"
                onChange={(e: SelectChangeEvent) => setFilterStatus(e.target.value as any)}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>전체</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: '0.8rem' }}>대기중</MenuItem>
                <MenuItem value="approved" sx={{ fontSize: '0.8rem' }}>승인</MenuItem>
                <MenuItem value="rejected" sx={{ fontSize: '0.8rem' }}>거부</MenuItem>
              </Select>
            </FormControl>
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
                <TableCell sx={{ pl: 1.2, py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  제목
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  요청자
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  승인자
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  우선순위
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  상태
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  마감일
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  첨부파일
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvals.map((approval) => (
                <TableRow 
                  key={approval.id} 
                  onClick={() => handleViewApproval(approval)}
                  sx={{ 
                    '&:hover': { backgroundColor: '#f8fafc' }, 
                    cursor: 'pointer' 
                  }}
                >
                  <TableCell sx={{ pl: 1.2, py: 0.5, fontSize: '0.8rem', border: 0 }}>
                    {approval.title}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.8rem', border: 0 }}>
                    {approval.requester.username}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.8rem', border: 0 }}>
                    {approval.approver.username}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, border: 0 }}>
                    <Chip
                      label={getPriorityText(approval.priority)}
                      color={getPriorityColor(approval.priority) as any}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, border: 0 }}>
                    <Chip
                      label={getStatusText(approval.status)}
                      color={getStatusColor(approval.status) as any}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.8rem', border: 0 }}>
                    {new Date(approval.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.8rem', border: 0 }}>
                    {approval.files.length > 0 ? (
                      <Chip
                        icon={<AttachFileIcon />}
                        label={approval.files.length}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, border: 0 }}>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 결제 요청 생성 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          결제 요청
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                    label="승인자"
                    size="small"
                    placeholder="승인자를 검색하세요..."
                    sx={{ 
                      '& .MuiOutlinedInput-root': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                    }}
                  />
                )}
                noOptionsText="승인 가능한 사용자가 없습니다"
                size="small"
                fullWidth
                sx={{
                  '& .MuiAutocomplete-option': {
                    fontSize: '0.8rem',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>우선순위</InputLabel>
                <Select
                  value={formData.priority}
                  label="우선순위"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="low" sx={{ fontSize: '0.8rem' }}>낮음</MenuItem>
                  <MenuItem value="medium" sx={{ fontSize: '0.8rem' }}>보통</MenuItem>
                  <MenuItem value="high" sx={{ fontSize: '0.8rem' }}>높음</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="마감일"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="내용"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                fullWidth
                multiline
                rows={4}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12}>
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
                  sx={{ fontSize: '0.8rem', textTransform: 'none' }}
                >
                  파일 첨부
                </Button>
              </label>
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                      size="small"
                      sx={{ mr: 1, mb: 1, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontSize: '0.8rem', textTransform: 'none' }}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.content || !formData.approver_id || !formData.due_date}
            sx={{ fontSize: '0.8rem', textTransform: 'none' }}
          >
            요청
          </Button>
        </DialogActions>
      </Dialog>

      {/* 결제 요청 상세 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          결제 요청 상세
        </DialogTitle>
        <DialogContent>
          {selectedApproval && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 1 }}>
                    {selectedApproval.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    요청자: {selectedApproval.requester.username}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    승인자: {selectedApproval.approver.username}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    우선순위: {getPriorityText(selectedApproval.priority)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    마감일: {new Date(selectedApproval.due_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {selectedApproval.content}
                  </Typography>
                </Grid>
                {selectedApproval.files.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                      첨부파일
                    </Typography>
                    <List dense>
                      {selectedApproval.files.map((file) => (
                        <ListItem key={file.id} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <AttachFileIcon sx={{ fontSize: '1rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.original_name}
                            secondary={`${formatFileSize(file.file_size)} • ${file.uploader.username}`}
                            sx={{
                              '& .MuiListItemText-primary': { fontSize: '0.8rem' },
                              '& .MuiListItemText-secondary': { fontSize: '0.7rem' }
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleFileDownload(file.id, file.original_name)}
                          >
                            <DownloadIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}

                {/* 코멘트 */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                    코멘트
                  </Typography>
                  <List dense>
                    {comments.map((c) => (
                      <ListItem key={c.id} sx={{ py: 0.5, alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={`${c.author?.username || '사용자'} · ${new Date(c.created_at).toLocaleString()}`}
                          secondary={c.comment}
                          sx={{ '& .MuiListItemText-primary': { fontSize: '0.72rem' }, '& .MuiListItemText-secondary': { fontSize: '0.78rem', whiteSpace: 'pre-wrap' } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
                      size="small"
                      fullWidth
                      multiline
                      maxRows={3}
                    />
                    <Button variant="contained" onClick={handleAddComment} sx={{ textTransform: 'none' }}>등록</Button>
                  </Box>
                </Grid>

                {/* 재지정 */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                    다른 승인자에게 다시 전달
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={5}>
                      <Autocomplete
                        options={filteredUsers}
                        getOptionLabel={(option) => `${option.username} (${option.userid})`}
                        value={filteredUsers.find(user => user.id.toString() === reassignUserId) || null}
                        onChange={(event, newValue) => {
                          console.log('🔄 재배정 사용자 선택:', newValue);
                          setReassignUserId(newValue ? newValue.id.toString() : '');
                        }}
                        onOpen={() => {
                          console.log('📋 재배정 드롭다운 열림 - 사용 가능한 옵션:', filteredUsers);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="새 승인자"
                            size="small"
                            placeholder="새 승인자를 검색하세요..."
                            sx={{ 
                              '& .MuiOutlinedInput-root': { fontSize: '0.8rem' },
                              '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                            }}
                          />
                        )}
                        noOptionsText="승인 가능한 사용자가 없습니다"
                        size="small"
                        fullWidth
                        sx={{
                          '& .MuiAutocomplete-option': {
                            fontSize: '0.8rem',
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={7}>
                      <TextField value={reassignNote} onChange={(e) => setReassignNote(e.target.value)} placeholder="메모 (선택)" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="outlined" onClick={handleReassign} sx={{ textTransform: 'none' }}>
                        다시 전달
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedApproval?.status === 'pending' && (
            <>
              <Button
                onClick={() => handleStatusChange(selectedApproval.id, 'rejected')}
                startIcon={<CancelIcon />}
                color="error"
                sx={{ fontSize: '0.8rem', textTransform: 'none' }}
              >
                거부
              </Button>
              <Button
                onClick={() => handleStatusChange(selectedApproval.id, 'approved')}
                startIcon={<CheckCircleIcon />}
                color="success"
                sx={{ fontSize: '0.8rem', textTransform: 'none' }}
              >
                승인
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialogOpen(false)} sx={{ fontSize: '0.8rem', textTransform: 'none' }}>
            닫기
          </Button>
        </DialogActions>
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