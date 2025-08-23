import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

interface ExpenseItem {
  id: string;
  invoice_date: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Company {
  id: number;
  name: string;
  gst_number: string;
  bank_name: string;
  ifsc_code: string;
  account_number: string;
  account_holder: string;
}

interface Expense {
  id: number;
  voucher_no: string;
  company_id: number;
  company?: Company;
  department: string;
  total_amount: number;
  igst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  tds_amount: number;
  grand_total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  requester_id: number;
  approver_id: number;
  payment_date: string;
  payment_status: string;
  remarks: string;
  created_at: string;
  updated_at: string;
  Requester?: { username: string };
  Approver?: { username: string };
  Items?: ExpenseItem[];
}

interface User {
  id: number;
  username: string;
  userid: string;
}

const ExpensePage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });
  const [currentPage, setCurrentPage] = useState(1);

  const [companies, setCompanies] = useState<Company[]>([]);
     const [formData, setFormData] = useState({
     voucher_no: '',
     company_id: '',
     department: '',
     priority: 'medium' as 'low' | 'medium' | 'high',
     approver_id: '',
     payment_date: new Date().toISOString().split('T')[0],
     payment_status: '',
     remarks: '',
     igst_rate: 0,
     cgst_rate: 9,
     sgst_rate: 9,
     tds_rate: 0,
     receipt_files: [] as File[],
     items: [{ 
       id: '1', 
       invoice_date: new Date().toISOString().split('T')[0],
       product_name: '', 
       description: '', 
       quantity: 1, 
       unit_price: 0, 
       total_price: 0 
     }]
   });

  // Helper functions
  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      receipt_files: [...prev.receipt_files, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      receipt_files: prev.receipt_files.filter((_, i) => i !== index)
    }));
  };

  const calculateIGST = () => {
    return calculateTotal() * (formData.igst_rate / 100);
  };

  const calculateCGST = () => {
    return calculateTotal() * (formData.cgst_rate / 100);
  };

  const calculateSGST = () => {
    return calculateTotal() * (formData.sgst_rate / 100);
  };

  const calculateTDS = () => {
    return calculateTotal() * (formData.tds_rate / 100);
  };

  const calculateGrandTotal = () => {
    const total = calculateTotal();
    const igst = calculateIGST();
    const cgst = calculateCGST();
    const sgst = calculateSGST();
    const tds = calculateTDS();
    // 총금액 + GST - TDS
    return total + igst + cgst + sgst - tds;
  };

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      invoice_date: new Date().toISOString().split('T')[0],
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

     const updateItem = (index: number, field: keyof ExpenseItem, value: any) => {
     const newItems = [...formData.items];
     newItems[index] = { ...newItems[index], [field]: value };
     
     // 송장 날짜가 변경되면 모든 항목에 동일하게 적용
     if (field === 'invoice_date') {
       newItems.forEach(item => {
         item.invoice_date = value;
       });
     }
     
     // 항상 합계 자동 계산 (수량 x 단가)
     newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
     
     // 마지막 항목에 내용이 입력되면 자동으로 새 라인 추가
     if (index === newItems.length - 1 && 
         (field === 'product_name' || field === 'description') && 
         value && 
         (field === 'product_name' ? value.trim() : true)) {
       const newItem = {
         id: Date.now().toString(),
         invoice_date: value, // 현재 선택된 송장 날짜 사용
         product_name: '',
         description: '',
         quantity: 1,
         unit_price: 0,
         total_price: 0
       };
       newItems.push(newItem);
     }
     
     setFormData({ ...formData, items: newItems });
   };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      draft: '초안',
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거부됨'
    };
    return statusMap[status] || status;
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      low: '낮음 (30일 이내 지급 요청)',
      medium: '보통 (10일 이내 지급 요청)',
      high: '높음 (2일 이내 지급 요청)'
    };
    return priorityMap[priority] || priority;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // API calls
  const fetchExpenses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        type: tabValue === 0 ? 'requested' : 'received'
      });

      const response = await fetch(`/api/expenses?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExpenses(result.data);
        }
      }
    } catch (error) {
      console.error('지출결의서 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, tabValue]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('=== 사용자 목록 조회 시작 ===');
      console.log('토큰 존재 여부:', !!token);
      console.log('현재 users 상태:', users);
      
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      const response = await fetch('/api/users', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('사용자 API 응답 상태:', response.status);
      console.log('사용자 API 응답 헤더:', response.headers);
      
      if (response.ok) {
        const result = await response.json();
        console.log('사용자 조회 결과:', result);
        
        if (result.success && Array.isArray(result.data)) {
          console.log('사용자 데이터 유효함, 상태 업데이트 중...');
          setUsers(result.data);
          console.log('설정된 사용자 목록:', result.data);
          console.log('사용자 수:', result.data.length);
        } else {
          console.error('사용자 데이터 형식 오류:', result);
          console.error('result.success:', result.success);
          console.error('result.data 타입:', typeof result.data);
          console.error('result.data가 배열인가:', Array.isArray(result.data));
        }
      } else {
        console.error('사용자 조회 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('오류 응답 내용:', errorText);
      }
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      console.error('오류 상세:', error instanceof Error ? error.message : error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('=== 공급업체 목록 조회 시작 ===');
      console.log('토큰 존재 여부:', !!token);
      console.log('현재 companies 상태:', companies);
      
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      // 공급업체만 필터링하여 가져오기
      const response = await fetch('/api/partners/type/supplier', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('공급업체 API 응답 상태:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('공급업체 조회 결과:', result);
        
        if (Array.isArray(result)) {
          console.log('공급업체 데이터 유효함, 상태 업데이트 중...');
          setCompanies(result);
          console.log('설정된 공급업체 목록:', result);
          console.log('공급업체 수:', result.length);
        } else {
          console.error('공급업체 데이터 형식 오류:', result);
          console.error('result 타입:', typeof result);
          console.error('result가 배열인가:', Array.isArray(result));
        }
      } else {
        console.error('공급업체 조회 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('오류 응답 내용:', errorText);
      }
    } catch (error) {
      console.error('공급업체 조회 오류:', error);
      console.error('오류 상세:', error instanceof Error ? error.message : error);
    }
  };

  useEffect(() => {
    console.log('useEffect 실행 - 초기 데이터 로드 시작');
    fetchExpenses();
    fetchUsers();
    fetchCompanies();
  }, [fetchExpenses]);

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
    setEditingExpense(null);
         setFormData({
       voucher_no: '',
       company_id: '',
       department: '',
       priority: 'medium',
       approver_id: '',
       payment_date: new Date().toISOString().split('T')[0],
       payment_status: '',
       remarks: '',
       igst_rate: 0,
       cgst_rate: 9,
       sgst_rate: 9,
       tds_rate: 0,
       receipt_files: [],
       items: [{ 
         id: '1', 
         invoice_date: new Date().toISOString().split('T')[0],
         product_name: '', 
         description: '', 
         quantity: 1, 
         unit_price: 0, 
         total_price: 0 
       }]
           });
     // 다이얼로그 열 때 공급업체와 사용자 목록 새로고침
     console.log('다이얼로그 열기 - 데이터 새로고침 시작');
     fetchCompanies();
     fetchUsers();
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

  const handleDeleteDialogOpen = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedExpense(null);
  };

  const handleApproveDialogOpen = (expense: Expense) => {
    setSelectedExpense(expense);
    setApproveDialogOpen(true);
  };

  const handleApproveDialogClose = () => {
    setApproveDialogOpen(false);
    setSelectedExpense(null);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const expenseData = {
        ...formData,
        total_amount: calculateTotal(),
        igst_amount: calculateIGST(),
        cgst_amount: calculateCGST(),
        sgst_amount: calculateSGST(),
        tds_amount: calculateTDS(),
        grand_total: calculateGrandTotal(),
        items: formData.items
      };

      const url = editingExpense 
        ? `/api/expenses/${editingExpense.id}`
        : '/api/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expenseData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSnackbar({
            open: true,
            message: editingExpense ? '지출결의서가 수정되었습니다.' : '지출결의서가 작성되었습니다.',
            severity: 'success'
          });
          handleDialogClose();
          fetchExpenses();
        }
      }
    } catch (error) {
      console.error('지출결의서 저장 오류:', error);
      setSnackbar({
        open: true,
        message: '오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSnackbar({
            open: true,
            message: '지출결의서가 삭제되었습니다.',
            severity: 'success'
          });
          handleDeleteDialogClose();
          fetchExpenses();
        }
      }
    } catch (error) {
      console.error('지출결의서 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: '오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleApprove = async (status: 'approved' | 'rejected') => {
    if (!selectedExpense) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/expenses/${selectedExpense.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSnackbar({
            open: true,
            message: status === 'approved' ? '지출결의서가 승인되었습니다.' : '지출결의서가 거부되었습니다.',
            severity: 'success'
          });
          handleApproveDialogClose();
          fetchExpenses();
        }
      }
    } catch (error) {
      console.error('지출결의서 승인/거부 오류:', error);
      setSnackbar({
        open: true,
        message: '오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} fontSize="0.85rem">지출관리</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleDialogOpen} 
          sx={{ fontSize: '0.8rem', textTransform: 'none' }}
        >
          지출결의서 작성
        </Button>
      </Box>

      {/* 탭 */}
      <Paper sx={{ mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              py: 1.5,
              px: 3,
            },
          }}
        >
          <Tab label="요청한 지출결의서" />
          <Tab label="받은 지출결의서" />
        </Tabs>
      </Paper>
      
      {/* 지출결의서 목록 */}
      <Paper sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress size={18} />
          </Box>
        ) : (
          <>
            {expenses.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                  지출결의서가 없습니다.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>바우처번호</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>공급업체</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>부서</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>상태</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, minWidth: 180 }}>우선순위</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>총합계</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>작성일</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            {expense.voucher_no || '자동생성'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{expense.company?.name || '미지정'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{expense.department || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(expense.status)}
                            size="small"
                            color={
                              expense.status === 'approved' ? 'success' :
                              expense.status === 'rejected' ? 'error' :
                              expense.status === 'pending' ? 'warning' : 'default'
                            }
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPriorityText(expense.priority)}
                            size="small"
                            color={
                              expense.priority === 'high' ? 'error' :
                              expense.priority === 'medium' ? 'warning' : 'info'
                            }
                            sx={{ 
                              fontSize: '0.6rem',
                              height: 'auto',
                              '& .MuiChip-label': {
                                padding: '4px 8px',
                                whiteSpace: 'normal',
                                lineHeight: 1.2
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            ₹{expense.grand_total.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(expense.created_at)}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDialogOpen(expense)}
                              sx={{ color: '#1976d2' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            {expense.status === 'draft' && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingExpense(expense);
                                    setFormData({
                                      voucher_no: expense.voucher_no || '',
                                      company_id: expense.company_id?.toString() || '',
                                      department: expense.department || '',
                                      priority: expense.priority,
                                      approver_id: expense.approver_id.toString(),
                                      payment_date: expense.payment_date || '',
                                      payment_status: expense.payment_status || '',
                                      remarks: expense.remarks,
                                                                             igst_rate: 0,
                                       cgst_rate: 9,
                                       sgst_rate: 9,
                                       tds_rate: 0,
                                      receipt_files: [],
                                      items: expense.Items || []
                                    });
                                    setDialogOpen(true);
                                  }}
                                  sx={{ color: '#ff9800' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteDialogOpen(expense)}
                                  sx={{ color: '#f44336' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                            {tabValue === 1 && expense.status === 'pending' && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => handleApproveDialogOpen(expense)}
                                  sx={{ color: '#4caf50' }}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleApproveDialogOpen(expense)}
                                  sx={{ color: '#f44336' }}
                                >
                                  <RejectIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
                 )}
       </Paper>

       {/* 지출결의서 작성/수정 다이얼로그 */}
       <Dialog 
         open={dialogOpen} 
         onClose={handleDialogClose}
         maxWidth="lg"
         fullWidth
         PaperProps={{
           sx: {
             borderRadius: 2,
             boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
             background: '#ffffff'
           }
         }}
       >
         <DialogTitle sx={{ 
           fontSize: '1.2rem', 
           fontWeight: 700, 
           pb: 2,
           textAlign: 'center',
           background: '#1976d2',
           color: 'white',
           borderRadius: '8px 8px 0 0',
           mb: 2
         }}>
           <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
           {editingExpense ? '지출결의서 수정' : '지출결의서 작성'}
         </DialogTitle>
         
         <DialogContent sx={{ pt: 2 }}>
           <Grid container spacing={3}>
             {/* 1. 공급업체 정보 */}
             <Grid item xs={12}>
               <Paper 
                 elevation={2} 
                 sx={{ 
                   p: 2, 
                   background: '#f8f9fa',
                   border: '1px solid #e0e0e0',
                   borderRadius: 2
                 }}
               >
                 <Typography variant="h6" fontWeight={700} mb={2} fontSize="1rem" color="#1976d2">
                   <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                   1. 공급업체 정보
                 </Typography>
                 <Grid container spacing={2}>
                   <Grid item xs={6}>
                     <FormControl fullWidth size="small">
                       <InputLabel>공급업체 선택</InputLabel>
                                               <Select
                          value={formData.company_id}
                          onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                          label="공급업체 선택"
                          sx={{ 
                            background: 'white',
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': { borderColor: '#1976d2' }
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>공급업체를 선택하세요</em>
                          </MenuItem>
                          {companies.map((company) => (
                            <MenuItem key={company.id} value={company.id}>
                              {company.name}
                            </MenuItem>
                          ))}
                        </Select>
                     </FormControl>
                   </Grid>
                                       <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="부서"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="부서명을 입력하세요"
                        sx={{ 
                          background: 'white',
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#1976d2' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>승인자 선택</InputLabel>
                        <Select
                          value={formData.approver_id}
                          onChange={(e) => setFormData({ ...formData, approver_id: e.target.value })}
                          label="승인자 선택"
                          sx={{ 
                            background: 'white',
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': { borderColor: '#1976d2' }
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>승인자를 선택하세요</em>
                          </MenuItem>
                          {users.length === 0 ? (
                            <MenuItem disabled>사용자 목록을 불러오는 중... ({users.length}명)</MenuItem>
                          ) : (
                            users.map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                {user.username} ({user.userid})
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                 </Grid>
               </Paper>
             </Grid>

             {/* 2. 지출 항목 상세 */}
             <Grid item xs={12}>
               <Paper 
                 elevation={2} 
                 sx={{ 
                   p: 2, 
                   background: '#f8f9fa',
                   border: '1px solid #e0e0e0',
                   borderRadius: 2
                 }}
               >
                 <Typography variant="h6" fontWeight={700} mb={2} fontSize="1rem" color="#1976d2">
                   <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                   2. 지출 항목 상세
                 </Typography>
                 <TableContainer component={Paper} variant="outlined" sx={{ background: 'white' }}>
                   <Table size="small">
                     <TableHead>
                                                <TableRow sx={{ background: '#f5f5f5' }}>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#495057' }}>No.</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#495057' }}>송장 날짜</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#495057' }}>품목/설명</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#495057' }}>수량</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#495057' }}>단가</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#495057' }}>합계</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#495057' }}>삭제</TableCell>
                         </TableRow>
                     </TableHead>
                     <TableBody>
                       {formData.items.map((item, index) => (
                         <TableRow key={item.id} sx={{ '&:hover': { background: '#f5f5f5' } }}>
                           <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{index + 1}</TableCell>
                           <TableCell>
                             <TextField
                               type="date"
                               size="small"
                               value={item.invoice_date}
                               onChange={(e) => updateItem(index, 'invoice_date', e.target.value)}
                               sx={{ width: 140 }}
                             />
                           </TableCell>
                           <TableCell>
                             <TextField
                               size="small"
                               value={item.product_name}
                               onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                               placeholder="품목명"
                               sx={{ width: 150 }}
                             />
                           </TableCell>
                           
                           <TableCell>
                             <TextField
                               size="small"
                               type="number"
                               value={item.quantity}
                               onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                               sx={{ width: 80 }}
                             />
                           </TableCell>
                           <TableCell>
                             <TextField
                               size="small"
                               type="number"
                               value={item.unit_price}
                               onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                               sx={{ width: 100 }}
                             />
                           </TableCell>
                                                       <TableCell>
                              <TextField
                                size="small"
                                value={`₹${item.total_price.toLocaleString()}`}
                                InputProps={{
                                  readOnly: true,
                                  sx: { 
                                    background: '#f5f5f5',
                                    '& .MuiInputBase-input': {
                                      color: '#1976d2',
                                      fontWeight: 600,
                                      fontSize: '0.8rem'
                                    }
                                  }
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                           <TableCell>
                             <IconButton
                               size="small"
                               onClick={() => removeItem(index)}
                               sx={{ 
                                 color: '#f44336',
                                 '&:hover': { background: '#ffebee' }
                               }}
                             >
                               <DeleteIcon fontSize="small" />
                             </IconButton>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </TableContainer>
                 <Box mt={2} textAlign="center">
                                        <Button
                       startIcon={<AddIcon />}
                       onClick={addItem}
                       variant="outlined"
                       size="small"
                       sx={{ 
                         fontSize: '0.75rem',
                         borderColor: '#1976d2',
                         color: '#1976d2',
                         '&:hover': { 
                           borderColor: '#145ea8',
                           background: '#e3f2fd'
                         }
                       }}
                     >
                       항목 추가
                     </Button>
                 </Box>
               </Paper>
             </Grid>

             {/* 3. 합계 및 세금 계산 */}
             <Grid item xs={12}>
               <Paper 
                 elevation={2} 
                 sx={{ 
                   p: 2, 
                   background: '#f8f9fa',
                   border: '1px solid #e0e0e0',
                   borderRadius: 2
                 }}
               >
                 <Typography variant="h6" fontWeight={700} mb={2} fontSize="1rem" color="#1976d2">
                   <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                   3. 합계 및 세금 계산
                 </Typography>
                 <Grid container spacing={2}>
                   <Grid item xs={3}>
                     <TextField
                       fullWidth
                       size="small"
                       label="IGST 비율 (%)"
                       type="number"
                       value={formData.igst_rate}
                       onChange={(e) => setFormData({ ...formData, igst_rate: Number(e.target.value) })}
                       sx={{ 
                         background: 'white',
                         '& .MuiOutlinedInput-root': {
                           '&:hover fieldset': { borderColor: '#1976d2' }
                         }
                       }}
                     />
                   </Grid>
                   <Grid item xs={3}>
                     <TextField
                       fullWidth
                       size="small"
                       label="CGST 비율 (%)"
                       type="number"
                       value={formData.cgst_rate}
                       onChange={(e) => setFormData({ ...formData, cgst_rate: Number(e.target.value) })}
                       sx={{ 
                         background: 'white',
                         '& .MuiOutlinedInput-root': {
                           '&:hover fieldset': { borderColor: '#1976d2' }
                         }
                       }}
                     />
                   </Grid>
                   <Grid item xs={3}>
                     <TextField
                       fullWidth
                       size="small"
                       label="SGST 비율 (%)"
                       type="number"
                       value={formData.sgst_rate}
                       onChange={(e) => setFormData({ ...formData, sgst_rate: Number(e.target.value) })}
                       sx={{ 
                         background: 'white',
                         '& .MuiOutlinedInput-root': {
                           '&:hover fieldset': { borderColor: '#1976d2' }
                         }
                       }}
                     />
                   </Grid>
                   <Grid item xs={3}>
                     <TextField
                       fullWidth
                       size="small"
                       label="TDS 비율 (%)"
                       type="number"
                       value={formData.tds_rate}
                       onChange={(e) => setFormData({ ...formData, tds_rate: Number(e.target.value) })}
                       sx={{ 
                         background: 'white',
                         '& .MuiOutlinedInput-root': {
                           '&:hover fieldset': { borderColor: '#1976d2' }
                         }
                       }}
                     />
                   </Grid>
                 </Grid>
                 
                 <Box mt={3} p={3} sx={{ 
                   background: '#f5f5f5',
                   borderRadius: 2,
                   border: '1px solid #e0e0e0'
                 }}>
                                       <Typography variant="h6" fontWeight={600} mb={2} fontSize="0.9rem" color="#1976d2" textAlign="center">
                      결제 금액 계산서
                    </Typography>
                   <Grid container spacing={2}>
                     <Grid item xs={6}>
                       <Typography variant="body2" fontSize="0.85rem" fontWeight={600} color="text.primary">
                         총 금액 (A): ₹{calculateTotal().toLocaleString()}
                       </Typography>
                     </Grid>
                     <Grid item xs={6}>
                       <Typography variant="body2" fontSize="0.85rem" fontWeight={600} color="text.primary">
                         IGST (B): ₹{calculateIGST().toLocaleString()}
                       </Typography>
                     </Grid>
                     <Grid item xs={6}>
                       <Typography variant="body2" fontSize="0.85rem" fontWeight={600} color="text.primary">
                         CGST (C): ₹{calculateCGST().toLocaleString()}
                       </Typography>
                     </Grid>
                     <Grid item xs={6}>
                       <Typography variant="body2" fontSize="0.85rem" fontWeight={600} color="text.primary">
                         SGST (D): ₹{calculateSGST().toLocaleString()}
                       </Typography>
                     </Grid>
                     <Grid item xs={6}>
                       <Typography variant="body2" fontSize="0.85rem" fontWeight={600} color="text.primary">
                         TDS (E): ₹{calculateTDS().toLocaleString()}
                       </Typography>
                     </Grid>
                     <Grid item xs={12}>
                                               <Typography variant="h6" fontWeight={700} fontSize="1rem" color="#1976d2" textAlign="center" sx={{ 
                          background: '#e3f2fd',
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid #1976d2'
                        }}>
                          총합계 (A+B+C+D)-E: ₹{calculateGrandTotal().toLocaleString()}
                        </Typography>
                     </Grid>
                   </Grid>
                 </Box>
               </Paper>
             </Grid>

             {/* 4. 추가 정보 */}
             <Grid item xs={12}>
               <Paper 
                 elevation={2} 
                 sx={{ 
                   p: 2, 
                   background: '#f8f9fa',
                   border: '1px solid #e0e0e0',
                   borderRadius: 2
                 }}
               >
                 <Typography variant="h6" fontWeight={700} mb={2} fontSize="1rem" color="#1976d2">
                   📋 4. 추가 정보
                 </Typography>
                 <Grid container spacing={2}>
                   <Grid item xs={4}>
                                            <TextField
                         fullWidth
                         size="small"
                         label="결제 날짜"
                         type="date"
                         value={formData.payment_date}
                         onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                         sx={{ 
                           background: 'white',
                           '& .MuiOutlinedInput-root': {
                             '&:hover fieldset': { borderColor: '#1976d2' }
                           }
                         }}
                       />
                   </Grid>
                   <Grid item xs={4}>
                                            <TextField
                         fullWidth
                         size="small"
                         label="결제 상태"
                         value={formData.payment_status}
                         onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                         placeholder="결제 상태"
                         sx={{ 
                           background: 'white',
                           '& .MuiOutlinedInput-root': {
                             '&:hover fieldset': { borderColor: '#1976d2' }
                           }
                         }}
                       />
                   </Grid>
                   <Grid item xs={4}>
                     <FormControl fullWidth size="small">
                       <InputLabel>우선순위</InputLabel>
                       <Select
                         value={formData.priority}
                         onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                         label="우선순위"
                         sx={{ 
                           background: 'white',
                           '& .MuiOutlinedInput-root': {
                             '&:hover fieldset': { borderColor: '#1976d2' }
                           }
                         }}
                       >
                         <MenuItem value="low">낮음 (30일 이내)</MenuItem>
                         <MenuItem value="medium">보통 (10일 이내)</MenuItem>
                         <MenuItem value="high">높음 (2일 이내)</MenuItem>
                       </Select>
                     </FormControl>
                   </Grid>
                   <Grid item xs={12}>
                     <TextField
                       fullWidth
                       size="small"
                       label="비고"
                       multiline
                       rows={2}
                       value={formData.remarks}
                       onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                       placeholder="추가 설명이나 메모를 입력하세요"
                       sx={{ 
                         background: 'white',
                         '& .MuiOutlinedInput-root': {
                           '&:hover fieldset': { borderColor: '#1976d2' }
                         }
                       }}
                     />
                   </Grid>
                 </Grid>
               </Paper>
             </Grid>

             {/* 5. 영수증 첨부 */}
             <Grid item xs={12}>
               <Paper 
                 elevation={2} 
                 sx={{ 
                   p: 2, 
                   background: '#f8f9fa',
                   border: '1px solid #e0e0e0',
                   borderRadius: 2
                 }}
               >
                 <Typography variant="h6" fontWeight={700} mb={2} fontSize="1rem" color="#1976d2">
                   📎 5. 영수증 첨부
                 </Typography>
                 <Grid container spacing={2}>
                   <Grid item xs={12}>
                     <Box sx={{ 
                       border: '2px dashed #1976d2', 
                       borderRadius: 2, 
                       p: 3, 
                       textAlign: 'center',
                       background: 'rgba(255,255,255,0.7)'
                     }}>
                       <input
                         type="file"
                         multiple
                         accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                         onChange={handleFileUpload}
                         style={{ display: 'none' }}
                         id="receipt-upload"
                       />
                       <label htmlFor="receipt-upload">
                         <Button
                           component="span"
                           startIcon={<AttachFileIcon />}
                           variant="outlined"
                           sx={{ 
                             borderColor: '#1976d2',
                             color: '#1976d2',
                             '&:hover': { 
                               borderColor: '#145ea8',
                               background: '#e3f2fd'
                             }
                           }}
                         >
                           영수증 파일 선택
                         </Button>
                       </label>
                       <Typography variant="body2" color="textSecondary" mt={1}>
                         PDF, 이미지, 문서 파일을 첨부할 수 있습니다
                       </Typography>
                     </Box>
                   </Grid>
                   
                   {/* 첨부된 파일 목록 */}
                   {formData.receipt_files.length > 0 && (
                     <Grid item xs={12}>
                       <Typography variant="subtitle2" fontWeight={600} mb={1} fontSize="0.85rem">
                         첨부된 파일 ({formData.receipt_files.length}개)
                       </Typography>
                       <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                         {formData.receipt_files.map((file, index) => (
                           <Box 
                             key={index} 
                             sx={{ 
                               display: 'flex', 
                               alignItems: 'center', 
                               justifyContent: 'space-between',
                               p: 1, 
                               mb: 1, 
                               background: 'white',
                               borderRadius: 1,
                               border: '1px solid #e0e0e0'
                             }}
                           >
                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                               <AttachFileIcon sx={{ mr: 1, color: '#1976d2' }} />
                               <Typography variant="body2" fontSize="0.8rem">
                                 {file.name}
                               </Typography>
                             </Box>
                             <IconButton
                               size="small"
                               onClick={() => removeFile(index)}
                               sx={{ color: '#f44336' }}
                             >
                               <DeleteIcon fontSize="small" />
                             </IconButton>
                           </Box>
                         ))}
                       </Box>
                     </Grid>
                   )}
                 </Grid>
               </Paper>
             </Grid>
           </Grid>
         </DialogContent>
         
         <DialogActions sx={{ 
           p: 3, 
           borderTop: '1px solid #e0e0e0',
           background: '#f8f9fa',
           borderRadius: '0 0 8px 8px'
         }}>
           <Button 
             onClick={handleDialogClose} 
             variant="outlined"
             sx={{ 
               fontSize: '0.9rem',
               borderColor: '#6c757d',
               color: '#6c757d',
               '&:hover': { 
                 borderColor: '#495057',
                 background: '#e9ecef'
               }
             }}
           >
             취소
           </Button>
           <Button 
             onClick={handleSubmit} 
             variant="contained"
             sx={{ 
               fontSize: '0.9rem',
               background: '#1976d2',
               '&:hover': { 
                 background: '#145ea8'
               },
               boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)'
             }}
           >
             {editingExpense ? '수정 완료' : '지출결의서 제출'}
           </Button>
         </DialogActions>
                </Dialog>

         {/* 상세보기 다이얼로그 */}
         <Dialog 
           open={viewDialogOpen} 
           onClose={handleViewDialogClose}
           maxWidth="lg"
           fullWidth
           PaperProps={{
             sx: {
               borderRadius: 2,
               boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
             }
           }}
         >
           <DialogTitle sx={{ 
             fontSize: '1rem', 
             fontWeight: 600, 
             pb: 1,
             borderBottom: '1px solid #e0e0e0'
           }}>
             지출결의서 상세 - {selectedExpense?.voucher_no || '자동생성'}
           </DialogTitle>
           
           <DialogContent sx={{ pt: 2 }}>
             {selectedExpense && (
               <Grid container spacing={3}>
                 {/* 기본 정보 */}
                 <Grid item xs={12}>
                   <Typography variant="subtitle2" fontWeight={600} mb={1} fontSize="0.85rem">
                     기본 정보
                   </Typography>
                   <Grid container spacing={2}>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         바우처번호
                       </Typography>
                       <Typography variant="body1" fontSize="0.9rem">
                         {selectedExpense.voucher_no || '자동생성'}
                       </Typography>
                     </Grid>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         공급업체
                       </Typography>
                       <Typography variant="body1" fontSize="0.9rem">
                         {selectedExpense.company?.name || '미지정'}
                       </Typography>
                     </Grid>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         부서
                       </Typography>
                       <Typography variant="body1" fontSize="0.9rem">
                         {selectedExpense.department || '-'}
                       </Typography>
                     </Grid>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         상태
                       </Typography>
                       <Chip
                         label={getStatusText(selectedExpense.status)}
                         size="small"
                         color={
                           selectedExpense.status === 'approved' ? 'success' :
                           selectedExpense.status === 'rejected' ? 'error' :
                           selectedExpense.status === 'pending' ? 'warning' : 'default'
                         }
                         sx={{ fontSize: '0.65rem' }}
                       />
                     </Grid>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         우선순위
                       </Typography>
                       <Chip
                         label={getPriorityText(selectedExpense.priority)}
                         size="small"
                         color={
                           selectedExpense.priority === 'high' ? 'error' :
                           selectedExpense.priority === 'medium' ? 'warning' : 'info'
                         }
                         sx={{ fontSize: '0.65rem' }}
                       />
                     </Grid>
                                           <Grid item xs={4}>
                        <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                          작성일
                        </Typography>
                        <Typography variant="body1" fontSize="0.9rem">
                          {formatDate(selectedExpense.created_at)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                          승인자
                        </Typography>
                        <Typography variant="body1" fontSize="0.9rem">
                          {selectedExpense.Approver?.username || '미지정'}
                        </Typography>
                      </Grid>
                   </Grid>
                 </Grid>

                 {/* 지출 항목 */}
                 <Grid item xs={12}>
                   <Typography variant="subtitle2" fontWeight={600} mb={1} fontSize="0.85rem">
                     지출 항목
                   </Typography>
                   <TableContainer component={Paper} variant="outlined">
                     <Table size="small">
                       <TableHead>
                         <TableRow>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>No.</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>송장 날짜</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>품목/설명</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>수량</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>단가</TableCell>
                           <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>합계</TableCell>
                         </TableRow>
                       </TableHead>
                       <TableBody>
                         {selectedExpense.Items?.map((item, index) => (
                           <TableRow key={item.id}>
                             <TableCell sx={{ fontSize: '0.8rem' }}>{index + 1}</TableCell>
                             <TableCell sx={{ fontSize: '0.8rem' }}>
                               {formatDate(item.invoice_date)}
                             </TableCell>
                             <TableCell sx={{ fontSize: '0.8rem' }}>
                               <Box>
                                 <Typography variant="body2" fontWeight={600}>
                                   {item.product_name}
                                 </Typography>
                                 {item.description && (
                                   <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                                     {item.description}
                                   </Typography>
                                 )}
                               </Box>
                             </TableCell>
                             <TableCell sx={{ fontSize: '0.8rem' }}>{item.quantity}</TableCell>
                             <TableCell sx={{ fontSize: '0.8rem' }}>
                               ₹{item.unit_price.toLocaleString()}
                             </TableCell>
                             <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                               ₹{item.total_price.toLocaleString()}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </TableContainer>
                 </Grid>

                 {/* 합계 정보 */}
                 <Grid item xs={12}>
                   <Typography variant="subtitle2" fontWeight={600} mb={1} fontSize="0.85rem">
                     합계 정보
                   </Typography>
                   <Box p={2} bgcolor="#f5f5f5" borderRadius={1}>
                     <Grid container spacing={2}>
                       <Grid item xs={6}>
                         <Typography variant="body2" fontSize="0.8rem">
                           총 금액: ₹{selectedExpense.total_amount.toLocaleString()}
                         </Typography>
                       </Grid>
                       <Grid item xs={6}>
                         <Typography variant="body2" fontSize="0.8rem">
                           IGST: ₹{selectedExpense.igst_amount.toLocaleString()}
                         </Typography>
                       </Grid>
                       <Grid item xs={6}>
                         <Typography variant="body2" fontSize="0.8rem">
                           CGST: ₹{selectedExpense.cgst_amount.toLocaleString()}
                         </Typography>
                       </Grid>
                       <Grid item xs={6}>
                         <Typography variant="body2" fontSize="0.8rem">
                           SGST: ₹{selectedExpense.sgst_amount.toLocaleString()}
                         </Typography>
                       </Grid>
                       <Grid item xs={6}>
                         <Typography variant="body2" fontSize="0.8rem">
                           TDS: ₹{selectedExpense.tds_amount.toLocaleString()}
                         </Typography>
                       </Grid>
                       <Grid item xs={6}>
                         <Typography variant="body2" fontWeight={600} fontSize="0.9rem">
                           총합계: ₹{selectedExpense.grand_total.toLocaleString()}
                         </Typography>
                       </Grid>
                     </Grid>
                   </Box>
                 </Grid>

                 {/* 추가 정보 */}
                 <Grid item xs={12}>
                   <Typography variant="subtitle2" fontWeight={600} mb={1} fontSize="0.85rem">
                     추가 정보
                   </Typography>
                   <Grid container spacing={2}>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         결제 날짜
                       </Typography>
                       <Typography variant="body1" fontSize="0.9rem">
                         {selectedExpense.payment_date ? formatDate(selectedExpense.payment_date) : '-'}
                       </Typography>
                     </Grid>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         결제 상태
                       </Typography>
                       <Typography variant="body1" fontSize="0.9rem">
                         {selectedExpense.payment_status || '-'}
                       </Typography>
                     </Grid>
                     <Grid item xs={4}>
                       <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                         비고
                       </Typography>
                       <Typography variant="body1" fontSize="0.9rem">
                         {selectedExpense.remarks || '-'}
                       </Typography>
                     </Grid>
                   </Grid>
                 </Grid>
               </Grid>
             )}
           </DialogContent>
           
           <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
             <Button onClick={handleViewDialogClose} sx={{ fontSize: '0.8rem' }}>
               닫기
             </Button>
           </DialogActions>
         </Dialog>

         {/* 삭제 확인 다이얼로그 */}
         <Dialog 
           open={deleteDialogOpen} 
           onClose={handleDeleteDialogClose}
           maxWidth="sm"
           fullWidth
           PaperProps={{
             sx: {
               borderRadius: 2,
               boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
             }
           }}
         >
           <DialogTitle sx={{ 
             fontSize: '1rem', 
             fontWeight: 600, 
             pb: 1,
             borderBottom: '1px solid #e0e0e0'
           }}>
             삭제 확인
           </DialogTitle>
           
           <DialogContent sx={{ pt: 2 }}>
             <Typography variant="body1" fontSize="0.9rem">
               정말로 이 지출결의서를 삭제하시겠습니까?
             </Typography>
             {selectedExpense && (
               <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                 <Typography variant="body2" fontSize="0.8rem" fontWeight={600}>
                   바우처번호: {selectedExpense.voucher_no || '자동생성'}
                 </Typography>
                 <Typography variant="body2" fontSize="0.8rem">
                   공급업체: {selectedExpense.company?.name || '미지정'}
                 </Typography>
                 <Typography variant="body2" fontSize="0.8rem">
                   총합계: ₹{selectedExpense.grand_total.toLocaleString()}
                 </Typography>
               </Box>
             )}
             <Typography variant="body2" color="error" fontSize="0.8rem" mt={2}>
               이 작업은 되돌릴 수 없습니다.
             </Typography>
           </DialogContent>
           
           <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
             <Button onClick={handleDeleteDialogClose} sx={{ fontSize: '0.8rem' }}>
               취소
             </Button>
             <Button 
               onClick={handleDelete} 
               variant="contained"
               color="error"
               sx={{ fontSize: '0.8rem' }}
             >
               삭제
             </Button>
           </DialogActions>
         </Dialog>

         {/* 승인/거부 다이얼로그 */}
         <Dialog 
           open={approveDialogOpen} 
           onClose={handleApproveDialogClose}
           maxWidth="sm"
           fullWidth
           PaperProps={{
             sx: {
               borderRadius: 2,
               boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
             }
           }}
         >
           <DialogTitle sx={{ 
             fontSize: '1rem', 
             fontWeight: 600, 
             pb: 1,
             borderBottom: '1px solid #e0e0e0'
           }}>
             지출결의서 승인/거부
           </DialogTitle>
           
           <DialogContent sx={{ pt: 2 }}>
             <Typography variant="body1" fontSize="0.9rem" mb={2}>
               이 지출결의서를 승인하거나 거부하시겠습니까?
             </Typography>
             {selectedExpense && (
               <Box p={2} bgcolor="#f5f5f5" borderRadius={1}>
                 <Typography variant="body2" fontSize="0.8rem" fontWeight={600}>
                   바우처번호: {selectedExpense.voucher_no || '자동생성'}
                 </Typography>
                 <Typography variant="body2" fontSize="0.8rem">
                   공급업체: {selectedExpense.company?.name || '미지정'}
                 </Typography>
                 <Typography variant="body2" fontSize="0.8rem">
                   총합계: ₹{selectedExpense.grand_total.toLocaleString()}
                 </Typography>
                                   <Typography variant="body2" fontSize="0.8rem">
                    우선순위: {getPriorityText(selectedExpense.priority)}
                  </Typography>
                  <Typography variant="body2" fontSize="0.8rem">
                    승인자: {selectedExpense.Approver?.username || '미지정'}
                  </Typography>
               </Box>
             )}
           </DialogContent>
           
           <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
             <Button onClick={handleApproveDialogClose} sx={{ fontSize: '0.8rem' }}>
               취소
             </Button>
             <Button 
               onClick={() => handleApprove('rejected')} 
               variant="outlined"
               color="error"
               sx={{ fontSize: '0.8rem' }}
             >
               거부
             </Button>
             <Button 
               onClick={() => handleApprove('approved')} 
               variant="contained"
               color="success"
               sx={{ fontSize: '0.8rem' }}
             >
               승인
             </Button>
           </DialogActions>
         </Dialog>

         {/* 스낵바 알림 */}
         <Snackbar
           open={snackbar.open}
           autoHideDuration={6000}
           onClose={handleSnackbarClose}
           anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
         >
           <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
             {snackbar.message}
           </Alert>
         </Snackbar>
       </Box>
     );
   };

export default ExpensePage;
