import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Tabs, Tab
} from '@mui/material';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  role: string;
  company_id: number;
  company?: {
    name: string;
  };
}

interface Company {
  company_id: number;
  name: string;
}

interface Menu {
  menu_id: number;
  name: string;
  parent_id: number | null;
  order_num?: number;
  children?: Menu[];
}

interface MenuPermission {
  id?: number;
  user_id: number;
  menu_id: number;
  role: string;
}

const roleOptions = ['root', 'admin', 'user', 'none'];

const MenuAuthPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'}>({open: false, message: '', severity: 'success'});

  // 회사 목록과 사용자 목록 로드
  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/companies'),
      axios.get('/api/users'),
      axios.get('/api/menus/all')
    ]).then(([companyRes, userRes, menuRes]) => {
      setCompanies(companyRes.data);
      setUsers(userRes.data);
      setMenus(menuRes.data);
      if (companyRes.data.length > 0) {
        setSelectedCompanyId(companyRes.data[0].company_id);
      }
    }).catch(() => {
      setCompanies([]);
      setUsers([]);
      setMenus([]);
    }).finally(() => setLoading(false));
  }, []);

  // 선택된 회사의 사용자 목록 필터링
  const filteredUsers = users.filter(user => user.company_id === selectedCompanyId);

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

  const getPermission = (menu_id: number): string => {
    const perm = permissions.find(p => p.menu_id === menu_id);
    return perm ? perm.role : 'none';
  };

  const handlePermissionChange = (menu_id: number, role: string) => {
    setPermissions(perms => {
      const idx = perms.findIndex(p => p.menu_id === menu_id);
      if (idx !== -1) {
        const updated = [...perms];
        updated[idx] = { ...updated[idx], role };
        return updated;
      } else {
        return [...perms, { user_id: selectedUserId!, menu_id, role }];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      setSnackbar({open: true, message: '사용자를 선택해주세요.', severity: 'error'});
      return;
    }

    setSaving(true);
    try {
      await axios.post(`/api/menu-permissions/user/${selectedUserId}`, permissions);
      setSnackbar({open: true, message: '저장되었습니다.', severity: 'success'});
    } catch (e) {
      setSnackbar({open: true, message: '저장에 실패했습니다.', severity: 'error'});
    } finally {
      setSaving(false);
    }
  };

  const buildMenuTree = (flatMenus: Menu[]): Menu[] => {
    const menuMap: { [key: number]: Menu & { children: Menu[] } } = {};
    flatMenus.forEach(menu => {
      menuMap[menu.menu_id] = { ...menu, children: [] };
    });
    const tree: Menu[] = [];
    Object.values(menuMap).forEach(menu => {
      if (menu.parent_id && menuMap[menu.parent_id]) {
        menuMap[menu.parent_id].children.push(menu);
      } else {
        tree.push(menu);
      }
    });
    return tree;
  };

  const renderMenuTree = (menu: Menu, level = 0) => (
    <React.Fragment key={menu.menu_id}>
      <TableRow>
        <TableCell sx={{ pl: 1.2 + level * 2 }}>{menu.name}</TableCell>
        <TableCell align="center">
          <FormControl size="small" fullWidth>
            <Select
              value={getPermission(menu.menu_id)}
              onChange={e => handlePermissionChange(menu.menu_id, e.target.value)}
              disabled={!selectedUserId}
            >
              {roleOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt === 'none' ? '없음' : opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
      </TableRow>
      {menu.children && menu.children.map(child => renderMenuTree(child, level + 1))}
    </React.Fragment>
  );

  return (
    <Box p={3}>
      <Typography variant="h6" fontWeight={700} mb={2}>메뉴 권한 관리</Typography>
      
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="사용자별 권한" />
        <Tab label="회사별 권한" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box display="flex" gap={2} mb={2}>
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel>회사</InputLabel>
              <Select
                value={selectedCompanyId ?? ''}
                label="회사"
                onChange={e => {
                  setSelectedCompanyId(Number(e.target.value));
                  setSelectedUserId(null);
                }}
              >
                {companies.map(company => (
                  <MenuItem key={company.company_id} value={company.company_id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel>사용자</InputLabel>
              <Select
                value={selectedUserId ?? ''}
                label="사용자"
                onChange={e => setSelectedUserId(Number(e.target.value))}
                disabled={!selectedCompanyId}
              >
                {filteredUsers.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>메뉴명</TableCell>
                  <TableCell align="center">권한</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buildMenuTree(menus).map(menu => renderMenuTree(menu))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave} 
              disabled={saving || !selectedUserId}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </Box>
        </>
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={2000} 
        onClose={() => setSnackbar({...snackbar, open: false})} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ width: '100%' }} 
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MenuAuthPage; 