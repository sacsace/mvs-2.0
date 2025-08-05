import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface Company {
  company_id: number;
  name: string;
}

interface User {
  id: number;
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
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user', company_id: 1 });
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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

      setUsers(usersRes.data);
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
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDialogOpen = () => {
    if (companies.length === 0) {
      setError('회사 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }
    setNewUser({ username: '', password: '', role: 'user', company_id: companies[0]?.company_id || 1 });
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

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }
    try {
      await axios.post('/api/users', newUser);
      fetchUsers();
      setDialogOpen(false);
    } catch (err) {
      setError('사용자 추가에 실패했습니다.');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} fontSize="0.85rem">사용자 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleDialogOpen} sx={{ fontSize: '0.8rem', textTransform: 'none' }}>사용자 추가</Button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress size={18} />
        </Box>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} hover sx={{ '&:hover': { background: '#f0f6ff' } }}>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.username}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.id}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.role}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.company?.name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.create_date ? new Date(user.create_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.update_date ? new Date(user.update_date).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>사용자 추가</DialogTitle>
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
            label="비밀번호" 
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
            <MenuItem value="root" sx={{ fontSize: '0.75rem' }}>root</MenuItem>
            <MenuItem value="admin" sx={{ fontSize: '0.75rem' }}>admin</MenuItem>
            <MenuItem value="user" sx={{ fontSize: '0.75rem' }}>user</MenuItem>
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
          <Button onClick={handleAddUser} variant="contained" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>저장</Button>
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