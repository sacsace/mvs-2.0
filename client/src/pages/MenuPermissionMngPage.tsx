import React, { useEffect, useState } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  role: string;
  company_id: number;
}

interface Menu {
  menu_id: number;
  name: string;
  parent_id: number | null;
  children?: Menu[];
}

interface MenuPermission {
  id: number;
  menu_id: number;
  role: string;
}

const roleOptions = ['root', 'admin', 'user', 'none'];

const MenuPermissionMngPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 사용자 목록과 메뉴 목록 로드
  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/users'),
      axios.get('/api/menus')
    ])
      .then(([userRes, menuRes]) => {
        setUsers(userRes.data);
        // 메뉴 데이터 구조 처리
        const menuData = menuRes.data.rootMenus || menuRes.data;
        setMenus(menuData);
      })
      .catch((error) => {
        console.error('데이터 로드 중 오류:', error);
        setSnackbar({
          open: true,
          message: '데이터를 불러오는데 실패했습니다.',
          severity: 'error'
        });
      })
      .finally(() => setLoading(false));
  }, []);

  // 선택된 사용자의 권한 로드
  useEffect(() => {
    if (selectedUserId) {
      setLoading(true);
      axios.get(`/api/menu-permissions/user/${selectedUserId}`)
        .then(res => setPermissions(res.data))
        .catch(() => setPermissions([]))
        .finally(() => setLoading(false));
    }
  }, [selectedUserId]);

  const handleUserChange = (event: SelectChangeEvent<number>) => {
    setSelectedUserId(event.target.value as number);
  };

  const handlePermissionChange = (menuId: number, role: string) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.menu_id === menuId);
      if (existing) {
        return prev.map(p => p.menu_id === menuId ? { ...p, role } : p);
      } else {
        return [...prev, { id: Date.now(), menu_id: menuId, role }];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      setSnackbar({
        open: true,
        message: '사용자를 선택해주세요.',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`/api/menu-permissions/user/${selectedUserId}`, permissions);
      setSnackbar({
        open: true,
        message: '권한이 저장되었습니다.',
        severity: 'success'
      });
    } catch (error) {
      console.error('권한 저장 중 오류:', error);
      setSnackbar({
        open: true,
        message: '권한 저장에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermission = (menuId: number): string => {
    const permission = permissions.find(p => p.menu_id === menuId);
    return permission ? permission.role : 'none';
  };

  const renderMenuTree = (menu: Menu, level = 0) => {
    return (
      <React.Fragment key={menu.menu_id}>
        <TableRow sx={{ background: level === 0 ? '#fff' : '#f8fafc' }}>
          <TableCell sx={{ pl: 1.2 + level * 1.5, py: 0.5, fontSize: level === 0 ? '0.85rem' : '0.75rem', fontWeight: level === 0 ? 600 : 400, color: level === 0 ? '#222' : '#6b7a90', border: 0, background: 'inherit' }}>
            {menu.name}
          </TableCell>
          <TableCell sx={{ py: 0.5, border: 0, background: 'inherit' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={getPermission(menu.menu_id)}
                onChange={(e) => handlePermissionChange(menu.menu_id, e.target.value)}
                disabled={!selectedUserId}
                sx={{ fontSize: '0.8rem' }}
              >
                {roleOptions.map(role => (
                  <MenuItem key={role} value={role} sx={{ fontSize: '0.8rem' }}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </TableCell>
        </TableRow>
        {menu.children && menu.children.map(child => renderMenuTree(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <Box p={2}>
      <Typography variant="h6" fontWeight={700} fontSize="0.85rem" sx={{ letterSpacing: 0.5, mb: 2 }}>
        메뉴 권한 관리
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>사용자 선택</InputLabel>
          <Select
            value={selectedUserId || ''}
            label="사용자 선택"
            onChange={handleUserChange}
            sx={{ fontSize: '0.8rem' }}
          >
            {users.map(user => (
              <MenuItem key={user.id} value={user.id} sx={{ fontSize: '0.8rem' }}>
                사용자명: {user.username} (ID: {user.id}, {user.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
                  메뉴명
                </TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.85rem', color: '#222', border: 0, background: 'inherit' }}>
                  권한
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menus.map(menu => (
                <React.Fragment key={menu.menu_id}>
                  {renderMenuTree(menu)}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !selectedUserId}
          sx={{
            textTransform: 'none',
            fontSize: '0.8rem',
            px: 2,
            py: 1,
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' }
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </Box>

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

export default MenuPermissionMngPage; 