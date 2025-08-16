// Version: 202505160417
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import axios from 'axios';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface Menu {
  menu_id: number;
  name: string;
  icon: string;
  order_num: number;
  parent_id: number | null;
  children?: Menu[];
}

const MenuMngPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [orderNum, setOrderNum] = useState(1);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const drawerWidth = 220;

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/menus');
      console.log('Received menu data:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setMenus(response.data);
      } else {
        setMenus([]);
      }
    } catch (error) {
      console.error('메뉴 데이터를 불러오는데 실패했습니다:', error);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(userData);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchMenus();
  }, []);

  const toggleMenu = (menuId: number) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleAdd = (parent_id: number | null = null) => {
    setEditMenu(null);
    setParentId(parent_id);
    setName('');
    setIcon('');
    setOrderNum(1);
    setDialogOpen(true);
  };

  const handleEdit = (menu: Menu) => {
    setEditMenu(menu);
    setParentId(menu.parent_id);
    setName(menu.name);
    setIcon(menu.icon);
    setOrderNum(menu.order_num);
    setDialogOpen(true);
  };

  const handleDelete = async (menu_id: number) => {
    try {
      await axios.delete(`/api/menus/${menu_id}`);
      await fetchMenus();
    } catch (error) {
      console.error('메뉴 삭제에 실패했습니다:', error);
    }
  };

  const handleDialogSave = async () => {
    try {
      const menuData = {
        name,
        icon,
        order_num: orderNum,
        parent_id: parentId
      };

      if (editMenu) {
        await axios.put(`/api/menus/${editMenu.menu_id}`, menuData);
      } else {
        await axios.post('/api/menus', menuData);
      }
      
      // 메뉴 목록 새로고침
      await fetchMenus();
      
      // 다이얼로그 닫기
      setDialogOpen(false);
      
      // 상태 초기화
      setEditMenu(null);
      setParentId(null);
      setName('');
      setIcon('');
      setOrderNum(1);
    } catch (error) {
      console.error('메뉴 저장에 실패했습니다:', error);
    }
  };

  // 트리 구조로 메뉴 렌더링
  const renderMenuTree = (menu: Menu, level = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.includes(menu.menu_id);
    return (
      <React.Fragment key={menu.menu_id}>
        <TableRow
          hover
          sx={{
            border: 0,
            background: level === 0 ? '#fff' : '#f7fafd',
            transition: 'background 0.2s',
            '&:hover': { background: '#f0f6ff' },
            boxShadow: level === 0 ? '0 2px 8px rgba(25, 118, 210, 0.04)' : 'none',
            borderLeft: level === 0 ? '4px solid #1976d2' : '4px solid transparent',
            fontFamily: `'Pretendard', 'Noto Sans KR', 'Roboto', 'Apple SD Gothic Neo', 'sans-serif'`,
          }}
        >
          <TableCell sx={{ pl: 1 + level * 9, py: 0.7, border: 0, fontSize: level === 0 ? '0.8rem' : '0.75rem', fontWeight: level === 0 ? 600 : 400, color: level === 0 ? '#222' : '#4b5b6b', background: 'none', borderRadius: level === 0 ? '8px 0 0 8px' : 0 }}>
            <Box display="flex" alignItems="center" gap={1}>
              {hasChildren && (
                <IconButton
                  size="small"
                  onClick={() => toggleMenu(menu.menu_id)}
                  sx={{ p: 0.5, mr: 0.5, color: '#1976d2' }}
                >
                  {isExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </IconButton>
              )}
              <span style={{ fontWeight: level === 0 ? 600 : 400 }}>{menu.name}</span>
            </Box>
          </TableCell>
          <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{menu.icon}</TableCell>
          <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{menu.order_num}</TableCell>
          <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{menu.parent_id ?? '-'}</TableCell>
          <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
            {currentUser?.role === 'root' ? (
              <>
                <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(menu)} sx={{ minWidth: 0, px: 0.7, fontSize: '0.75rem', color: '#1976d2', textTransform: 'none', mr: 0.5, borderRadius: 2, bgcolor: 'rgba(25,118,210,0.04)', '&:hover': { bgcolor: 'rgba(25,118,210,0.10)' } }}>수정</Button>
                <Button size="small" startIcon={<DeleteIcon />} onClick={() => handleDelete(menu.menu_id)} sx={{ minWidth: 0, px: 0.7, fontSize: '0.75rem', color: '#d32f2f', textTransform: 'none', mr: 0.5, borderRadius: 2, bgcolor: 'rgba(211,47,47,0.04)', '&:hover': { bgcolor: 'rgba(211,47,47,0.10)' } }}>삭제</Button>
                <Button size="small" startIcon={<AddIcon />} onClick={() => handleAdd(menu.menu_id)} sx={{ minWidth: 0, px: 0.7, fontSize: '0.75rem', color: '#1976d2', textTransform: 'none', borderRadius: 2, bgcolor: 'rgba(25,118,210,0.04)', '&:hover': { bgcolor: 'rgba(25,118,210,0.10)' } }}>하위 메뉴 추가</Button>
              </>
            ) : (
              <span style={{ color: '#999', fontSize: '0.75rem' }}>시스템 관리자만 수정 가능</span>
            )}
          </TableCell>
        </TableRow>
        {hasChildren && (
          <TableRow sx={{ border: 0 }}>
            <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
              <Collapse in={isExpanded}>
                <Box>
                  {Array.isArray(menu.children) && [...menu.children].sort((a, b) => a.order_num - b.order_num).map(child => renderMenuTree(child, level + 1))}
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* 상단 AppBar */}
      <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, zIndex: 1201 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>MVS 2.0</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography>안녕하세요, Minsub Lee님</Typography>
            <IconButton color="inherit" onClick={() => {/* 로그아웃 로직 */}}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {/* 좌측 Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#1976d2', color: '#fff' },
          zIndex: 1202
        }}
      >
        <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>
          MVS
        </Box>
        <Divider sx={{ background: 'rgba(255,255,255,0.2)' }} />
        {/* 트리 메뉴 렌더링 */}
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List>
            <ListItem button>
              <ListItemIcon sx={{ color: '#fff' }}><DashboardIcon /></ListItemIcon>
              <ListItemText primary="정보관리" />
            </ListItem>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              <ListItem button><ListItemText primary="사용자 관리" /></ListItem>
              <ListItem button><ListItemText primary="메뉴 관리" /></ListItem>
              <ListItem button><ListItemText primary="메뉴권한관리" /></ListItem>
              <ListItem button><ListItemText primary="협력업체 관리" /></ListItem>
              <ListItem button><ListItemText primary="공급업체 관리" /></ListItem>
              <ListItem button><ListItemText primary="회사 등록 정보 관리" /></ListItem>
            </List>
            <ListItem button>
              <ListItemIcon sx={{ color: '#fff' }}><DashboardIcon /></ListItemIcon>
              <ListItemText primary="청구서 관리" />
            </ListItem>
            <ListItem button>
              <ListItemIcon sx={{ color: '#fff' }}><DashboardIcon /></ListItemIcon>
              <ListItemText primary="결제 관리" />
            </ListItem>
          </List>
        </Box>
        <Divider sx={{ background: 'rgba(255,255,255,0.2)' }} />
      </Drawer>
      {/* 메인 컨텐츠 */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Box sx={{ width: drawerWidth }} /> {/* Drawer 공간 확보 */}
        <Box sx={{ flexGrow: 1, pt: 10, px: 3, pb: 6 }}>
          <Box p={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight={700} fontSize="0.85rem" sx={{ letterSpacing: 0.5 }}>메뉴 관리</Typography>
              {currentUser?.role === 'root' && (
                <Button variant="contained" size="medium" startIcon={<AddIcon />} onClick={() => handleAdd(null)} sx={{ fontSize: '0.8rem', textTransform: 'none', boxShadow: 'none', borderRadius: 2, py: 0.8, px: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}>상위 메뉴 추가</Button>
              )}
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
                <CircularProgress size={18} />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ border: 0, background: '#f7fafd' }}>
                      <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>메뉴명</TableCell>
                      <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>아이콘</TableCell>
                      <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>순서</TableCell>
                      <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>상위 메뉴</TableCell>
                      <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>기능</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...menus].sort((a, b) => a.order_num - b.order_num).map(menu => renderMenuTree(menu))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
              <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>{editMenu ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>
              <DialogContent>
                <TextField
                  label="메뉴명"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  margin="normal"
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                />
                <TextField
                  label="아이콘"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  fullWidth
                  margin="normal"
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                />
                <TextField
                  label="순서"
                  type="number"
                  value={orderNum}
                  onChange={(e) => setOrderNum(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                />
              </DialogContent>
              <DialogActions sx={{ pb: 2, pr: 2 }}>
                <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>취소</Button>
                <Button onClick={handleDialogSave} variant="contained" sx={{ textTransform: 'none', fontSize: '0.75rem' }}>저장</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Box>
      </Box>
      {/* 하단 푸터 */}
      <Box sx={{ width: '100%', textAlign: 'center', py: 2, color: '#888', fontSize: 13, letterSpacing: 0.2, background: 'none' }}>
        powered by Minsub Ventures Private Limited | mvs 2.0
      </Box>
    </Box>
  );
};

export default MenuMngPage; 