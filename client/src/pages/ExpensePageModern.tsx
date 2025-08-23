import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  TablePagination,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Send as SubmitIcon,
  Receipt as ReceiptIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ExpenseItem {
  id: number;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Expense {
  id: number;
  title: string;
  description?: string;
  total_amount: number;
  gst_amount: number;
  grand_total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  requester_id: number;
  approver_id?: number;
  company_id: number;
  receipt_files?: string[];
  remarks?: string;
  created_at: string;
  updated_at: string;
  Requester?: {
    id: number;
    username: string;
    userid: string;
  };
  Approver?: {
    id: number;
    username: string;
    userid: string;
  };
  Items?: ExpenseItem[];
}

interface ExpenseFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  approver_id: string;
  remarks: string;
  items: ExpenseItem[];
}

const ExpensePageModern: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    description: '',
    priority: 'medium',
    approver_id: '',
    remarks: '',
    items: [{ id: 1, product_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]
  });

  useEffect(() => {
    fetchExpenses();
    fetchUsers();
  }, [tabValue, page, rowsPerPage]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const type = tabValue === 0 ? 'requested' : 'received';
      const response = await axios.get(`/api/expenses?type=${type}&page=${page + 1}&limit=${rowsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setExpenses(response.data.data);
      }
    } catch (error) {
      console.error('지출결의서 조회 오류:', error);
      setSnackbar({ open: true, message: '지출결의서 조회 중 오류가 발생했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('사용자 조회 오류:', error);
    }
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
    setEditingExpense(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      approver_id: '',
      remarks: '',
      items: [{ id: 1, product_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingExpense(null);
  };

  const handleViewDialogOpen = (expense: Expense) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setSelectedExpense(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: keyof ExpenseItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // 수량과 단가가 변경되면 합계 자동 계산
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateGST = () => {
    return calculateTotal() * 0.18;
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateGST();
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const expenseData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price
        }))
      };

      if (editingExpense) {
        await axios.put(`/api/expenses/${editingExpense.id}`, expenseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: '지출결의서가 수정되었습니다.', severity: 'success' });
      } else {
        await axios.post('/api/expenses', expenseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: '지출결의서가 생성되었습니다.', severity: 'success' });
      }

      handleDialogClose();
      fetchExpenses();
    } catch (error) {
      console.error('지출결의서 저장 오류:', error);
      setSnackbar({ open: true, message: '지출결의서 저장 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '초안';
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'completed': return '완료';
      default: return status;
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

  return (
    <Box sx={{ p: 3, background: '#f8f9fa', minHeight: '100vh' }}>
      {/* 헤더 섹션 */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 3,
        p: 4,
        mb: 4,
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              지출 관리 시스템
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
              회사 지출을 체계적으로 관리하고 승인 프로세스를 진행하세요
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleDialogOpen}
            sx={{ 
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              textTransform: 'none',
              fontSize: '1rem',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            지출결의서 작성
          </Button>
        </Box>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e0e0e0',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)' },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <ReceiptIcon sx={{ color: 'white', fontSize: '2rem' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                {expenses.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 지출결의서
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e0e0e0',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)' },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <ApproveIcon sx={{ color: 'white', fontSize: '2rem' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#28a745', mb: 1 }}>
                {expenses.filter(e => e.status === 'approved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                승인된 결의서
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e0e0e0',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)' },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <ScheduleIcon sx={{ color: 'white', fontSize: '2rem' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffc107', mb: 1 }}>
                {expenses.filter(e => e.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                대기중인 결의서
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e0e0e0',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)' },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <RejectIcon sx={{ color: 'white', fontSize: '2rem' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc3545', mb: 1 }}>
                {expenses.filter(e => e.status === 'rejected').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                거부된 결의서
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 탭 섹션 */}
      <Card sx={{ 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e0e0e0',
        mb: 4
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                py: 2,
                px: 4,
                '&.Mui-selected': {
                  color: '#667eea',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
                height: 3,
              },
            }}
          >
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon />
                  요청한 지출결의서
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <BusinessIcon />
                  받은 지출결의서
                </Box>
              } 
            />
          </Tabs>
        </Box>
        
        <CardContent sx={{ p: 0 }}>
          {/* 지출결의서 목록 */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress size={40} sx={{ color: '#667eea' }} />
            </Box>
          ) : expenses.length === 0 ? (
            <Box sx={{ 
              p: 6, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
            }}>
              <ReceiptIcon sx={{ fontSize: '4rem', color: '#adb5bd', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6c757d', mb: 1 }}>
                지출결의서가 없습니다
              </Typography>
              <Typography variant="body2" sx={{ color: '#adb5bd' }}>
                {tabValue === 0 ? '요청한 지출결의서가 없습니다.' : '받은 지출결의서가 없습니다.'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2, color: '#495057' }}>제목</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2, color: '#495057' }}>상태</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2, color: '#495057' }}>우선순위</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2, color: '#495057' }}>
                        {tabValue === 0 ? '승인자' : '요청자'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2, color: '#495057' }}>총액</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2, color: '#495057' }}>작성일</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2, color: '#495057', textAlign: 'center' }}>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow 
                        key={expense.id} 
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #f0f6ff 0%, #e3f2fd 100%)',
                            transform: 'scale(1.01)',
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
                          },
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => handleViewDialogOpen(expense)}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#495057' }}>
                            {expense.title}
                          </Typography>
                          {expense.description && (
                            <Typography variant="body2" sx={{ color: '#6c757d', mt: 0.5 }}>
                              {expense.description.length > 50 
                                ? `${expense.description.substring(0, 50)}...` 
                                : expense.description
                              }
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={getStatusText(expense.status)}
                            color={getStatusColor(expense.status) as any}
                            size="small"
                            sx={{ 
                              fontSize: '0.75rem', 
                              height: 24,
                              fontWeight: 600,
                              borderRadius: 1.5
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={getPriorityText(expense.priority)}
                            color={getPriorityColor(expense.priority) as any}
                            size="small"
                            sx={{ 
                              fontSize: '0.75rem', 
                              height: 24,
                              fontWeight: 600,
                              borderRadius: 1.5
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                              {tabValue === 0 
                                ? expense.Approver?.username?.charAt(0) || '?'
                                : expense.Requester?.username?.charAt(0) || '?'
                              }
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#495057' }}>
                              {tabValue === 0 
                                ? expense.Approver?.username || '미지정'
                                : expense.Requester?.username || '알 수 없음'
                              }
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#28a745' }}>
                            ₹{expense.grand_total.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ color: '#6c757d' }}>
                            {formatDate(expense.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 2 }}>
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="상세보기">
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDialogOpen(expense);
                                }}
                                sx={{ 
                                  color: '#667eea',
                                  '&:hover': { 
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* 페이지네이션 */}
              <Box sx={{ p: 2, borderTop: '1px solid #e9ecef' }}>
                <TablePagination
                  component="div"
                  count={expenses.length}
                  page={page}
                  onPageChange={(event, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25]}
                  labelRowsPerPage="페이지당 행 수:"
                  sx={{
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontSize: '0.875rem',
                      color: '#6c757d'
                    }
                  }}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* 지출결의서 작성/수정 다이얼로그 */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            py: 3,
            px: 4
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <ReceiptIcon sx={{ fontSize: '1.5rem' }} />
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
              {editingExpense ? '지출결의서 수정' : '지출결의서 작성'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* 기본 정보 섹션 */}
            <Grid item xs={12}>
              <Box sx={{ 
                background: '#f8f9fa', 
                p: 3, 
                borderRadius: 2, 
                border: '1px solid #e9ecef',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  color: '#495057',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <span style={{ 
                    background: '#667eea', 
                    width: '4px', 
                    height: '20px', 
                    borderRadius: '2px',
                    display: 'inline-block'
                  }}></span>
                  기본 정보
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="제목"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="설명"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      multiline
                      rows={2}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>우선순위</InputLabel>
                      <Select
                        value={formData.priority}
                        label="우선순위"
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e9ecef',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                        }}
                      >
                        <MenuItem value="low">
                          <Chip label="낮음" size="small" color="info" sx={{ fontSize: '0.7rem' }} />
                        </MenuItem>
                        <MenuItem value="medium">
                          <Chip label="보통" size="small" color="warning" sx={{ fontSize: '0.7rem' }} />
                        </MenuItem>
                        <MenuItem value="high">
                          <Chip label="높음" size="small" color="error" sx={{ fontSize: '0.7rem' }} />
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>승인자</InputLabel>
                      <Select
                        value={formData.approver_id}
                        label="승인자"
                        onChange={(e) => setFormData({ ...formData, approver_id: e.target.value })}
                        required
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e9ecef',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                        }}
                      >
                        {users.map((user) => (
                          <MenuItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.userid})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="비고"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      multiline
                      rows={2}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            {/* 지출 항목 섹션 */}
            <Grid item xs={12}>
              <Box sx={{ 
                background: '#fff', 
                p: 3, 
                borderRadius: 2, 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600,
                    color: '#495057',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <span style={{ 
                      background: '#28a745', 
                      width: '4px', 
                      height: '20px', 
                      borderRadius: '2px',
                      display: 'inline-block'
                    }}></span>
                    지출 항목
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={addItem}
                    startIcon={<AddIcon />}
                    sx={{ 
                      fontSize: '0.75rem',
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      borderRadius: 2,
                      px: 2,
                      py: 0.5,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #218838 0%, #1ea085 100%)',
                        boxShadow: '0 6px 16px rgba(40, 167, 69, 0.4)',
                      }
                    }}
                  >
                    항목 추가
                  </Button>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f8f9fa' }}>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#495057' }}>품목/설명</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#495057' }}>수량</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#495057' }}>단가</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#495057' }}>합계</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#495057' }}>작업</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={item.id} sx={{ '&:hover': { background: '#f8f9fa' } }}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.product_name}
                              onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                              placeholder="품목명"
                              sx={{ mb: 1 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="설명 (선택사항)"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#28a745' }}>
                              ₹{item.total_price.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formData.items.length > 1 && (
                              <IconButton
                                size="small"
                                onClick={() => removeItem(index)}
                                sx={{ 
                                  color: '#f44336',
                                  '&:hover': { background: 'rgba(244, 67, 54, 0.1)' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* 합계 정보 */}
                <Box sx={{ 
                  mt: 3, 
                  p: 3, 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                  borderRadius: 2,
                  border: '1px solid #dee2e6'
                }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                          소계
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#495057' }}>
                          ₹{calculateTotal().toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                          GST (18%)
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#6c757d' }}>
                          ₹{calculateGST().toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                          총합계
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                          ₹{calculateGrandTotal().toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
          <Button 
            onClick={handleDialogClose}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontSize: '0.875rem'
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
              }
            }}
          >
            {editingExpense ? '수정' : '작성'}
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

export default ExpensePageModern;
