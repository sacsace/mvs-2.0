import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PushPin as PinIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Notice {
  id: number;
  title: string;
  content: string;
  author_id: number;
  status: 'active' | 'inactive' | 'draft';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  view_count: number;
  is_pinned: boolean;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  Author?: {
    id: number;
    username: string;
    userid: string;
  };
}

interface NoticeFormData {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  start_date: string;
  end_date: string;
  is_pinned: boolean;
}

const NoticePage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    priority: 'medium',
    start_date: '',
    end_date: '',
    is_pinned: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotices();
  }, [currentPage, searchTerm, priorityFilter]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notice', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined
        }
      });

      if (response.data.success) {
        setNotices(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      }
    } catch (error: any) {
      console.error('공지사항 조회 오류:', error);
      setError(error.response?.data?.error || '공지사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      start_date: '',
      end_date: '',
      is_pinned: false
    });
    setEditingNotice(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      start_date: '',
      end_date: '',
      is_pinned: false
    });
  };

  const handleViewDialogOpen = (notice: Notice) => {
    setSelectedNotice(notice);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setSelectedNotice(null);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      start_date: notice.start_date ? notice.start_date.split('T')[0] : '',
      end_date: notice.end_date ? notice.end_date.split('T')[0] : '',
      is_pinned: notice.is_pinned
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingNotice) {
        // 수정
        const response = await axios.put(`/api/notice/${editingNotice.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setSnackbar({
            open: true,
            message: '공지사항이 수정되었습니다.',
            severity: 'success'
          });
          handleDialogClose();
          fetchNotices();
        }
      } else {
        // 생성
        const response = await axios.post('/api/notice', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setSnackbar({
            open: true,
            message: '공지사항이 생성되었습니다.',
            severity: 'success'
          });
          handleDialogClose();
          fetchNotices();
        }
      }
    } catch (error: any) {
      console.error('공지사항 저장 오류:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || '공지사항 저장 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNotice) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/notice/${selectedNotice.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: '공지사항이 삭제되었습니다.',
          severity: 'success'
        });
        setDeleteDialogOpen(false);
        setSelectedNotice(null);
        fetchNotices();
      }
    } catch (error: any) {
      console.error('공지사항 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || '공지사항 삭제 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
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
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchNotices();
  };





  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#222' }}>
          공지사항
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
          sx={{ 
            textTransform: 'none',
            fontSize: '0.8rem',
            px: 2,
            py: 1,
            borderRadius: 2
          }}
        >
          공지사항 작성
        </Button>
      </Box>

            {/* 검색 및 필터 */}
      <Paper sx={{ 
        mb: 3, 
        p: 2, 
        boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', 
        borderRadius: 3, 
        border: '1px solid #e3eafc',
        background: '#f7fafd'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="검색어"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목 또는 내용으로 검색"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.8rem',
                  '& fieldset': {
                    borderColor: '#e3eafc'
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.8rem' }}>우선순위</InputLabel>
              <Select
                value={priorityFilter}
                label="우선순위"
                onChange={(e) => setPriorityFilter(e.target.value)}
                sx={{
                  fontSize: '0.8rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e3eafc'
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>전체</MenuItem>
                <MenuItem value="high" sx={{ fontSize: '0.8rem' }}>높음</MenuItem>
                <MenuItem value="medium" sx={{ fontSize: '0.8rem' }}>보통</MenuItem>
                <MenuItem value="low" sx={{ fontSize: '0.8rem' }}>낮음</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              fullWidth
              size="small"
              sx={{ 
                fontSize: '0.8rem',
                py: 1,
                borderRadius: 2
              }}
            >
              검색
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 공지사항 목록 */}
      {loading && notices.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress size={18} />
        </Box>
      ) : notices.length === 0 ? (
        <Paper sx={{ 
          boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', 
          borderRadius: 3, 
          border: '1px solid #e3eafc',
          p: 4,
          textAlign: 'center'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#8b95a1',
              fontSize: '1rem',
              fontWeight: 500,
              mb: 1 
            }}
          >
            공지사항이 없습니다
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#8b95a1',
              fontSize: '0.875rem' 
            }}
          >
            등록된 공지사항이 없습니다. 새 공지사항을 작성해보세요.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#f7fafd' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>고정</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>우선순위</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>제목</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>작성자</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>조회수</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>작성일</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222', textAlign: 'center' }}>작업</TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow 
                    key={notice.id} 
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { background: '#f0f6ff' }
                    }}
                    onClick={() => handleViewDialogOpen(notice)}
                  >
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      {notice.is_pinned && (
                        <Tooltip title="고정 공지사항">
                          <PinIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      <Chip
                        label={getPriorityText(notice.priority)}
                        color={getPriorityColor(notice.priority) as any}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: notice.is_pinned ? 'bold' : 'normal',
                        fontSize: '0.75rem'
                      }}>
                        {notice.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {notice.Author?.username || '알 수 없음'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {notice.view_count}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {formatDate(notice.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="상세보기">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDialogOpen(notice);
                            }}
                            sx={{ 
                              fontSize: '0.75rem',
                              color: '#1976d2',
                              '&:hover': { 
                                backgroundColor: 'rgba(25, 118, 210, 0.1)' 
                              }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="수정">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(notice);
                            }}
                            sx={{ 
                              fontSize: '0.75rem',
                              color: '#1976d2',
                              '&:hover': { 
                                backgroundColor: 'rgba(25, 118, 210, 0.1)' 
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNotice(notice);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ 
                              fontSize: '0.75rem',
                              color: '#ff4444',
                              '&:hover': { 
                                backgroundColor: 'rgba(255, 68, 68, 0.1)' 
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                      </Table>
        </TableContainer>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="small"
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '0.8rem'
              }
            }}
          />
        </Box>
      )}

      {/* 총 개수 표시 */}
      <Box textAlign="center" mt={2}>
        <Typography variant="body2" sx={{ color: '#8b95a1', fontSize: '0.875rem' }}>
          총 {totalItems}개의 공지사항
        </Typography>
      </Box>

      {/* 공지사항 작성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          {editingNotice ? '공지사항 수정' : '공지사항 작성'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>우선순위</InputLabel>
                <Select
                  value={formData.priority}
                  label="우선순위"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <MenuItem value="low">낮음</MenuItem>
                  <MenuItem value="medium">보통</MenuItem>
                  <MenuItem value="high">높음</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  />
                }
                label="고정 공지사항"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="시작일"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="종료일"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="내용"
                multiline
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNotice ? '수정' : '작성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 공지사항 상세보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={handleViewDialogClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            {selectedNotice?.is_pinned && <PinIcon color="error" />}
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              {selectedNotice?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotice && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>작성자:</strong> {selectedNotice.Author?.username}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>우선순위:</strong> {getPriorityText(selectedNotice.priority)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>작성일:</strong> {formatDate(selectedNotice.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>조회수:</strong> {selectedNotice.view_count}
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedNotice.content}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewDialogClose}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>공지사항 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 공지사항을 삭제하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
         </Box>
   );
 };

export default NoticePage;
