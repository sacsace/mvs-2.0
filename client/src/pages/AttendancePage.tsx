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
  TablePagination,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { TimePicker } from '@mui/x-date-pickers/TimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { ko } from 'date-fns/locale';

interface Attendance {
  id: number;
  user_id: number;
  date: string;
  check_in: string;
  check_out: string;
  total_hours: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday';
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

interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
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

const AttendancePage: React.FC = () => {
  const currentUser = { role: 'admin' }; // 임시 사용자 정보
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const [newAttendance, setNewAttendance] = useState({
    user_id: '',
    date: new Date(),
    check_in: new Date(),
    check_out: new Date(),
    status: 'present',
    remarks: ''
  });

  const [newLeaveRequest, setNewLeaveRequest] = useState({
    user_id: '',
    leave_type: 'annual',
    start_date: new Date(),
    end_date: new Date(),
    reason: ''
  });

  useEffect(() => {
    fetchAttendances();
    fetchLeaveRequests();
    fetchUsers();
  }, [selectedDate, selectedUser, selectedStatus, page, rowsPerPage]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString()
      });

      if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0]);
      if (selectedUser) params.append('user_id', selectedUser);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/attendance?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendances(data.data || []);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
      showSnackbar('근태 목록 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leave-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.leaveRequests || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
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
        setUsers(data.users || []);
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
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half_day': return 'info';
      case 'leave': return 'default';
      case 'holiday': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return '출근';
      case 'absent': return '결근';
      case 'late': return '지각';
      case 'half_day': return '반차';
      case 'leave': return '휴가';
      case 'holiday': return '휴일';
      default: return status;
    }
  };

  const getLeaveTypeText = (type: string) => {
    switch (type) {
      case 'annual': return '연차';
      case 'sick': return '병가';
      case 'personal': return '개인휴가';
      case 'maternity': return '출산휴가';
      case 'paternity': return '육아휴가';
      case 'bereavement': return '장례휴가';
      default: return type;
    }
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const canEdit = currentUser?.role === 'root' || currentUser?.role === 'admin';
  const canDelete = currentUser?.role === 'root' || currentUser?.role === 'admin';

  // 근태 기록 다이얼로그 핸들러들
  const handleAttendanceDialogOpen = () => {
    setNewAttendance({
      user_id: '',
      date: new Date(),
      check_in: new Date(),
      check_out: new Date(),
      status: 'present',
      remarks: ''
    });
    setAttendanceDialogOpen(true);
  };

  const handleAttendanceDialogClose = () => {
    setAttendanceDialogOpen(false);
  };

  // 휴가 신청 다이얼로그 핸들러들
  const handleLeaveDialogOpen = () => {
    setNewLeaveRequest({
      user_id: '',
      leave_type: 'annual',
      start_date: new Date(),
      end_date: new Date(),
      reason: ''
    });
    setLeaveDialogOpen(true);
  };

  const handleLeaveDialogClose = () => {
    setLeaveDialogOpen(false);
  };

  const handleViewDialogOpen = (attendance: Attendance) => {
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
  };

  const handleSubmitAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAttendance,
          date: newAttendance.date.toISOString().split('T')[0],
          check_in: newAttendance.check_in.toISOString(),
          check_out: newAttendance.check_out.toISOString()
        })
      });

      if (response.ok) {
        showSnackbar('근태 기록이 등록되었습니다.', 'success');
        handleAttendanceDialogClose();
        fetchAttendances();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      showSnackbar('근태 기록 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSubmitLeaveRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newLeaveRequest,
          start_date: newLeaveRequest.start_date.toISOString().split('T')[0],
          end_date: newLeaveRequest.end_date.toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        showSnackbar('휴가 신청이 등록되었습니다.', 'success');
        handleLeaveDialogClose();
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showSnackbar('휴가 신청 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleApproveLeave = async (leaveId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leave-requests/${leaveId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSnackbar('휴가 신청이 승인되었습니다.', 'success');
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '승인 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      showSnackbar('승인 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleRejectLeave = async (leaveId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leave-requests/${leaveId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSnackbar('휴가 신청이 거절되었습니다.', 'success');
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        showSnackbar(error.message || '거절 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      showSnackbar('거절 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handlePrint = (attendance: Attendance) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>근태 기록 - ${attendance.User.username}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
              .info-row { display: flex; margin-bottom: 10px; }
              .label { font-weight: bold; width: 150px; }
              .value { flex: 1; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>근태 기록</h1>
              <p>출력일시: ${new Date().toLocaleString('ko-KR')}</p>
            </div>
            
            <div class="section">
              <h3>직원 정보</h3>
              <div class="info-row">
                <span class="label">이름:</span>
                <span class="value">${attendance.User.username}</span>
              </div>
              <div class="info-row">
                <span class="label">사원번호:</span>
                <span class="value">${attendance.User.userid}</span>
              </div>
              <div class="info-row">
                <span class="label">회사:</span>
                <span class="value">${attendance.User.Company.name}</span>
              </div>
            </div>
            
            <div class="section">
              <h3>근태 정보</h3>
              <div class="info-row">
                <span class="label">날짜:</span>
                <span class="value">${new Date(attendance.date).toLocaleDateString('ko-KR')}</span>
              </div>
              <div class="info-row">
                <span class="label">출근시간:</span>
                <span class="value">${new Date(attendance.check_in).toLocaleTimeString('ko-KR')}</span>
              </div>
              <div class="info-row">
                <span class="label">퇴근시간:</span>
                <span class="value">${attendance.check_out ? new Date(attendance.check_out).toLocaleTimeString('ko-KR') : '미기록'}</span>
              </div>
              <div class="info-row">
                <span class="label">상태:</span>
                <span class="value">${getStatusText(attendance.status)}</span>
              </div>
              ${attendance.remarks ? `
              <div class="info-row">
                <span class="label">비고:</span>
                <span class="value">${attendance.remarks}</span>
              </div>
              ` : ''}
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
            근태 관리
          </Typography>
          <Typography variant="body1" color="text.secondary">
            직원들의 출근/퇴근 기록, 근무시간, 휴가 신청을 관리하는 시스템
          </Typography>
        </Box>

        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={activeTab === 0 ? 'contained' : 'outlined'}
              onClick={() => setActiveTab(0)}
              startIcon={<ScheduleIcon />}
            >
              근태 기록
            </Button>
            <Button
              variant={activeTab === 1 ? 'contained' : 'outlined'}
              onClick={() => setActiveTab(1)}
              startIcon={<CheckIcon />}
            >
              휴가 신청
            </Button>
          </Box>
        </Box>

        {/* 근태 기록 탭 */}
        {activeTab === 0 && (
          <>
            {/* 필터 및 검색 */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="날짜 선택"
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>직원 선택</InputLabel>
                    <Select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      label="직원 선택"
                    >
                      <MenuItem value="">전체</MenuItem>
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
                  <FormControl fullWidth size="small">
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      label="상태"
                    >
                      <MenuItem value="">전체</MenuItem>
                      <MenuItem value="present">출근</MenuItem>
                      <MenuItem value="absent">결근</MenuItem>
                      <MenuItem value="late">지각</MenuItem>
                      <MenuItem value="half_day">반차</MenuItem>
                      <MenuItem value="leave">휴가</MenuItem>
                      <MenuItem value="holiday">휴일</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAttendanceDialogOpen}
                    disabled={!canEdit}
                    fullWidth
                    sx={{ height: 40 }}
                  >
                    근태 기록
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* 근태 목록 테이블 */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>직원명</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>날짜</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>출근시간</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>퇴근시간</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>근무시간</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>상태</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendances && attendances.length > 0 ? attendances.map((attendance) => (
                      <TableRow key={attendance.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {attendance.User.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({attendance.User.userid})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(attendance.date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {new Date(attendance.check_in).toLocaleTimeString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {attendance.check_out ? new Date(attendance.check_out).toLocaleTimeString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance.total_hours ? `${attendance.total_hours}시간` : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(attendance.status)}
                            color={getStatusColor(attendance.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="상세보기">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDialogOpen(attendance)}
                                sx={{ color: '#1976d2' }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="인쇄">
                              <IconButton
                                size="small"
                                onClick={() => handlePrint(attendance)}
                                sx={{ color: '#4caf50' }}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            근태 정보를 불러오는 중...
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
          </>
        )}

        {/* 휴가 신청 탭 */}
        {activeTab === 1 && (
          <>
            {/* 휴가 신청 버튼 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleLeaveDialogOpen}
                disabled={!canEdit}
              >
                휴가 신청
              </Button>
            </Box>

            {/* 휴가 신청 목록 */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>직원명</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>휴가 유형</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>시작일</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>종료일</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>일수</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>상태</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests && leaveRequests.length > 0 ? leaveRequests.map((leave) => (
                      <TableRow key={leave.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {leave.User.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({leave.User.userid})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getLeaveTypeText(leave.leave_type)}
                        </TableCell>
                        <TableCell>
                          {new Date(leave.start_date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {new Date(leave.end_date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {leave.total_days}일
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={leave.status === 'pending' ? '대기중' : leave.status === 'approved' ? '승인됨' : '거절됨'}
                            color={getLeaveStatusColor(leave.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {leave.status === 'pending' && canEdit && (
                              <>
                                <Tooltip title="승인">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleApproveLeave(leave.id)}
                                    sx={{ color: '#4caf50' }}
                                  >
                                    <CheckIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="거절">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRejectLeave(leave.id)}
                                    sx={{ color: '#f44336' }}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            휴가 신청 정보를 불러오는 중...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {/* 근태 기록 다이얼로그 */}
        <Dialog open={attendanceDialogOpen} onClose={handleAttendanceDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            근태 기록 등록
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>직원 선택</InputLabel>
                  <Select
                    value={newAttendance.user_id}
                    onChange={(e) => setNewAttendance({ ...newAttendance, user_id: e.target.value })}
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
              <Grid item xs={12}>
                <TextField
                  label="날짜"
                  type="date"
                  value={newAttendance.date.toISOString().split('T')[0]}
                  onChange={(e) => setNewAttendance({ ...newAttendance, date: new Date(e.target.value) })}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="출근시간"
                  type="time"
                  value={newAttendance.check_in.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date(newAttendance.check_in);
                    newTime.setHours(parseInt(hours), parseInt(minutes));
                    setNewAttendance({ ...newAttendance, check_in: newTime });
                  }}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="퇴근시간"
                  type="time"
                  value={newAttendance.check_out.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date(newAttendance.check_out);
                    newTime.setHours(parseInt(hours), parseInt(minutes));
                    setNewAttendance({ ...newAttendance, check_out: newTime });
                  }}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>상태</InputLabel>
                  <Select
                    value={newAttendance.status}
                    onChange={(e) => setNewAttendance({ ...newAttendance, status: e.target.value as any })}
                    label="상태"
                  >
                    <MenuItem value="present">출근</MenuItem>
                    <MenuItem value="absent">결근</MenuItem>
                    <MenuItem value="late">지각</MenuItem>
                    <MenuItem value="half_day">반차</MenuItem>
                    <MenuItem value="leave">휴가</MenuItem>
                    <MenuItem value="holiday">휴일</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="비고"
                  multiline
                  rows={3}
                  value={newAttendance.remarks}
                  onChange={(e) => setNewAttendance({ ...newAttendance, remarks: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAttendanceDialogClose}>취소</Button>
            <Button onClick={handleSubmitAttendance} variant="contained">
              등록
            </Button>
          </DialogActions>
        </Dialog>

        {/* 휴가 신청 다이얼로그 */}
        <Dialog open={leaveDialogOpen} onClose={handleLeaveDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            휴가 신청
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>직원 선택</InputLabel>
                  <Select
                    value={newLeaveRequest.user_id}
                    onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, user_id: e.target.value })}
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
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>휴가 유형</InputLabel>
                  <Select
                    value={newLeaveRequest.leave_type}
                    onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, leave_type: e.target.value as any })}
                    label="휴가 유형"
                  >
                    <MenuItem value="annual">연차</MenuItem>
                    <MenuItem value="sick">병가</MenuItem>
                    <MenuItem value="personal">개인휴가</MenuItem>
                    <MenuItem value="maternity">출산휴가</MenuItem>
                    <MenuItem value="paternity">육아휴가</MenuItem>
                    <MenuItem value="bereavement">장례휴가</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="시작일"
                  type="date"
                  value={newLeaveRequest.start_date.toISOString().split('T')[0]}
                  onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, start_date: new Date(e.target.value) })}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="종료일"
                  type="date"
                  value={newLeaveRequest.end_date.toISOString().split('T')[0]}
                  onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, end_date: new Date(e.target.value) })}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="휴가 사유"
                  multiline
                  rows={3}
                  value={newLeaveRequest.reason}
                  onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, reason: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLeaveDialogClose}>취소</Button>
            <Button onClick={handleSubmitLeaveRequest} variant="contained">
              신청
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

export default AttendancePage;
