import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert, IconButton, FormControl, InputLabel, Select, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { useMenuPermission, getAvailableRoles, filterUsersByPermission } from '../hooks/useMenuPermission';

interface Company {
  company_id: number;
  name: string;
}

interface User {
  id: number;
  userid?: string;
  username: string;
  role: string;
  company_id: number;
  company?: {
    name: string;
  };
  create_date?: string;
  update_date?: string;
}

const UserPage: React.FC = () => {
  const { permission: userMenuPermission, currentUser } = useMenuPermission('사용자 관리');
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // 전체 사용자 목록 저장
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user', company_id: 1 });
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // 검색 관련 state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('전체');



  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users and companies...');
      const [usersRes, companiesRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/companies')
      ]);
      
      console.log('Users response:', {
        status: usersRes.status,
        statusText: usersRes.statusText,
        data: usersRes.data
      });
      console.log('Companies response:', {
        status: companiesRes.status,
        statusText: companiesRes.statusText,
        data: companiesRes.data
      });

      if (!Array.isArray(usersRes.data)) {
        throw new Error('Invalid response format: users data is not an array');
      }

      // 권한 기반 사용자 필터링 적용
      const filteredUsers = currentUser ? filterUsersByPermission(usersRes.data, currentUser.role) : usersRes.data;
      console.log('권한 필터링 적용:', {
        전체사용자수: usersRes.data.length,
        필터링후사용자수: filteredUsers.length,
        현재사용자권한: currentUser?.role
      });
      
      setAllUsers(filteredUsers); // 전체 목록 저장
      setUsers(filteredUsers); // 화면에 표시할 목록
      setCompanies(companiesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
      }
      setError('데이터를 불러오는데 실패했습니다.');
      setSnackbar({
        open: true,
        message: `사용자 정보를 불러오는데 실패했습니다. ${axios.isAxiosError(error) ? error.response?.data?.details || '' : ''}`,
        severity: 'error'
      });
      setUsers([]);
      setAllUsers([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // 현재 사용자가 볼 수 있는 역할 목록 가져오기
  const getAvailableRoleOptions = () => {
    console.log('🔍 getAvailableRoleOptions 호출됨, currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('❌ currentUser가 없음, ["전체"] 반환');
      return ['전체'];
    }
    
    const availableRoles = [];
    if (currentUser.role === 'root') {
      availableRoles.push('관리자', '감사자', '일반');
      console.log('✅ ROOT 사용자 - 모든 역할 표시:', availableRoles);
    } else if (currentUser.role === 'admin' || currentUser.role === 'audit') {
      availableRoles.push('일반');
      console.log('✅ ADMIN/AUDIT 사용자 - 일반만 표시:', availableRoles);
    } else {
      console.log('✅ USER 사용자 - 아무 역할 없음');
    }
    
    const result = ['전체', ...availableRoles];
    console.log('🎯 최종 역할 옵션:', result);
    return result;
  };

  // 검색 및 역할 필터링 적용
  const applyFilters = () => {
    let filtered = [...allUsers];

    // 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.userid && user.userid.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 역할 필터링
    if (selectedRole !== '전체') {
      let roleFilter = '';
      switch (selectedRole) {
        case '관리자':
          roleFilter = 'admin';
          break;
        case '감사자':
          roleFilter = 'audit';
          break;
        case '일반':
          roleFilter = 'user';
          break;
        default:
          roleFilter = selectedRole;
      }
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setUsers(filtered);
  };

  // 검색어나 역할 선택이 변경될 때마다 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedRole, allUsers]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);



  const handleDialogOpen = () => {
    if (!currentUser) {
      setError('사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    if (!userMenuPermission.can_create) {
      setError('사용자를 추가할 권한이 없습니다.');
      return;
    }

    const availableRoles = getAvailableRoles(currentUser.role);
    if (availableRoles.length === 0) {
      setError('사용자를 추가할 권한이 없습니다.');
      return;
    }

    if (companies.length === 0) {
      setError('회사 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }
    
    setEditingUser(null);
    setNewUser({ username: '', password: '', role: availableRoles[0], company_id: companies[0]?.company_id || 1 });
    setError(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    if (!currentUser) {
      setError('사용자 정보를 불러올 수 없습니다.');
      return;
    }

    if (!userMenuPermission.can_update) {
      setError('사용자를 수정할 권한이 없습니다.');
      return;
    }

    const availableRoles = getAvailableRoles(currentUser.role);
    if (availableRoles.length === 0 || !availableRoles.includes(user.role)) {
      setError('이 사용자를 수정할 권한이 없습니다.');
      return;
    }

    setEditingUser(user);
    setNewUser({ 
      username: user.username, 
      password: '', 
      role: user.role, 
      company_id: user.company_id 
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, role: e.target.value });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, company_id: Number(e.target.value) });
  };

  const handleSaveUser = async () => {
    if (!newUser.username || (!editingUser && !newUser.password)) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }

    if (!currentUser) {
      setError('현재 사용자 정보를 불러올 수 없습니다.');
      return;
    }

    const availableRoles = getAvailableRoles(currentUser.role);
    if (!availableRoles.includes(newUser.role)) {
      setError('선택한 역할을 부여할 권한이 없습니다.');
      return;
    }

    try {
      if (editingUser) {
        // 사용자 수정
        const updateData = {
          username: newUser.username,
          role: newUser.role,
          company_id: newUser.company_id,
          ...(newUser.password && { password: newUser.password })
        };
        await axios.put(`/api/users/${editingUser.id}`, updateData);
        setSnackbar({
          open: true,
          message: '사용자가 성공적으로 수정되었습니다.',
          severity: 'success'
        });
      } else {
        // 사용자 추가
        await axios.post('/api/users', newUser);
        setSnackbar({
          open: true,
          message: '사용자가 성공적으로 추가되었습니다.',
          severity: 'success'
        });
      }
      fetchUsers();
      setDialogOpen(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || (editingUser ? '사용자 수정에 실패했습니다.' : '사용자 추가에 실패했습니다.');
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} fontSize="0.85rem">사용자 관리</Typography>
        {currentUser && userMenuPermission.can_create && getAvailableRoles(currentUser.role).length > 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleDialogOpen} sx={{ fontSize: '0.8rem', textTransform: 'none' }}>사용자 추가</Button>
        )}
      </Box>

      {/* 검색 영역 */}
      <Paper sx={{ p: 2, mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="사용자 ID 또는 이름 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666', fontSize: '1rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>역할</InputLabel>
            <Select
              value={selectedRole}
              label="역할"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {getAvailableRoleOptions().map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton 
            size="small" 
            onClick={() => {
              setSearchTerm('');
              setSelectedRole('전체');
            }}
            sx={{ color: '#666' }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress size={18} />
        </Box>
      ) : users.length === 0 ? (
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
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#f7fafd' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>사용자명</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>권한</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>회사</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>생성일</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>수정일</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222', textAlign: 'center' }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => {
                const hasRolePermission = currentUser && getAvailableRoles(currentUser.role).includes(user.role);
                const hasMenuPermission = userMenuPermission.can_update;
                const canEdit = hasRolePermission && hasMenuPermission;
                
                return (
                  <TableRow key={user.id} hover sx={{ '&:hover': { background: '#f0f6ff' } }}>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.username}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.id}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.role}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.company?.name || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.create_date ? new Date(user.create_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.update_date ? new Date(user.update_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditUser(user)}
                        disabled={!canEdit}
                        sx={{ 
                          fontSize: '0.75rem',
                          color: canEdit ? '#1976d2' : '#ccc',
                          '&:hover': { 
                            backgroundColor: canEdit ? 'rgba(25, 118, 210, 0.1)' : 'transparent' 
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          {editingUser ? '사용자 수정' : '사용자 추가'}
        </DialogTitle>
        <DialogContent>
          <TextField 
            label="아이디" 
            name="username" 
            value={newUser.username} 
            onChange={handleInputChange} 
            fullWidth 
            size="small"
            sx={{ mt: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
          />
          <TextField 
            label={editingUser ? "비밀번호 (변경시에만 입력)" : "비밀번호"} 
            name="password" 
            type="password" 
            value={newUser.password} 
            onChange={handleInputChange} 
            fullWidth 
            size="small"
            sx={{ mt: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
          />
          <TextField 
            select 
            label="권한" 
            name="role" 
            value={newUser.role} 
            onChange={handleRoleChange} 
            fullWidth 
            size="small"
            sx={{ mt: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
          >
            {currentUser && getAvailableRoles(currentUser.role).map(role => (
              <MenuItem key={role} value={role} sx={{ fontSize: '0.75rem' }}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField 
            select 
            label="회사" 
            name="company_id" 
            value={newUser.company_id} 
            onChange={handleCompanyChange} 
            fullWidth 
            size="small"
            sx={{ mt: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
          >
            {companies.map(company => (
              <MenuItem key={company.company_id} value={company.company_id} sx={{ fontSize: '0.75rem' }}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>
          {error && <Typography color="error" sx={{ mt: 1, fontSize: '0.75rem' }}>{error}</Typography>}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleDialogClose} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>취소</Button>
          <Button onClick={handleSaveUser} variant="contained" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            {editingUser ? '수정' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', fontSize: '0.75rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserPage; 