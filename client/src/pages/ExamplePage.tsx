import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

// 인터페이스 정의
interface ExampleItem {
  id: number;
  name: string;
  description: string;
  status: string;
  createDate: string;
}

// 페이지 컴포넌트
const ExamplePage: React.FC = () => {
  // 다국어 지원 훅 사용 (기본)
  const { t } = useLanguage();
  
  // 상태 관리
  const [items, setItems] = useState<ExampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExampleItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  // 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // API 호출 예시
      // const response = await fetch('/api/example');
      // const data = await response.json();
      // setItems(data);
      
      // 임시 데이터
      setItems([
        { id: 1, name: '예시 항목 1', description: '설명 1', status: 'active', createDate: '2024-01-01' },
        { id: 2, name: '예시 항목 2', description: '설명 2', status: 'inactive', createDate: '2024-01-02' }
      ]);
      setError(null);
    } catch (error) {
      setError(t('dataLoadError'));
    } finally {
      setLoading(false);
    }
  };

  // 이벤트 핸들러들
  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', status: 'active' });
    setDialogOpen(true);
  };

  const handleEdit = (item: ExampleItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      status: item.status
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        // API 호출 예시
        // await fetch(`/api/example/${id}`, { method: 'DELETE' });
        setItems(items.filter(item => item.id !== id));
      } catch (error) {
        setError(t('deleteError'));
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        // 수정 API 호출 예시
        // await fetch(`/api/example/${editingItem.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData)
        // });
        
        setItems(items.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...formData }
            : item
        ));
      } else {
        // 추가 API 호출 예시
        // const response = await fetch('/api/example', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData)
        // });
        // const newItem = await response.json();
        
        const newItem = {
          id: Math.max(...items.map(i => i.id)) + 1,
          ...formData,
          createDate: new Date().toISOString().split('T')[0]
        };
        setItems([...items, newItem]);
      }
      setDialogOpen(false);
    } catch (error) {
      setError(t('saveError'));
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          {t('examplePageTitle')}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ mr: 1 }}
          >
            {t('refresh')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            {t('add')}
          </Button>
        </Box>
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 데이터 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('id')}</TableCell>
              <TableCell>{t('name')}</TableCell>
              <TableCell>{t('description')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              <TableCell>{t('createDate')}</TableCell>
              <TableCell>{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('noData')}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: item.status === 'active' ? '#e8f5e8' : '#ffeaea',
                        color: item.status === 'active' ? '#2e7d32' : '#d32f2f',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      {t(item.status)}
                    </Box>
                  </TableCell>
                  <TableCell>{item.createDate}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? t('editItem') : t('addItem')}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained">
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamplePage; 