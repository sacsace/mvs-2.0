import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import axios from 'axios';

interface MenuItem {
  menu_id: number;
  name: string;
  icon: string;
  url: string;
  order_num: number;
  parent_id: number | null;
  children?: MenuItem[];
}

const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    url: '',
    order_num: 1,
    parent_id: null as number | null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await axios.get('/api/menus/tree');
      if (response.data.success) {
        setMenus(response.data.data);
      }
    } catch (error) {
      console.error('메뉴 조회 실패:', error);
      setSnackbar({
        open: true,
        message: '메뉴를 불러오는데 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (menu?: MenuItem) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        name: menu.name,
        icon: menu.icon,
        url: menu.url,
        order_num: menu.order_num,
        parent_id: menu.parent_id
      });
    } else {
      setEditingMenu(null);
      setFormData({
        name: '',
        icon: '',
        url: '',
        order_num: 1,
        parent_id: null
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMenu(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingMenu) {
        await axios.put(`/api/menus/${editingMenu.menu_id}`, formData);
        setSnackbar({
          open: true,
          message: '메뉴가 성공적으로 수정되었습니다.',
          severity: 'success'
        });
      } else {
        await axios.post('/api/menus', formData);
        setSnackbar({
          open: true,
          message: '메뉴가 성공적으로 생성되었습니다.',
          severity: 'success'
        });
      }
      handleCloseDialog();
      fetchMenus();
    } catch (error) {
      console.error('메뉴 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '메뉴 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (menuId: number) => {
    if (window.confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/menus/${menuId}`);
        setSnackbar({
          open: true,
          message: '메뉴가 성공적으로 삭제되었습니다.',
          severity: 'success'
        });
        fetchMenus();
      } catch (error) {
        console.error('메뉴 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '메뉴 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    }
  };

  const renderMenuTree = (menuList: MenuItem[], level = 0) => {
    return menuList.map((menu) => (
      <React.Fragment key={menu.menu_id}>
        <ListItem sx={{ pl: level * 3 }}>
          <ListItemIcon>
            <MenuIcon />
          </ListItemIcon>
          <ListItemText
            primary={menu.name}
            secondary={
              <Box>
                <Chip 
                  label={`순서: ${menu.order_num}`} 
                  size="small" 
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={`URL: ${menu.url}`} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <IconButton 
              edge="end" 
              onClick={() => handleOpenDialog(menu)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              edge="end" 
              onClick={() => handleDelete(menu.menu_id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        {menu.children && menu.children.length > 0 && (
          <List component="div" disablePadding>
            {renderMenuTree(menu.children, level + 1)}
          </List>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* 헤더 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              메뉴 관리
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              새 메뉴 추가
            </Button>
          </Paper>
        </Grid>

        {/* 메뉴 트리 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="메뉴 구조"
              subheader="현재 등록된 메뉴들의 계층 구조"
            />
            <CardContent>
              {loading ? (
                <Typography>메뉴를 불러오는 중...</Typography>
              ) : (
                <List>
                  {renderMenuTree(menus)}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 메뉴 추가/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMenu ? '메뉴 수정' : '새 메뉴 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="메뉴명"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="아이콘"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                helperText="Material-UI 아이콘 이름 (예: home, person, settings)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                helperText="페이지 경로 (예: /users, /invoices)"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="순서"
                value={formData.order_num}
                onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>상위 메뉴</InputLabel>
                <Select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value as number | null })}
                  label="상위 메뉴"
                >
                  <MenuItem value="">없음 (최상위)</MenuItem>
                  {menus.map((menu) => (
                    <MenuItem key={menu.menu_id} value={menu.menu_id}>
                      {menu.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMenu ? '수정' : '추가'}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MenuManagement; 