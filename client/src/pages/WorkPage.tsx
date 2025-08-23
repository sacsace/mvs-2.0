import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  Autocomplete,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  BugReport as BugIcon,
  Assignment as FeatureIcon,
  Build as BuildIcon,

  KeyboardArrowUp,
  KeyboardArrowDown,
  Comment as CommentIcon,
} from '@mui/icons-material';
import axios from 'axios';


// 상수 정의
const TITLE_MAX_LENGTH = 50; // 업무 제목 최대 표시 길이

// 긴 텍스트를 자르는 유틸리티 함수
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

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
  attachments?: WorkAttachment[];
  comments?: WorkComment[];
}

interface WorkAttachment {
  id: number;
  original_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface WorkComment {
  id: number;
  content: string;
  created_at: string;
  author: {
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
}

const WorkPage: React.FC = () => {
  const { t } = useLanguage();

  
  const [works, setWorks] = useState<Work[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignerFilter, setAssignerFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  
  // 정렬 상태
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    category: 'general' as 'general' | 'project' | 'meeting' | 'report' | 'planning' | 'review',
    assignee_id: '',
    start_date: '',
    due_date: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // 삭제 확인 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<Work | null>(null);

  // 통계 데이터 계산
  const getWorkStats = () => {
    const total = works.length;
    const pending = works.filter(w => w.status === 'pending').length;
    const inProgress = works.filter(w => w.status === 'in_progress').length;
    const completed = works.filter(w => w.status === 'completed').length;
    const urgent = works.filter(w => w.priority === 'urgent').length;
    
    return { total, pending, inProgress, completed, urgent };
  };

  useEffect(() => {
    const initializeData = async () => {
      // 1. 현재 사용자 먼저 로드
      await fetchCurrentUser();
      
      // 2. 현재 사용자 정보를 바탕으로 사용자 목록 로드
      await fetchUsers();
      
      // 3. 업무 목록 로드
    fetchWorks();
    };
    
    initializeData();
    
    // 기본 날짜 설정 (오늘과 내일)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    setFormData(prev => ({
      ...prev,
      start_date: today.toISOString().split('T')[0], // 오늘
      due_date: tomorrow.toISOString().split('T')[0], // 내일
    }));
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const user = response.data.user;
        setCurrentUser(user);
        console.log('👤 현재 사용자 로드됨:', user);
        return user;
      }
    } catch (error) {
      console.error('현재 사용자 조회 오류:', error);
    }
    return null;
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      // 같은 회사 사용자 목록을 가져옵니다
      const response = await axios.get('/api/approval/users/company', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('👥 사용자 목록 응답:', response.data);

      if (response.data.success) {
        const allUsers = response.data.data;
        console.log('📋 로드된 사용자 목록:', allUsers);
        
        // 현재 사용자 제외하고 역할별로 정렬
        const filteredUsers = allUsers
          .filter((user: User) => user.id !== currentUser?.id)
          .sort((a: User, b: User) => {
            // 역할 우선순위: admin > user
            const roleOrder = { 'admin': 1, 'user': 2, 'root': 0 };
            const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 3;
            const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 3;
            
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.username.localeCompare(b.username);
          });
          
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      // 임시 테스트 데이터 (현재 사용자 제외)
      const testUsers = [
        { id: 1, username: '김부장', userid: 'manager1', role: 'admin' },
        { id: 2, username: '이대리', userid: 'emp1', role: 'user' },
        { id: 3, username: '박과장', userid: 'manager2', role: 'admin' },
        { id: 4, username: '정주임', userid: 'emp2', role: 'user' },
        { id: 5, username: '최팀장', userid: 'manager3', role: 'admin' },
        { id: 6, username: '홍사원', userid: 'emp3', role: 'user' },
      ].filter(user => user.id !== currentUser?.id);
      
      setUsers(testUsers);
    }
  };

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/works', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setWorks(response.data.data);
      }
    } catch (error) {
      console.error('업무 목록 조회 오류:', error);
      setSnackbar({
        open: true,
        message: '업무 목록을 불러오는데 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (workId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/works/${workId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('코멘트 조회 오류:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        assignee_id: formData.assignee_id || null,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
      };

      if (isEditing && selectedWork) {
        const response = await axios.put(`/api/works/${selectedWork.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setSnackbar({
            open: true,
            message: '업무가 수정되었습니다.',
            severity: 'success',
          });
        }
      } else {
        const response = await axios.post('/api/works', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setSnackbar({
            open: true,
            message: '업무가 지시되었습니다.',
            severity: 'success',
          });
        }
      }

      setDialogOpen(false);
      resetForm();
      fetchWorks();
    } catch (error) {
      console.error('업무 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '업무 저장에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleStatusChange = async (workId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/works/${workId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: '업무 상태가 변경되었습니다.',
          severity: 'success',
        });
        fetchWorks();
        if (viewDialogOpen) {
          const updatedWork = { ...selectedWork, status: newStatus } as Work;
          setSelectedWork(updatedWork);
        }
      }
    } catch (error) {
      console.error('업무 상태 변경 오류:', error);
      setSnackbar({
        open: true,
        message: '업무 상태 변경에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const openDeleteDialog = (work: Work) => {
    setWorkToDelete(work);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!workToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/works/${workToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: '업무가 삭제되었습니다.',
          severity: 'success',
        });
        fetchWorks();
        if (viewDialogOpen) {
          setViewDialogOpen(false);
        }
        setDeleteDialogOpen(false);
        setWorkToDelete(null);
      }
    } catch (error) {
      console.error('업무 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: '업무 삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedWork) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/works/${selectedWork.id}/comments`, 
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNewComment('');
        fetchComments(selectedWork.id);
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

  const resetForm = () => {
    // 기본 날짜 설정 (오늘과 내일)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    setFormData({
      title: '',
      description: '',
      priority: 'normal',
      category: 'general',
      assignee_id: '',
      start_date: today.toISOString().split('T')[0], // 오늘
      due_date: tomorrow.toISOString().split('T')[0], // 내일
    });
    setIsEditing(false);
    setSelectedWork(null);
    setSelectedFiles([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (work: Work) => {
    setFormData({
      title: work.title,
      description: work.description,
      priority: work.priority,
      category: work.category,
      assignee_id: work.assignee?.id.toString() || '',
      start_date: work.start_date ? work.start_date.split('T')[0] : '',
      due_date: work.due_date ? work.due_date.split('T')[0] : '',
    });
    setSelectedWork(work);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const openViewDialog = (work: Work) => {
    setSelectedWork(work);
    setViewDialogOpen(true);
    fetchComments(work.id);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <KeyboardArrowUp /> : <KeyboardArrowDown />;
  };

  // 필터링 및 정렬된 업무 목록
  const filteredAndSortedWorks = (() => {
    let filtered = works.filter(work => {
      const statusMatch = statusFilter === 'all' || work.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || work.priority === priorityFilter;
      const categoryMatch = categoryFilter === 'all' || work.category === categoryFilter;
      const assignerMatch = assignerFilter === 'all' || work.assigner.id.toString() === assignerFilter;
      const assigneeMatch = assigneeFilter === 'all' || 
        (assigneeFilter === 'unassigned' ? !work.assignee : 
         work.assignee && work.assignee.id.toString() === assigneeFilter);
      return statusMatch && priorityMatch && categoryMatch && assignerMatch && assigneeMatch;
    });

    return filtered.sort((a, b) => {
      const aVal = a[sortField as keyof Work];
      const bVal = b[sortField as keyof Work];
      
      // undefined 체크
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project': return <FeatureIcon />;
      case 'meeting': return <CommentIcon />;
      case 'report': return <BugIcon />;
      case 'planning': return <BuildIcon />;
      case 'review': return <VisibilityIcon />;
      case 'general':
      default: return <BuildIcon />;
    }
  };

    return (
      <>
        <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
        {/* 페이지 헤더 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                       <Box sx={{
              width: '0.85rem',
              height: '0.85rem',
              borderRadius: '4px',
              background: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              color: 'white'
            }}>
              📋
            </Box>
           <Typography variant="h6" component="h1" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
             {t('workManagement')}
           </Typography>
         </Box>
         <Button
           variant="contained"
           startIcon={<AddIcon />}
           onClick={openCreateDialog}
           sx={{ fontSize: '0.8rem', textTransform: 'none', boxShadow: 'none', borderRadius: 2, py: 0.8, px: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}
         >
           + {t('workCreate')}
         </Button>
       </Box>

             {/* 통계 대시보드 */}
       <Card sx={{ mb: 3, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
         <CardContent sx={{ p: 2 }}>
           <Grid container spacing={1.5}>
             <Grid item xs={12} sm={6} md={2.4}>
               <Box sx={{ 
                 display: 'flex', 
                 flexDirection: 'column', 
                 alignItems: 'center',
                 textAlign: 'center',
                 p: 1.5
               }}>
                 <Typography variant="h4" sx={{ 
                   fontSize: '1.5rem',
                   fontWeight: 600,
                   mb: 0.5,
                   color: '#1976d2'
                 }}>
                   {getWorkStats().total}
                 </Typography>
                 <Typography variant="body2" sx={{ 
                   fontSize: '0.7rem',
                   color: '#666',
                   fontWeight: 500
                 }}>
                   전체 업무
                 </Typography>
               </Box>
             </Grid>
                     <Grid item xs={12} sm={6} md={2.4}>
             <Box sx={{ 
               display: 'flex', 
               flexDirection: 'column', 
               alignItems: 'center',
               textAlign: 'center',
               p: 1.5
             }}>
               <Typography variant="h4" sx={{ 
                 fontSize: '1.5rem',
                 fontWeight: 600,
                 mb: 0.5,
                 color: '#1976d2'
               }}>
                 {getWorkStats().pending}
               </Typography>
               <Typography variant="body2" sx={{ 
                 fontSize: '0.7rem',
                 color: '#666',
                 fontWeight: 500
               }}>
                 대기 중
               </Typography>
             </Box>
           </Grid>
                     <Grid item xs={12} sm={6} md={2.4}>
             <Box sx={{ 
               display: 'flex', 
               flexDirection: 'column', 
               alignItems: 'center',
               textAlign: 'center',
               p: 1.5
             }}>
               <Typography variant="h4" sx={{ 
                 fontSize: '1.5rem',
                 fontWeight: 600,
                 mb: 0.5,
                 color: '#1976d2'
               }}>
                 {getWorkStats().inProgress}
               </Typography>
               <Typography variant="body2" sx={{ 
                 fontSize: '0.7rem',
                 color: '#666',
                 fontWeight: 500
               }}>
                 진행 중
               </Typography>
             </Box>
           </Grid>
                     <Grid item xs={12} sm={6} md={2.4}>
             <Box sx={{ 
               display: 'flex', 
               flexDirection: 'column', 
               alignItems: 'center',
               textAlign: 'center',
               p: 1.5
             }}>
               <Typography variant="h4" sx={{ 
                 fontSize: '1.5rem',
                 fontWeight: 600,
                 mb: 0.5,
                 color: '#1976d2'
               }}>
                 {getWorkStats().completed}
               </Typography>
               <Typography variant="body2" sx={{ 
                 fontSize: '0.7rem',
                 color: '#666',
                 fontWeight: 500
               }}>
                 완료
               </Typography>
             </Box>
           </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
             <Box sx={{ 
               display: 'flex', 
               flexDirection: 'column', 
               alignItems: 'center',
               textAlign: 'center',
               p: 1.5
             }}>
               <Typography variant="h4" sx={{ 
                 fontSize: '1.5rem',
                 fontWeight: 600,
                 mb: 0.5,
                 color: '#1976d2'
               }}>
                 {getWorkStats().urgent}
               </Typography>
               <Typography variant="body2" sx={{ 
                 fontSize: '0.7rem',
                 color: '#666',
                 fontWeight: 500
               }}>
                 긴급
               </Typography>
             </Box>
           </Grid>
         </Grid>
       </CardContent>
     </Card>

             {/* 필터 및 검색 섹션 */}
       <Card sx={{ mb: 3, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
         <CardContent sx={{ p: 2 }}>
           <Typography variant="body2" sx={{ 
             mb: 2, 
             fontWeight: 500, 
             color: '#666',
             fontSize: '0.75rem',
             display: 'flex',
             alignItems: 'center',
             gap: 1
           }}>
             🔍 업무 검색 및 필터
           </Typography>
                                           <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>상태별</InputLabel>
                <Select
                  value={statusFilter}
                  label="상태별"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ fontSize: '0.8rem' }}
                >
                 <MenuItem value="all">전체</MenuItem>
                 <MenuItem value="pending">대기 중</MenuItem>
                 <MenuItem value="accepted">수락됨</MenuItem>
                 <MenuItem value="in_progress">진행 중</MenuItem>
                 <MenuItem value="completed">완료</MenuItem>
                 <MenuItem value="rejected">거부됨</MenuItem>
               </Select>
             </FormControl>

                          <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>우선순위</InputLabel>
                <Select
                  value={priorityFilter}
                  label="우선순위"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  sx={{ fontSize: '0.8rem' }}
                >
                 <MenuItem value="all">전체</MenuItem>
                 <MenuItem value="low">낮음</MenuItem>
                 <MenuItem value="normal">보통</MenuItem>
                 <MenuItem value="high">높음</MenuItem>
                 <MenuItem value="urgent">긴급</MenuItem>
               </Select>
             </FormControl>

                          <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>카테고리</InputLabel>
                <Select
                  value={categoryFilter}
                  label="카테고리"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{ fontSize: '0.8rem' }}
                >
                 <MenuItem value="all">전체</MenuItem>
                 <MenuItem value="general">일반</MenuItem>
                 <MenuItem value="project">프로젝트</MenuItem>
                 <MenuItem value="meeting">회의</MenuItem>
                 <MenuItem value="report">보고서</MenuItem>
                 <MenuItem value="planning">기획</MenuItem>
                 <MenuItem value="review">검토</MenuItem>
               </Select>
             </FormControl>

                          <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>지시자</InputLabel>
                <Select
                  value={assignerFilter}
                  label="지시자"
                  onChange={(e) => setAssignerFilter(e.target.value)}
                  sx={{ fontSize: '0.8rem' }}
                >
                 <MenuItem value="all">전체</MenuItem>
                 {users.map((user) => (
                   <MenuItem key={user.id} value={user.id.toString()}>
                     {user.username}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>

                          <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>수행자</InputLabel>
                <Select
                  value={assigneeFilter}
                  label="수행자"
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  sx={{ fontSize: '0.8rem' }}
                >
                 <MenuItem value="all">전체</MenuItem>
                 <MenuItem value="unassigned">미지정</MenuItem>
                 {users.map((user) => (
                   <MenuItem key={user.id} value={user.id.toString()}>
                     {user.username}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>

                           <Button
                             variant="outlined"
                             size="small"
                             onClick={() => {
                               setStatusFilter('all');
                               setPriorityFilter('all');
                               setCategoryFilter('all');
                               setAssignerFilter('all');
                               setAssigneeFilter('all');
                             }}
                             sx={{ 
                               fontSize: '0.75rem',
                               textTransform: 'none',
                               borderColor: '#d1d5db',
                               color: '#6b7280',
                               '&:hover': {
                                 borderColor: '#1976d2',
                                 color: '#1976d2'
                               }
                             }}
                           >
                             필터 초기화
                           </Button>
           </Box>
        </CardContent>
      </Card>

      {/* 업무 목록 */}
       <Card sx={{ mb: 3, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc', overflow: 'hidden' }}>
         <Box sx={{ 
           p: 2, 
           background: '#f8fafc',
           color: '#374151',
           borderBottom: '1px solid #e5e7eb'
         }}>
           <Typography variant="body2" sx={{ 
             fontWeight: 500, 
             display: 'flex', 
             alignItems: 'center', 
             gap: 1, 
             fontSize: '0.75rem'
           }}>
             📊 업무 목록 ({filteredAndSortedWorks.length}건)
           </Typography>
         </Box>
        
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress size={60} />
        </Box>
      ) : (
          <TableContainer>
          <Table>
                         <TableHead>
                 <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                 <TableCell 
                   onClick={() => handleSort('category')}
                     sx={{ 
                       cursor: 'pointer', 
                       fontWeight: 600,
                       color: '#374151',
                       fontSize: '0.75rem',
                       borderBottom: '1px solid #e5e7eb',
                       py: 1.5
                     }}
                   >
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                       카테고리
                     {renderSortIcon('category')}
                   </Box>
                 </TableCell>
                                 <TableCell 
                   onClick={() => handleSort('title')}
                     sx={{ 
                       cursor: 'pointer', 
                       fontWeight: 600,
                       color: '#374151',
                       fontSize: '0.75rem',
                       borderBottom: '1px solid #e5e7eb',
                       py: 1.5
                     }}
                   >
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                       업무 제목
                     {renderSortIcon('title')}
                   </Box>
                 </TableCell>
                   <TableCell sx={{ 
                     fontWeight: 600,
                     color: '#374151',
                     fontSize: '0.75rem',
                     borderBottom: '1px solid #e5e7eb',
                     py: 1.5
                   }}>
                     지시자
                 </TableCell>
                   <TableCell sx={{ 
                     fontWeight: 600,
                     color: '#374151',
                     fontSize: '0.75rem',
                     borderBottom: '1px solid #e5e7eb',
                     py: 1.5
                   }}>
                     수행자
                 </TableCell>
                                 <TableCell 
                   onClick={() => handleSort('priority')}
                     sx={{ 
                       cursor: 'pointer', 
                       fontWeight: 600,
                       color: '#374151',
                       fontSize: '0.75rem',
                       borderBottom: '1px solid #e5e7eb',
                       py: 1.5
                     }}
                   >
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                       우선순위
                     {renderSortIcon('priority')}
                   </Box>
                 </TableCell>
                 <TableCell 
                   onClick={() => handleSort('status')}
                     sx={{ 
                       cursor: 'pointer', 
                       fontWeight: 600,
                       color: '#374151',
                       fontSize: '0.75rem',
                       borderBottom: '1px solid #e5e7eb',
                       py: 1.5
                     }}
                   >
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                       상태
                     {renderSortIcon('status')}
                   </Box>
                 </TableCell>
                 <TableCell 
                   onClick={() => handleSort('due_date')}
                     sx={{ 
                       cursor: 'pointer', 
                       fontWeight: 600,
                       color: '#374151',
                       fontSize: '0.75rem',
                       borderBottom: '1px solid #e5e7eb',
                       py: 1.5
                     }}
                   >
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                       완료 예정일
                     {renderSortIcon('due_date')}
                   </Box>
                 </TableCell>
                   <TableCell sx={{ 
                     fontWeight: 600,
                     color: '#374151',
                     fontSize: '0.75rem',
                     borderBottom: '1px solid #e5e7eb',
                     textAlign: 'center',
                     py: 1.5
                   }}>
                     작업
                 </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                              {filteredAndSortedWorks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Box sx={{ 
                          fontSize: '48px', 
                          color: '#9ca3af', 
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          📋
                        </Box>
                                                 <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem', color: '#666' }}>
                           등록된 업무가 없습니다
                         </Typography>
                         <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', color: '#999' }}>
                           새로운 업무를 생성해보세요
                         </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                filteredAndSortedWorks.map((work) => (
                  <TableRow key={work.id} hover sx={{ 
                    '&:hover': { 
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.15s ease'
                    },
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                                        <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                      <Chip 
                        label={t(`work${work.category.charAt(0).toUpperCase() + work.category.slice(1)}` as keyof typeof t)} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderRadius: '4px',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          borderColor: '#d1d5db',
                          color: '#6b7280',
                          backgroundColor: '#f9fafb'
                        }}
                      />
                    </TableCell>
                                         <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                       <Typography 
                         variant="body2" 
                         sx={{ 
                           fontWeight: 600,
                           fontSize: '0.8rem',
                           cursor: 'pointer',
                           color: '#374151',
                           '&:hover': { 
                             textDecoration: 'underline',
                             color: '#1976d2'
                           },
                           transition: 'color 0.2s ease'
                         }}
                         onClick={() => openViewDialog(work)}
                         title={work.title}
                       >
                         {truncateText(work.title, TITLE_MAX_LENGTH)}
                       </Typography>
                     </TableCell>
                                        <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: '50%', 
                          backgroundColor: '#e8f5e8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#2e7d32'
                        }}>
                          {work.assigner.username.charAt(0)}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#374151' }}>
                          {work.assigner.username}
                        </Typography>
                      </Box>
                    </TableCell>
                                         <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                       {work.assignee ? (
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <Box sx={{ 
                             width: 28, 
                             height: 28, 
                             borderRadius: '50%', 
                             backgroundColor: '#fff3e0',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             fontSize: '0.75rem',
                             fontWeight: 600,
                             color: '#f57c00'
                           }}>
                             {work.assignee.username.charAt(0)}
                           </Box>
                           <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#374151' }}>
                             {work.assignee.username}
                           </Typography>
                         </Box>
                       ) : (
                         <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', color: '#6b7280' }}>
                           미지정
                         </Typography>
                       )}
                     </TableCell>
                                         <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                       <Chip 
                         label={t(`work${work.priority.charAt(0).toUpperCase() + work.priority.slice(1)}` as keyof typeof t)} 
                         color={getPriorityColor(work.priority) as any}
                         size="small"
                         sx={{ 
                           borderRadius: '4px',
                           fontWeight: 600,
                           fontSize: '0.75rem'
                         }}
                       />
                     </TableCell>
                     <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                       <Chip 
                         label={t(`work${work.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}` as keyof typeof t)} 
                         color={getStatusColor(work.status) as any}
                         size="small"
                         sx={{ 
                           borderRadius: '4px',
                           fontWeight: 600,
                           fontSize: '0.75rem'
                         }}
                       />
                     </TableCell>
                                         <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                       <Box sx={{ 
                         display: 'flex', 
                         flexDirection: 'column', 
                         alignItems: 'center',
                         gap: 0.5
                       }}>
                         <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                           {work.due_date ? new Date(work.due_date).toLocaleDateString('ko-KR') : '-'}
                         </Typography>
                         {work.due_date && (
                           <Typography variant="caption" color="text.secondary" sx={{ color: '#6b7280' }}>
                             {(() => {
                               const dueDate = new Date(work.due_date);
                               const today = new Date();
                               const diffTime = dueDate.getTime() - today.getTime();
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                               
                               if (diffDays < 0) return '기한 초과';
                               if (diffDays === 0) return '오늘 마감';
                               if (diffDays <= 3) return `${diffDays}일 남음`;
                               return '';
                             })()}
                           </Typography>
                         )}
                       </Box>
                     </TableCell>
                     <TableCell sx={{ py: 2, borderBottom: '1px solid #e5e7eb' }}>
                       <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {/* 업무 수락/거부 버튼 (수행자만) */}
                        {work.status === 'pending' && work.assignee?.id === currentUser?.id && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleStatusChange(work.id, 'accepted')}
                              sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                            >
                              {t('workAccept')}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleStatusChange(work.id, 'rejected')}
                              sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                            >
                              {t('workReject')}
                            </Button>
                          </>
                        )}
                        
                                                 <Button
                           size="small"
                           variant="outlined"
                           startIcon={<VisibilityIcon />}
                           onClick={() => openViewDialog(work)}
                           sx={{ 
                             fontSize: '0.75rem',
                             py: 0.5,
                             px: 1,
                             borderRadius: '6px',
                             borderColor: '#d1d5db',
                             color: '#6b7280',
                             '&:hover': {
                               borderColor: '#1976d2',
                               backgroundColor: '#f0f9ff',
                               color: '#1976d2'
                             },
                             transition: 'all 0.2s ease'
                           }}
                         >
                           보기
                         </Button>
                        
                        {(work.assignee?.id === currentUser?.id || work.assigner.id === currentUser?.id) && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => openEditDialog(work)}
                            sx={{ 
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1,
                              borderRadius: '6px',
                              borderColor: '#d1d5db',
                              color: '#6b7280',
                              '&:hover': {
                                borderColor: '#10b981',
                                backgroundColor: '#f0fdf4',
                                color: '#10b981'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            수정
                          </Button>
                        )}
                        
                        {work.assigner.id === currentUser?.id && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => openDeleteDialog(work)}
                            sx={{ 
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1,
                              borderRadius: '6px',
                              borderColor: '#d1d5db',
                              color: '#6b7280',
                              '&:hover': {
                                borderColor: '#ef4444',
                                backgroundColor: '#fef2f2',
                                color: '#ef4444'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            삭제
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
        </Card>
      </Box>

      {/* 업무 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#191f28' }}>
          {isEditing ? t('workEdit') : t('workCreate')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label={t('workTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            
            <TextField
              fullWidth
              label={t('workDescription')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={4}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('workPriority')}</InputLabel>
                  <Select
                    value={formData.priority}
                    label={t('workPriority')}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <MenuItem value="low">{t('workLow')}</MenuItem>
                    <MenuItem value="normal">{t('workNormal')}</MenuItem>
                    <MenuItem value="high">{t('workHigh')}</MenuItem>
                    <MenuItem value="urgent">{t('workUrgent')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('workCategory')}</InputLabel>
                  <Select
                    value={formData.category}
                    label={t('workCategory')}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <MenuItem value="general">{t('workGeneral')}</MenuItem>
                    <MenuItem value="project">{t('workProject')}</MenuItem>
                    <MenuItem value="meeting">{t('workMeeting')}</MenuItem>
                    <MenuItem value="report">{t('workReport')}</MenuItem>
                    <MenuItem value="planning">{t('workPlanning')}</MenuItem>
                    <MenuItem value="review">{t('workReview')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(option) => `${option.username} - ${option.role}`}
                  value={users.find(user => user.id.toString() === formData.assignee_id) || null}
                  onChange={(event, newValue) => {
                    console.log('🎯 수행자 선택:', newValue);
                    setFormData({ ...formData, assignee_id: newValue ? newValue.id.toString() : '' });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('workAssignee')}
                      placeholder="수행자를 선택하세요"
                      required
                      helperText={`총 ${users.length}명의 사용자가 있습니다`}
                    />
                  )}
                  noOptionsText="사용 가능한 사용자가 없습니다"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('workStartDate')}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="기본값: 오늘 날짜"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              type="date"
              label={t('workDueDate')}
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              helperText="기본값: 내일 날짜 (필수)"
            />

            {/* 파일 첨부 섹션 */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('workAttachments')}
              </Typography>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFiles(Array.from(e.target.files));
                  }
                }}
                style={{ marginBottom: '10px' }}
              />
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    선택된 파일: {selectedFiles.map(f => f.name).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.description || !formData.assignee_id || !formData.due_date}
          >
            {isEditing ? t('save') : t('workCreate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 업무 상세 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        {selectedWork && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getCategoryIcon(selectedWork.category)}
                <Typography variant="h6">
                  {selectedWork.title}
                </Typography>
                <Chip 
                  label={t(`work${selectedWork.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}` as keyof typeof t)} 
                  color={getStatusColor(selectedWork.status) as any}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {t('workDescription')}
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedWork.description}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* 첨부 파일 섹션 */}
                  {selectedWork.attachments && selectedWork.attachments.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {t('workAttachments')} ({selectedWork.attachments.length})
                      </Typography>
                      <List>
                        {selectedWork.attachments.map((file) => (
                          <ListItem key={file.id} sx={{ px: 0 }}>
                            <Paper sx={{ width: '100%', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {file.original_name} ({(file.file_size / 1024).toFixed(1)} KB)
                              </Typography>
                              <Button size="small" variant="outlined">
                                다운로드
                              </Button>
                            </Paper>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* 코멘트 섹션 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CommentIcon />
                      {t('workComments')} ({comments.length})
                    </Typography>
                    
                    {comments.length > 0 && (
                      <List sx={{ mb: 2 }}>
                        {comments.map((comment) => (
                          <ListItem key={comment.id} sx={{ px: 0 }}>
                            <Paper sx={{ width: '100%', p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2">
                                  {comment.author.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(comment.created_at).toLocaleString('ko-KR')}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                              </Typography>
                            </Paper>
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* 코멘트 추가 */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder={t('addComment')}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        multiline
                        rows={2}
                        size="small"
                      />
                      <Button 
                        variant="contained"
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        {t('addComment')}
                      </Button>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        업무 정보
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('workStatus')}
                          </Typography>
                          <Chip 
                            label={t(`work${selectedWork.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}` as keyof typeof t)} 
                            color={getStatusColor(selectedWork.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('workPriority')}
                          </Typography>
                          <Chip 
                            label={t(`work${selectedWork.priority.charAt(0).toUpperCase() + selectedWork.priority.slice(1)}` as keyof typeof t)} 
                            color={getPriorityColor(selectedWork.priority) as any}
                            size="small"
                          />
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('workAssigner')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {selectedWork.assigner.username}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('workAssignee')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {selectedWork.assignee?.username || '-'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('workCreatedAt')}
                          </Typography>
                          <Typography variant="body2">
                            {new Date(selectedWork.created_at).toLocaleString('ko-KR')}
                          </Typography>
                        </Box>

                        {selectedWork.start_date && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {t('workStartDate')}
                            </Typography>
                            <Typography variant="body2">
                              {new Date(selectedWork.start_date).toLocaleDateString('ko-KR')}
                            </Typography>
                          </Box>
                        )}

                        {selectedWork.due_date && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {t('workDueDate')}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: new Date(selectedWork.due_date) < new Date() ? 'error.main' : 'text.primary',
                              fontWeight: new Date(selectedWork.due_date) < new Date() ? 'bold' : 'normal'
                            }}>
                              {new Date(selectedWork.due_date).toLocaleDateString('ko-KR')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>

                    {/* 업무 상태 변경 버튼들 */}
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        업무 상태 변경
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* 수행자가 수락/거부할 수 있는 경우 */}
                        {selectedWork.status === 'pending' && selectedWork.assignee?.id === currentUser?.id && (
                          <>
                            <Button
                              fullWidth
                              variant="contained"
                              color="success"
                              onClick={() => handleStatusChange(selectedWork.id, 'accepted')}
                            >
                              {t('workAccept')}
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              color="error"
                              onClick={() => handleStatusChange(selectedWork.id, 'rejected')}
                            >
                              {t('workReject')}
                            </Button>
                          </>
                        )}
                        
                        {/* 수행자가 진행 상태를 변경할 수 있는 경우 */}
                        {selectedWork.assignee?.id === currentUser?.id && selectedWork.status === 'accepted' && (
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => handleStatusChange(selectedWork.id, 'in_progress')}
                          >
                            업무 시작
                          </Button>
                        )}
                        
                        {selectedWork.assignee?.id === currentUser?.id && selectedWork.status === 'in_progress' && (
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={() => handleStatusChange(selectedWork.id, 'completed')}
                          >
                            업무 완료
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {(selectedWork.assignee?.id === currentUser?.id || selectedWork.assigner.id === currentUser?.id) && (
                <Button onClick={() => openEditDialog(selectedWork)}>
                  {t('edit')}
                </Button>
              )}
              {selectedWork.assigner.id === currentUser?.id && (
                <Button 
                  onClick={() => openDeleteDialog(selectedWork)}
                  color="error"
                >
                  {t('delete')}
                </Button>
              )}
              <Button onClick={() => setViewDialogOpen(false)}>
                {t('close')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main',
          pb: 1,
          fontSize: '1.1rem',
          fontWeight: 600
        }}>
          <DeleteIcon color="error" />
          업무 삭제 확인
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Typography variant="body1" sx={{ mb: 2, fontSize: '1rem' }}>
              정말 이 업무를 삭제하시겠습니까?
            </Typography>
            {workToDelete && (
              <Paper sx={{ p: 2, backgroundColor: '#fff3e0', border: '1px solid #ffb74d' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  삭제할 업무 정보
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">
                    <strong>제목:</strong> {workToDelete.title}
                  </Typography>
                  <Typography variant="body2">
                    <strong>카테고리:</strong> {t(`work${workToDelete.category.charAt(0).toUpperCase() + workToDelete.category.slice(1)}` as keyof typeof t)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>우선순위:</strong> {t(`work${workToDelete.priority.charAt(0).toUpperCase() + workToDelete.priority.slice(1)}` as keyof typeof t)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>수행자:</strong> {workToDelete.assignee?.username || '-'}
                  </Typography>
                </Box>
              </Paper>
            )}
            <Typography variant="body2" color="error" sx={{ mt: 2, fontStyle: 'italic' }}>
              ⚠️ 이 작업은 되돌릴 수 없습니다.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
          >
            취소
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            삭제
          </Button>
        </DialogActions>
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </>
  );
};

export default WorkPage;
