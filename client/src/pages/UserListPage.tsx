import React, { useState, useEffect } from 'react';
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
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Avatar,
  Divider,
  Snackbar,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { filterUsersByPermission, useMenuPermission } from '../hooks/useMenuPermission';

interface User {
  id: number;
  userid: string;
  username: string;
  role: string;
  company_id: number;
  default_language: string;
  create_date: string;
  update_date: string;
  company?: {
    name: string;
  };
}

interface Company {
  company_id: number;
  name: string;
}

const UserListPage: React.FC = () => {
  const { t } = useLanguage();
  const { permission: userListMenuPermission, currentUser: menuCurrentUser } = useMenuPermission('사용자 목록');
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    userid: '',
    username: '',
    password: '',
    role: 'user',
    company_id: 1,
    default_language: 'ko'
  });
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(userData);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchCompanies();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setError(null);
      } else {
        setError('사용자 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('회사 목록 조회 오류:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (event: SelectChangeEvent) => {
    setFilterRole(event.target.value);
    setPage(0);
  };

  const handleCompanyFilterChange = (event: SelectChangeEvent) => {
    setFilterCompany(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setViewDialogOpen(true);
  };

  const handleAddUser = () => {
    console.log('=== 사용자 추가 시작 ===');
    console.log('현재 사용자 정보:', currentUser);
    console.log('현재 사용자 역할:', currentUser?.role);
    console.log('현재 사용자 역할 타입:', typeof currentUser?.role);
    console.log('root와 비교:', currentUser?.role === 'root', currentUser?.role, 'root');
    
    setEditingUser(null);
    
    // 현재 사용자 권한에 따라 기본 역할 설정 (System Administrator 제외)
    let defaultRole = 'admin';
    if (currentUser?.role === 'root') {
      defaultRole = 'admin'; // root는 admin, audit, user 중 선택 가능 (기본: admin)
      console.log('root 사용자: admin, audit, user 중 선택 가능 (System Administrator 제외)');
    } else if (currentUser?.role === 'admin') {
      defaultRole = 'user'; // admin은 admin, user 중 선택 가능 (기본: user)
      console.log('admin 사용자: admin, user 중 선택 가능');
    } else if (currentUser?.role === 'audit') {
      defaultRole = 'admin'; // audit는 audit, admin, user 중 선택 가능 (기본: admin)
      console.log('audit 사용자: audit, admin, user 중 선택 가능');
    } else {
      defaultRole = 'user';
      console.log('알 수 없는 역할:', currentUser?.role);
    }
    
    // 역할이 root나 audit이 아닌 경우 현재 사용자의 회사로 자동 설정
    // 그렇지 않으면 첫 번째 회사를 기본값으로 설정
    const defaultCompanyId = (defaultRole !== 'root' && defaultRole !== 'audit') 
      ? (currentUser?.company_id || 1) 
      : (companies.length > 0 ? companies[0].company_id : 1);
    
    console.log('기본 역할:', defaultRole);
    console.log('기본 회사 ID:', defaultCompanyId);
    
    setFormData({
      userid: '',
      username: '',
      password: '',
      role: defaultRole,
      company_id: defaultCompanyId,
      default_language: 'ko'
    });
    setDialogOpen(true);
    console.log('=== 사용자 추가 다이얼로그 열림 ===');
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    
    // 현재 사용자 권한에 따라 수정 가능한 역할 제한
    let editableRole = user.role;
    if (currentUser?.role === 'admin' && user.role === 'root') {
      editableRole = 'user'; // admin은 root 사용자를 user로만 변경 가능
    } else if (currentUser?.role === 'audit' && user.role === 'root') {
      editableRole = 'admin'; // audit는 root 사용자를 admin으로만 변경 가능
    }
    
    // 사용자 수정 시에는 원래 사용자의 회사를 기본값으로 설정
    const defaultCompanyId = user.company_id;
    
    setFormData({
      userid: user.userid,
      username: user.username,
      password: '', // 수정 시에는 비밀번호를 비워둠
      role: editableRole,
      company_id: defaultCompanyId,
      default_language: user.default_language || 'ko' // 사용자의 기본언어가 없을 때만 'ko'로 설정
    });
    setDialogOpen(true);
    
    // 비밀번호 존재 여부 확인
    checkUserPassword(user.id);
  };

  // 사용자에게 비밀번호가 설정되어 있는지 확인하는 함수
  const [userPasswordStatus, setUserPasswordStatus] = useState<{[key: number]: boolean}>({});

  const checkUserPassword = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/has-password`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUserPasswordStatus(prev => ({
          ...prev,
          [userId]: result.hasPassword
        }));
      }
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
    }
  };

  const hasUserPassword = (user: User) => {
    return userPasswordStatus[user.id] ?? true; // 기본값은 true
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchUsers();
        } else {
          setError('사용자 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 삭제 오류:', error);
        setError('사용자 삭제에 실패했습니다.');
      }
    }
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      // 수정 시에는 비밀번호가 입력된 경우에만 포함
      const requestData = editingUser 
        ? { 
            userid: formData.userid,
            username: formData.username, 
            role: formData.role, 
            company_id: formData.company_id, 
            default_language: formData.default_language,
            ...(formData.password && formData.password.trim() !== '' && { password: formData.password }) // 비밀번호가 입력된 경우에만 포함
          }
        : formData;

      console.log('=== 사용자 저장 요청 로그 ===');
      console.log('편집 중인 사용자:', editingUser?.username);
      console.log('formData.password 값:', formData.password);
      console.log('formData.password 길이:', formData.password?.length);
      console.log('formData.password trim 후:', formData.password?.trim());
      console.log('비밀번호가 비어있지 않은지:', formData.password && formData.password.trim() !== '');
      console.log('최종 요청 데이터:', requestData);
      console.log('비밀번호 포함 여부:', !!requestData.password);
      console.log('========================');

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('서버 응답 상태:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('서버 응답 성공:', result);
        setSnackbarMessage(editingUser ? '사용자 정보가 성공적으로 수정되었습니다.' : '사용자가 성공적으로 추가되었습니다.');
        setSnackbarOpen(true);
        setDialogOpen(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        console.error('서버 응답 오류:', errorData);
        setError(errorData.error || '사용자 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 저장 오류:', error);
      setError('사용자 저장에 실패했습니다.');
    }
  };

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.userid.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesCompany = filterCompany === 'all' || user.company_id.toString() === filterCompany;
    
    return matchesSearch && matchesRole && matchesCompany;
  });

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'root':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'root':
        return 'System Administrator';
      case 'audit':
        return 'Auditor';
      default:
        return 'User';
    }
  };

  // 권한에 따라 역할 표시 여부 결정
  const canViewRole = (userRole: string) => {
    if (!currentUser) return false;
    
    // root는 모든 역할 볼 수 있음
    if (currentUser.role === 'root') return true;
    
    // admin은 자신과 같거나 낮은 레벨만 볼 수 있음 (admin, user)
    if (currentUser.role === 'admin') {
      return userRole === 'admin' || userRole === 'user';
    }
    
    // audit는 자신과 admin, user만 볼 수 있음
    if (currentUser.role === 'audit') {
      return userRole === 'audit' || userRole === 'admin' || userRole === 'user';
    }
    
    // 일반 사용자는 역할을 볼 수 없음
    return false;
  };



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: '1.5rem', color: '#1976d2' }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
            {t('userManagement')}
          </Typography>
        </Box>
        {!!userListMenuPermission.can_create && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
            sx={{ fontSize: '0.8rem', textTransform: 'none', boxShadow: 'none', borderRadius: 2, py: 0.8, px: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}
          >
            {t('userAdd')}
          </Button>
        )}
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 필터 및 검색 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder={t('searchUserPlaceholder')}
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '1rem', color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.75rem',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>{t('role')}</InputLabel>
              <Select
                value={filterRole}
                label={t('role')}
                onChange={handleRoleFilterChange}
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>{t('all')}</MenuItem>
                {/* 권한 기반 역할 필터링 */}
                {currentUser?.role === 'root' && (
                  <>
                    <MenuItem value="admin" sx={{ fontSize: '0.75rem' }}>{t('admin')}</MenuItem>
                    <MenuItem value="audit" sx={{ fontSize: '0.75rem' }}>{t('audit')}</MenuItem>
                    <MenuItem value="user" sx={{ fontSize: '0.75rem' }}>{t('regular')}</MenuItem>
                  </>
                )}
                {(currentUser?.role === 'admin' || currentUser?.role === 'audit') && (
                  <MenuItem value="user" sx={{ fontSize: '0.75rem' }}>{t('regular')}</MenuItem>
                )}
              </Select>
            </FormControl>

            {/* root 또는 audit 권한이 있는 경우에만 회사 필터 표시 */}
            {(currentUser?.role === 'root' || currentUser?.role === 'audit') && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>{t('company')}</InputLabel>
                <Select
                  value={filterCompany}
                  label={t('company')}
                  onChange={handleCompanyFilterChange}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>{t('all')}</MenuItem>
                  {companies.map(company => (
                    <MenuItem key={company.company_id} value={company.company_id.toString()} sx={{ fontSize: '0.75rem' }}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <IconButton 
              onClick={fetchUsers} 
              sx={{ 
                ml: 'auto',
                p: 1,
                color: '#666',
                '&:hover': { 
                  color: '#1976d2', 
                  backgroundColor: 'rgba(25, 118, 210, 0.1)' 
                }
              }}
            >
              <RefreshIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* 사용자 테이블 */}
      <Card sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5, p: 2, pb: 0 }}>
            {t('userList')}
          </Typography>
          {paginatedUsers.length === 0 ? (
            <Box sx={{ 
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
                사용자가 없습니다
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#8b95a1',
                  fontSize: '0.875rem' 
                }}
              >
                내 회사에 등록된 사용자가 없습니다. 새 사용자를 추가해보세요.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', borderRadius: 0, border: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ border: 0, background: '#f7fafd' }}>
                    <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>{t('userId')}</TableCell>
                    <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>{t('username')}</TableCell>
                    <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>{t('role')}</TableCell>
                    <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>{t('company')}</TableCell>
                    <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>{t('createDate')}</TableCell>
                    <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>{t('updateDate')}</TableCell>
                    <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      hover 
                      onClick={() => handleViewUser(user)}
                      sx={{ cursor: 'pointer', border: 0 }}
                    >
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{user.userid}</TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{user.username}</TableCell>
                      <TableCell sx={{ border: 0, py: 0.7 }}>
                        {canViewRole(user.role) ? (
                          <Chip
                            label={getRoleLabel(user.role)}
                            color={getRoleColor(user.role) as any}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        ) : (
                          <Chip
                            label="제한됨"
                            color="default"
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 20, opacity: 0.6 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{user.company?.name || '-'}</TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                        {new Date(user.create_date).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                        {new Date(user.update_date).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell sx={{ border: 0, py: 0.7 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!!userListMenuPermission.can_update && (
                            <Tooltip title={t('edit')}>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); handleEditUser(user); }}
                                sx={{ p: 0.5, color: '#666', '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!!userListMenuPermission.can_delete && (
                            <Tooltip title={t('delete')}>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                                sx={{ p: 0.5, color: '#666', '&:hover': { color: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.1)' } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="페이지당 행 수:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            sx={{
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.75rem'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* 사용자 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          {editingUser ? t('userEdit') : t('userAdd')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('userIdLogin')}
              value={formData.userid}
              onChange={(e) => setFormData({ ...formData, userid: e.target.value })}
              disabled={!!editingUser} // 수정 시에는 비활성화
              sx={{ 
                mb: 2, 
                '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                '& .MuiInputBase-input': { fontSize: '0.75rem' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
            />
            
            <TextField
              fullWidth
              label={t('usernameReal')}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              sx={{ 
                mb: 2, 
                '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                '& .MuiInputBase-input': { fontSize: '0.75rem' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
            />
            
            {editingUser && (
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 1 }}>
                {t('existingPassword')}: {hasUserPassword(editingUser) ? '********' : t('notSet')}
              </Typography>
            )}
            <TextField
              fullWidth
              label={editingUser ? t('newPasswordLeaveEmpty') : t('password')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              sx={{ 
                mb: 2, 
                '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                '& .MuiInputBase-input': { fontSize: '0.75rem' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
              required={!editingUser}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>{t('role')}</InputLabel>
              <Select
                value={formData.role}
                label={t('role')}
                open={undefined}
                disabled={false}
                renderValue={(value) => {
                  switch (value) {
                    case 'root': return 'System Administrator';
                    case 'admin': return 'Administrator';
                    case 'audit': return 'Auditor';
                    case 'user': return 'User';
                    default: return value;
                  }
                }}
                onChange={(e) => {
                  const newRole = e.target.value as string;
                  console.log('=== 역할 선택 변경 ===');
                  console.log('선택된 역할:', newRole);
                  console.log('현재 사용자 역할:', currentUser?.role);
                  
                  try {
                    // 사용자 추가 모드에서만 역할에 따라 회사 자동 설정
                    // 사용자 수정 모드에서는 기존 회사 유지
                    let newCompanyId = formData.company_id;
                    
                    if (!editingUser) {
                      // 추가 모드: 역할이 root나 audit이 아닌 경우 현재 사용자의 회사로 자동 설정
                      newCompanyId = (newRole !== 'root' && newRole !== 'audit') 
                        ? (currentUser?.company_id || 1) 
                        : formData.company_id;
                    }
                    
                    console.log('새 회사 ID:', newCompanyId);
                    console.log('편집 모드:', editingUser ? '수정' : '추가');
                    
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      company_id: newCompanyId
                    });
                    
                    console.log('폼 데이터 업데이트 완료');
                  } catch (error) {
                    console.error('역할 변경 중 오류:', error);
                  }
                }}
                sx={{ 
                  '& .MuiSelect-select': { fontSize: '0.75rem' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                  }
                }}
              >
                {/* 현재 사용자 권한에 따라 선택 가능한 역할 제한 */}
                {(() => {
                  console.log('=== 역할 선택 옵션 렌더링 ===');
                  console.log('현재 사용자:', currentUser);
                  console.log('현재 사용자 역할:', currentUser?.role);
                  console.log('editingUser:', editingUser ? '수정 모드' : '추가 모드');
                  
                  // currentUser가 없는 경우 기본 옵션만 표시
                  if (!currentUser) {
                    console.log('현재 사용자 정보 없음, 기본 옵션 표시');
                    return (
                      <>
                        <MenuItem value="user" sx={{ fontSize: '0.75rem' }}>User</MenuItem>
                      </>
                    );
                  }
                  
                  // 사용자 추가/수정에 따른 역할 옵션 제한
                  // 사용자 추가 시: System Administrator 역할 제외
                  // 사용자 수정 시: 기존 로직 유지
                  
                  // 임시: 간단한 메뉴 아이템으로 테스트
                  console.log('간단한 메뉴 아이템 렌더링');
                  // 권한 기반 역할 옵션 렌더링
                  const roleOptions = [];
                  if (currentUser?.role === 'root') {
                    roleOptions.push(
                      <MenuItem key="admin" value="admin" sx={{ fontSize: '0.75rem' }}>Administrator</MenuItem>,
                      <MenuItem key="audit" value="audit" sx={{ fontSize: '0.75rem' }}>Auditor</MenuItem>,
                      <MenuItem key="user" value="user" sx={{ fontSize: '0.75rem' }}>User</MenuItem>
                    );
                  } else if (currentUser?.role === 'admin' || currentUser?.role === 'audit') {
                    roleOptions.push(
                      <MenuItem key="user" value="user" sx={{ fontSize: '0.75rem' }}>User</MenuItem>
                    );
                  }
                  return roleOptions;
                })()}
                {/* root는 자신과 같은 역할도 추가 가능하므로 별도 처리하지 않음 */}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>{t('company')}</InputLabel>
              <Select
                value={formData.company_id.toString()}
                label={t('company')}
                onChange={(e) => setFormData({ ...formData, company_id: parseInt(e.target.value) })}
                disabled={
                  editingUser 
                    ? (currentUser?.role === 'admin' && formData.role !== 'root' && formData.role !== 'audit') // 수정 시: admin 사용자는 root/audit 역할이 아닌 경우에만 회사 변경 불가
                    : (currentUser?.role !== 'root' && formData.role !== 'root' && formData.role !== 'audit') // 추가 시: root가 아닌 사용자는 root/audit 역할이 아닐 때 회사 변경 불가
                }
                sx={{ 
                  '& .MuiSelect-select': { fontSize: '0.75rem' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                  }
                }}
              >
                {companies.map(company => (
                  <MenuItem key={company.company_id} value={company.company_id.toString()} sx={{ fontSize: '0.75rem' }}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
              
              {/* 회사 선택 도움말 */}
              {(editingUser 
                ? (currentUser?.role === 'admin' && formData.role !== 'root' && formData.role !== 'audit') 
                : (currentUser?.role !== 'root' && formData.role !== 'root' && formData.role !== 'audit')
              ) && (
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', mt: 0.5 }}>
                  {currentUser?.role === 'admin' 
                    ? 'Administrator 권한으로는 System Administrator와 Auditor 역할의 회사만 변경할 수 있습니다.'
                    : 'System Administrator와 Auditor 역할만 회사를 선택할 수 있습니다.'
                  }
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: '0.75rem' }}>{t('defaultLanguage')}</InputLabel>
              <Select
                value={formData.default_language}
                label={t('defaultLanguage')}
                onChange={(e) => setFormData({ ...formData, default_language: e.target.value })}
                sx={{ 
                  '& .MuiSelect-select': { fontSize: '0.75rem' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                  }
                }}
              >
                <MenuItem value="ko" sx={{ fontSize: '0.75rem' }}>{t('korean')}</MenuItem>
                <MenuItem value="en" sx={{ fontSize: '0.75rem' }}>{t('english')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ 
              fontSize: '0.75rem',
              textTransform: 'none',
              borderRadius: 2,
              py: 0.8,
              px: 2
            }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained" 
            sx={{ 
              fontSize: '0.75rem',
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: 2,
              py: 0.8,
              px: 2,
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#145ea8' }
            }}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 정보 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: '1.2rem', color: '#1976d2' }} />
          {t('userInfo')}
        </DialogTitle>
        <DialogContent>
          {viewingUser && (
            <Box sx={{ pt: 1 }}>
              {/* 사용자 기본 정보 */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#1976d2' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
                    {t('username')}: {viewingUser.username}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    {t('userId')}: {viewingUser.userid}
                  </Typography>
                  {canViewRole(viewingUser.role) ? (
                    <Chip
                      label={getRoleLabel(viewingUser.role)}
                      color={getRoleColor(viewingUser.role) as any}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ) : (
                    <Chip
                      label="제한됨"
                      color="default"
                      size="small"
                      sx={{ fontSize: '0.75rem', opacity: 0.6 }}
                    />
                  )}
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BusinessIcon sx={{ fontSize: '1rem', color: '#666' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                      회사: {viewingUser.company?.name || '-'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon sx={{ fontSize: '1rem', color: '#666' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                      기본 언어: {viewingUser.default_language === 'ko' ? '한국어' : 'English'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* 상세 정보 */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon sx={{ fontSize: '1rem', color: '#666' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      생성일
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', ml: 3 }}>
                    {new Date(viewingUser.create_date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <UpdateIcon sx={{ fontSize: '1rem', color: '#666' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      최종 수정일
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', ml: 3 }}>
                    {new Date(viewingUser.update_date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* 사용자 ID 정보 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  시퀀스 ID:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                  {viewingUser.id}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setViewDialogOpen(false)} 
            sx={{ fontSize: '0.75rem' }}
          >
            닫기
          </Button>
          <Button 
            onClick={() => {
              setViewDialogOpen(false);
              handleEditUser(viewingUser!);
            }} 
            variant="contained" 
            sx={{ fontSize: '0.75rem' }}
          >
            수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 성공 메시지 Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserListPage; 