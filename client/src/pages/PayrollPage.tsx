import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
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
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Pagination,
  Card,
  CardContent,
  Divider,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
// import { useAuth } from '../contexts/AuthContext';
// import { useTranslation } from 'react-i18next';

interface Payroll {
  id: number;
  user_id: number;
  month: string;
  year: number;
  basic_salary: number;
  hra: number;
  da: number;
  ta: number;
  ma: number;
  special_allowance: number;
  bonus: number;
  overtime_pay: number;
  gross_salary: number;
  pf_contribution: number;
  esi_contribution: number;
  tds: number;
  professional_tax: number;
  net_salary: number;
  working_days: number;
  leave_days: number;
  overtime_hours: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  User: {
    id: number;
    userid: string;
    username: string;
    company_id: number;
    Company: {
      id: number;
      name: string;
    };
  };
}

interface User {
  id: number;
  userid: string;
  username: string;
  company_id: number;
  Company: {
    id: number;
    name: string;
  };
}

const PayrollPage: React.FC = () => {
  // const { t } = useTranslation();
  // const { user: currentUser } = useAuth();
  const currentUser = { role: 'admin' }; // 임시 사용자 정보
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [viewingPayroll, setViewingPayroll] = useState<Payroll | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const [newPayroll, setNewPayroll] = useState({
    user_id: '',
    month: '',
    year: new Date().getFullYear(),
    basic_salary: 0,
    hra: 0,
    da: 0,
    ta: 0,
    ma: 0,
    special_allowance: 0,
    bonus: 0,
    overtime_pay: 0,
    working_days: 0,
    leave_days: 0,
    overtime_hours: 0,
    pf_contribution: 0,
    esi_contribution: 0,
    tds: 0,
    professional_tax: 0,
    remarks: ''
  });

  const [emailData, setEmailData] = useState({
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchPayrolls();
    fetchUsers();
  }, [selectedMonth, selectedYear, selectedStatus, page, rowsPerPage]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString()
      });

      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear.toString());
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/payroll?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayrolls(data.data);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      showSnackbar('급여 목록 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'paid': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'paid': return '지급완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const canEdit = currentUser?.role === 'root' || currentUser?.role === 'admin';
  const canDelete = currentUser?.role === 'root' || currentUser?.role === 'admin';

  // 다이얼로그 핸들러들
  const handleDialogOpen = () => {
    setEditingPayroll(null);
    setNewPayroll({
      user_id: '',
      month: '',
      year: new Date().getFullYear(),
      basic_salary: 0,
      hra: 0,
      da: 0,
      ta: 0,
      ma: 0,
      special_allowance: 0,
      bonus: 0,
      overtime_pay: 0,
      working_days: 0,
      leave_days: 0,
      overtime_hours: 0,
      pf_contribution: 0,
      esi_contribution: 0,
      tds: 0,
      professional_tax: 0,
      remarks: ''
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPayroll(null);
    setNewPayroll({
      user_id: '',
      month: '',
      year: new Date().getFullYear(),
      basic_salary: 0,
      hra: 0,
      da: 0,
      ta: 0,
      ma: 0,
      special_allowance: 0,
      bonus: 0,
      overtime_pay: 0,
      working_days: 0,
      leave_days: 0,
      overtime_hours: 0,
      pf_contribution: 0,
      esi_contribution: 0,
      tds: 0,
      professional_tax: 0,
      remarks: ''
    });
  };

  const handleViewDialogOpen = (payroll: Payroll) => {
    setViewingPayroll(payroll);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewingPayroll(null);
  };

  const handleEmailDialogOpen = (payroll: Payroll) => {
    setViewingPayroll(payroll);
    setEmailData({
      email: '',
      subject: `급여명세서 - ${payroll.User.username} (${payroll.year}년 ${payroll.month}월)`,
      message: ''
    });
    setEmailDialogOpen(true);
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setViewingPayroll(null);
    setEmailData({ email: '', subject: '', message: '' });
  };

  const handleEdit = (payroll: Payroll) => {
    setEditingPayroll(payroll);
    setNewPayroll({
      user_id: payroll.user_id.toString(),
      month: payroll.month,
      year: payroll.year,
      basic_salary: payroll.basic_salary,
      hra: payroll.hra,
      da: payroll.da,
      ta: payroll.ta,
      ma: payroll.ma,
      special_allowance: payroll.special_allowance,
      bonus: payroll.bonus,
      overtime_pay: payroll.overtime_pay,
      working_days: payroll.working_days,
      leave_days: payroll.leave_days,
      overtime_hours: payroll.overtime_hours,
      pf_contribution: payroll.pf_contribution,
      esi_contribution: payroll.esi_contribution,
      tds: payroll.tds,
      professional_tax: payroll.professional_tax,
      remarks: payroll.remarks || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingPayroll 
        ? `/api/payroll/${editingPayroll.id}` 
        : '/api/payroll';
      
      const method = editingPayroll ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPayroll)
      });

      if (response.ok) {
        showSnackbar(
          editingPayroll ? '급여 정보가 수정되었습니다.' : '급여가 등록되었습니다.',
          'success'
        );
        handleDialogClose();
        fetchPayrolls();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error submitting payroll:', error);
      showSnackbar('급여 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async (payroll: Payroll) => {
    if (!window.confirm('정말로 이 급여 정보를 삭제하시겠습니까?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payroll/${payroll.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSnackbar('급여 정보가 삭제되었습니다.', 'success');
        fetchPayrolls();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '삭제 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error deleting payroll:', error);
      showSnackbar('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleStatusChange = async (payroll: Payroll, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payroll/${payroll.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showSnackbar('급여 상태가 변경되었습니다.', 'success');
        fetchPayrolls();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '상태 변경 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      showSnackbar('상태 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSendEmail = async () => {
    if (!viewingPayroll || !emailData.email) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payroll/${viewingPayroll.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: emailData.email })
      });

      if (response.ok) {
        showSnackbar('급여명세서가 이메일로 전송되었습니다.', 'success');
        handleEmailDialogClose();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '이메일 전송 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showSnackbar('이메일 전송 중 오류가 발생했습니다.', 'error');
    }
  };

  const handlePrint = (payroll: Payroll) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>급여명세서 - ${payroll.User.username}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
              .info-row { display: flex; margin-bottom: 10px; }
              .label { font-weight: bold; width: 200px; }
              .value { flex: 1; }
              .total { font-weight: bold; font-size: 1.2em; color: #1976d2; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>급여명세서</h1>
              <p>${payroll.year}년 ${payroll.month}월</p>
              <p>출력일시: ${new Date().toLocaleString('ko-KR')}</p>
            </div>
            
            <div class="section">
              <h3>직원 정보</h3>
              <div class="info-row">
                <span class="label">이름:</span>
                <span class="value">${payroll.User.username}</span>
              </div>
              <div class="info-row">
                <span class="label">회사:</span>
                <span class="value">${payroll.User.Company.name}</span>
              </div>
            </div>
            
            <div class="section">
              <h3>수당 내역</h3>
              <div class="info-row">
                <span class="label">기본급:</span>
                <span class="value">${payroll.basic_salary.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">주택임대수당 (HRA):</span>
                <span class="value">${payroll.hra.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">물가수당 (DA):</span>
                <span class="value">${payroll.da.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">교통수당 (TA):</span>
                <span class="value">${payroll.ta.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">의료수당 (MA):</span>
                <span class="value">${payroll.ma.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">특별수당:</span>
                <span class="value">${payroll.special_allowance.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">보너스:</span>
                <span class="value">${payroll.bonus.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">초과근무수당:</span>
                <span class="value">${payroll.overtime_pay.toLocaleString()}원</span>
              </div>
              <div class="info-row total">
                <span class="label">총 급여:</span>
                <span class="value">${payroll.gross_salary.toLocaleString()}원</span>
              </div>
            </div>
            
            <div class="section">
              <h3>공제 내역</h3>
              <div class="info-row">
                <span class="label">EPF 기여금:</span>
                <span class="value">${payroll.pf_contribution.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">ESI 기여금:</span>
                <span class="value">${payroll.esi_contribution.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">TDS:</span>
                <span class="value">${payroll.tds.toLocaleString()}원</span>
              </div>
              <div class="info-row">
                <span class="label">전문직세:</span>
                <span class="value">${payroll.professional_tax.toLocaleString()}원</span>
              </div>
              <div class="info-row total">
                <span class="label">실수령액:</span>
                <span class="value">${payroll.net_salary.toLocaleString()}원</span>
              </div>
            </div>
            
            <div class="section">
              <h3>근무 정보</h3>
              <div class="info-row">
                <span class="label">근무일수:</span>
                <span class="value">${payroll.working_days}일</span>
              </div>
              <div class="info-row">
                <span class="label">휴가일수:</span>
                <span class="value">${payroll.leave_days}일</span>
              </div>
              <div class="info-row">
                <span class="label">초과근무시간:</span>
                <span class="value">${payroll.overtime_hours}시간</span>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          급여 관리
        </Typography>
        <Typography variant="body1" color="text.secondary">
          인도 노동법에 따른 직원 급여 관리 시스템
        </Typography>
      </Box>

      {/* 필터 및 검색 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="년도"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              size="small"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <MenuItem key={year} value={year}>{year}년</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="월"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              size="small"
            >
              <MenuItem value="">전체</MenuItem>
              {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, '0');
                return <MenuItem key={month} value={`${selectedYear}-${month}`}>{month}월</MenuItem>;
              })}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="상태"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              size="small"
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="pending">대기중</MenuItem>
              <MenuItem value="approved">승인됨</MenuItem>
              <MenuItem value="paid">지급완료</MenuItem>
              <MenuItem value="cancelled">취소됨</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleDialogOpen}
              disabled={!canEdit}
              fullWidth
              sx={{ height: 40 }}
            >
              급여 등록
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 급여 목록 테이블 */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>직원명</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>기간</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>기본급</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>총 급여</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>실수령액</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>상태</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                                            {payrolls && payrolls.length > 0 ? payrolls.map((payroll) => (
                 <TableRow key={payroll.id} hover>
                   <TableCell>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
                         {payroll.User.username}
                       </Typography>
                       <Typography variant="caption" color="text.secondary">
                         ({payroll.User.userid})
                       </Typography>
                     </Box>
                   </TableCell>
                   <TableCell>
                     {payroll.year}년 {payroll.month}월
                   </TableCell>
                   <TableCell>
                     {payroll.basic_salary.toLocaleString()}원
                   </TableCell>
                   <TableCell>
                     {payroll.gross_salary.toLocaleString()}원
                   </TableCell>
                   <TableCell>
                     <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                       {payroll.net_salary.toLocaleString()}원
                     </Typography>
                   </TableCell>
                   <TableCell>
                     <Chip
                       label={getStatusText(payroll.status)}
                       color={getStatusColor(payroll.status) as any}
                       size="small"
                     />
                   </TableCell>
                   <TableCell>
                     <Box sx={{ display: 'flex', gap: 0.5 }}>
                       <Tooltip title="상세보기">
                         <IconButton
                           size="small"
                           onClick={() => handleViewDialogOpen(payroll)}
                           sx={{ color: '#1976d2' }}
                         >
                           <ViewIcon />
                         </IconButton>
                       </Tooltip>
                       {canEdit && (
                         <Tooltip title="수정">
                           <IconButton
                             size="small"
                             onClick={() => handleEdit(payroll)}
                             sx={{ color: '#ff9800' }}
                           >
                             <EditIcon />
                           </IconButton>
                         </Tooltip>
                       )}
                       {canDelete && (
                         <Tooltip title="삭제">
                           <IconButton
                             size="small"
                             onClick={() => handleDelete(payroll)}
                             sx={{ color: '#f44336' }}
                           >
                             <DeleteIcon />
                           </IconButton>
                         </Tooltip>
                       )}
                       <Tooltip title="인쇄">
                         <IconButton
                           size="small"
                           onClick={() => handlePrint(payroll)}
                           sx={{ color: '#4caf50' }}
                         >
                           <PrintIcon />
                         </IconButton>
                       </Tooltip>
                       <Tooltip title="이메일 전송">
                         <IconButton
                           size="small"
                           onClick={() => handleEmailDialogOpen(payroll)}
                           sx={{ color: '#9c27b0' }}
                         >
                           <EmailIcon />
                         </IconButton>
                       </Tooltip>
                     </Box>
                   </TableCell>
                 </TableRow>
               )) : (
                 <TableRow>
                   <TableCell colSpan={7} align="center">
                     <Typography variant="body2" color="text.secondary">
                       급여 정보를 불러오는 중...
                     </Typography>
                   </TableCell>
                 </TableRow>
               )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

      {/* 급여 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPayroll ? '급여 정보 수정' : '새 급여 등록'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>직원 선택</InputLabel>
                <Select
                  value={newPayroll.user_id}
                  onChange={(e) => setNewPayroll({ ...newPayroll, user_id: e.target.value })}
                  label="직원 선택"
                >
                  {users && users.length > 0 ? users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.username} ({user.userid})
                    </MenuItem>
                  )) : (
                    <MenuItem disabled>직원 정보를 불러오는 중...</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="년도"
                type="number"
                value={newPayroll.year}
                onChange={(e) => setNewPayroll({ ...newPayroll, year: Number(e.target.value) })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="월"
                value={newPayroll.month}
                onChange={(e) => setNewPayroll({ ...newPayroll, month: e.target.value })}
                size="small"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const month = String(i + 1).padStart(2, '0');
                  return <MenuItem key={month} value={`${newPayroll.year}-${month}`}>{month}월</MenuItem>;
                })}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#1976d2' }}>수당 내역</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="기본급"
                type="number"
                value={newPayroll.basic_salary}
                onChange={(e) => setNewPayroll({ ...newPayroll, basic_salary: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="주택임대수당 (HRA)"
                type="number"
                value={newPayroll.hra}
                onChange={(e) => setNewPayroll({ ...newPayroll, hra: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="물가수당 (DA)"
                type="number"
                value={newPayroll.da}
                onChange={(e) => setNewPayroll({ ...newPayroll, da: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="교통수당 (TA)"
                type="number"
                value={newPayroll.ta}
                onChange={(e) => setNewPayroll({ ...newPayroll, ta: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="의료수당 (MA)"
                type="number"
                value={newPayroll.ma}
                onChange={(e) => setNewPayroll({ ...newPayroll, ma: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="특별수당"
                type="number"
                value={newPayroll.special_allowance}
                onChange={(e) => setNewPayroll({ ...newPayroll, special_allowance: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="보너스"
                type="number"
                value={newPayroll.bonus}
                onChange={(e) => setNewPayroll({ ...newPayroll, bonus: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="초과근무수당"
                type="number"
                value={newPayroll.overtime_pay}
                onChange={(e) => setNewPayroll({ ...newPayroll, overtime_pay: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#1976d2' }}>공제 내역</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="EPF 기여금"
                type="number"
                value={newPayroll.pf_contribution}
                onChange={(e) => setNewPayroll({ ...newPayroll, pf_contribution: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ESI 기여금"
                type="number"
                value={newPayroll.esi_contribution}
                onChange={(e) => setNewPayroll({ ...newPayroll, esi_contribution: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="TDS"
                type="number"
                value={newPayroll.tds}
                onChange={(e) => setNewPayroll({ ...newPayroll, tds: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="전문직세"
                type="number"
                value={newPayroll.professional_tax}
                onChange={(e) => setNewPayroll({ ...newPayroll, professional_tax: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#1976d2' }}>근무 정보</Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="근무일수"
                type="number"
                value={newPayroll.working_days}
                onChange={(e) => setNewPayroll({ ...newPayroll, working_days: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">일</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="휴가일수"
                type="number"
                value={newPayroll.leave_days}
                onChange={(e) => setNewPayroll({ ...newPayroll, leave_days: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">일</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="초과근무시간"
                type="number"
                value={newPayroll.overtime_hours}
                onChange={(e) => setNewPayroll({ ...newPayroll, overtime_hours: Number(e.target.value) })}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">시간</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고"
                multiline
                rows={3}
                value={newPayroll.remarks}
                onChange={(e) => setNewPayroll({ ...newPayroll, remarks: e.target.value })}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPayroll ? '수정' : '등록'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 급여 상세보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={handleViewDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          급여 상세 정보 - {viewingPayroll?.User.username}
        </DialogTitle>
        <DialogContent>
          {viewingPayroll && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>기본 정보</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">직원명</Typography>
                <Typography variant="body1">{viewingPayroll.User.username}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">기간</Typography>
                <Typography variant="body1">{viewingPayroll.year}년 {viewingPayroll.month}월</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">상태</Typography>
                <Chip
                  label={getStatusText(viewingPayroll.status)}
                  color={getStatusColor(viewingPayroll.status) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">지급일</Typography>
                <Typography variant="body1">
                  {viewingPayroll.payment_date ? new Date(viewingPayroll.payment_date).toLocaleDateString('ko-KR') : '미지급'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#1976d2' }}>수당 내역</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">기본급</Typography>
                <Typography variant="body1">{viewingPayroll.basic_salary.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">주택임대수당 (HRA)</Typography>
                <Typography variant="body1">{viewingPayroll.hra.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">물가수당 (DA)</Typography>
                <Typography variant="body1">{viewingPayroll.da.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">교통수당 (TA)</Typography>
                <Typography variant="body1">{viewingPayroll.ta.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">의료수당 (MA)</Typography>
                <Typography variant="body1">{viewingPayroll.ma.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">특별수당</Typography>
                <Typography variant="body1">{viewingPayroll.special_allowance.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">보너스</Typography>
                <Typography variant="body1">{viewingPayroll.bonus.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">초과근무수당</Typography>
                <Typography variant="body1">{viewingPayroll.overtime_pay.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">총 급여</Typography>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {viewingPayroll.gross_salary.toLocaleString()}원
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#1976d2' }}>공제 내역</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">EPF 기여금</Typography>
                <Typography variant="body1">{viewingPayroll.pf_contribution.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">ESI 기여금</Typography>
                <Typography variant="body1">{viewingPayroll.esi_contribution.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">TDS</Typography>
                <Typography variant="body1">{viewingPayroll.tds.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">전문직세</Typography>
                <Typography variant="body1">{viewingPayroll.professional_tax.toLocaleString()}원</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">실수령액</Typography>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  {viewingPayroll.net_salary.toLocaleString()}원
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#1976d2' }}>근무 정보</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">근무일수</Typography>
                <Typography variant="body1">{viewingPayroll.working_days}일</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">휴가일수</Typography>
                <Typography variant="body1">{viewingPayroll.leave_days}일</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">초과근무시간</Typography>
                <Typography variant="body1">{viewingPayroll.overtime_hours}시간</Typography>
              </Grid>
              
              {viewingPayroll.remarks && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#1976d2' }}>비고</Typography>
                  <Typography variant="body1">{viewingPayroll.remarks}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewDialogClose}>닫기</Button>
          <Button onClick={() => handlePrint(viewingPayroll!)} startIcon={<PrintIcon />}>
            인쇄
          </Button>
          <Button onClick={() => handleEmailDialogOpen(viewingPayroll!)} startIcon={<EmailIcon />}>
            이메일 전송
          </Button>
          {canEdit && (
            <Button onClick={() => handleEdit(viewingPayroll!)} variant="contained">
              수정
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 이메일 전송 다이얼로그 */}
      <Dialog open={emailDialogOpen} onClose={handleEmailDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          급여명세서 이메일 전송
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="수신자 이메일"
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                placeholder="example@company.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="제목"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="추가 메시지"
                multiline
                rows={4}
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="이메일에 포함할 추가 메시지를 입력하세요..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEmailDialogClose}>취소</Button>
          <Button onClick={handleSendEmail} variant="contained" startIcon={<EmailIcon />}>
            전송
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
    </Container>
  );
};

export default PayrollPage;
