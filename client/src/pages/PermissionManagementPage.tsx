import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security,
  Business,
  Person,
  Edit,
  Delete,
  Add,
  Visibility,
  AdminPanelSettings,
  SupervisorAccount,
  PersonOff,
  VerifiedUser,
  Search
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface Permission {
  id: number;
  name: string;
  description: string;
  level: 'root' | 'admin' | 'regular' | 'audit';
  company_access: 'all' | 'own' | 'none';
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  company_id: number;
  company_name?: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  level: string;
  company_access: string;
}

const PermissionManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'regular' as 'root' | 'admin' | 'regular' | 'audit',
    company_access: 'own' as 'all' | 'own' | 'none'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{[key: number]: number[]}>({});
  const [permissionRoles, setPermissionRoles] = useState<{[key: number]: Role[]}>({});

  const [currentUser, setCurrentUser] = useState<any>({});

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    let userData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Loading user data from localStorage:', userData);
    
    // localStorage에 사용자 정보가 없으면 JWT 토큰에서 추출
    if (!userData || !userData.role) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Extracted user data from JWT:', payload);
          userData = payload;
        } catch (error) {
          console.error('JWT 토큰 파싱 오류:', error);
        }
      }
    }
    
    console.log('Final user data:', userData);
    setCurrentUser(userData);
  }, []);

  const userRole = currentUser.role;
  const userCompanyId = currentUser.company_id;

  useEffect(() => {
    if (currentUser && currentUser.role) { // 사용자 정보가 로드된 후에만 데이터 가져오기
      const loadAllData = async () => {
        try {
          console.log('권한 관리 페이지 데이터 로드 시작');
          console.log('현재 사용자:', currentUser);
          setLoading(true);
          await Promise.all([
            fetchPermissions(),
            fetchUsers(),
            fetchCompanies(),
            fetchRoles()
          ]);
          console.log('권한 관리 페이지 데이터 로드 완료');
        } catch (error) {
          console.error('데이터 로드 오류:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [currentUser]);

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      } else {
        setError('권한 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('권한 목록 조회 오류:', error);
      setError('권한 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 권한에 따라 사용자 필터링
        let filteredUsers = data;
        if (userRole === 'admin' || userRole === 'regular') {
          // admin과 regular는 자사 사용자만 볼 수 있음
          filteredUsers = data.filter((user: User) => user.company_id === userCompanyId);
        }
        // audit는 모든 사용자를 볼 수 있음 (검색 가능)
        // root는 모든 사용자를 볼 수 있음
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
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
        // 권한에 따라 회사 필터링
        let filteredCompanies = data;
        if (userRole === 'admin' || userRole === 'regular') {
          // admin과 regular는 자사만 볼 수 있음
          filteredCompanies = data.filter((company: any) => company.company_id === userCompanyId);
        }
        // audit는 모든 회사를 볼 수 있음 (검색 가능)
        // root는 모든 회사를 볼 수 있음
        setCompanies(filteredCompanies);
      } else {
        console.error('회사 목록 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('회사 목록 조회 오류:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        // 각 역할의 권한 정보도 함께 가져오기
        await Promise.all(data.map(async (role: Role) => {
          await fetchRolePermissions(role.id);
        }));
      } else {
        console.error('역할 목록 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('역할 목록 조회 오류:', error);
    }
  };

  const fetchRolePermissions = async (roleId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRolePermissions(prev => ({
          ...prev,
          [roleId]: data.map((p: any) => p.id)
        }));
        
        // 권한별 역할 정보 업데이트
        data.forEach((permission: any) => {
          setPermissionRoles(prev => ({
            ...prev,
            [permission.id]: [...(prev[permission.id] || []), roles.find(r => r.id === roleId)!]
          }));
        });
      }
    } catch (error) {
      console.error('역할 권한 조회 오류:', error);
    }
  };

  const handleAddPermission = () => {
    setEditingPermission(null);
    setFormData({
      name: '',
      description: '',
      level: 'regular',
      company_access: 'own'
    });
    setDialogOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description,
      level: permission.level,
      company_access: permission.company_access
    });
    setDialogOpen(true);
  };

  const handleSavePermission = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingPermission ? `/api/permissions/${editingPermission.id}` : '/api/permissions';
      const method = editingPermission ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchPermissions();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '권한 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('권한 저장 오류:', error);
      setError('권한 저장에 실패했습니다.');
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (window.confirm('정말로 이 권한을 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/permissions/${permissionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchPermissions();
        } else {
          setError('권한 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('권한 삭제 오류:', error);
        setError('권한 삭제에 실패했습니다.');
      }
    }
  };

  const getRoleColor = (level: string) => {
    switch (level) {
      case 'root':
        return 'error';
      case 'admin':
        return 'warning';
      case 'audit':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (level: string) => {
    switch (level) {
      case 'root':
        return <AdminPanelSettings />;
      case 'admin':
        return <SupervisorAccount />;
      case 'audit':
        return <VerifiedUser />;
      default:
        return <Person />;
    }
  };

  const getCompanyAccessLabel = (access: string) => {
    switch (access) {
      case 'all':
        return '모든 회사';
      case 'own':
        return '자사만';
      case 'none':
        return '접근 불가';
      default:
        return access;
    }
  };

  const getCompanyAccessColor = (access: string) => {
    switch (access) {
      case 'all':
        return 'success';
      case 'own':
        return 'primary';
      case 'none':
        return 'error';
      default:
        return 'default';
    }
  };

  // 검색 필터링된 권한 목록
  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !currentUser.role) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Security sx={{ fontSize: '1.5rem', color: '#1976d2' }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
            권한 관리
          </Typography>
        </Box>
        {(userRole === 'root' || userRole === 'admin' || userRole === 'audit') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddPermission}
            sx={{ fontSize: '0.8rem', textTransform: 'none', boxShadow: 'none', borderRadius: 2, py: 0.8, px: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}
          >
            권한 추가
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 권한 레벨별 요약 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AdminPanelSettings sx={{ fontSize: '1.5rem', color: '#d32f2f', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Root
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                최고 관리자 권한
              </Typography>
              <Chip 
                label={`${permissions.filter(p => p.level === 'root').length}개`}
                color="error"
                size="small"
                sx={{ mt: 1, fontSize: '0.65rem' }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SupervisorAccount sx={{ fontSize: '1.5rem', color: '#ed6c02', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Admin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                관리자 권한
              </Typography>
              <Chip 
                label={`${permissions.filter(p => p.level === 'admin').length}개`}
                color="warning"
                size="small"
                sx={{ mt: 1, fontSize: '0.65rem' }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: '2rem', color: '#1976d2', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Regular
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                일반 사용자 권한
              </Typography>
              <Chip 
                label={`${permissions.filter(p => p.level === 'regular').length}개`}
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <VerifiedUser sx={{ fontSize: '2rem', color: '#0288d1', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Audit
              </Typography>
                             <Typography variant="body2" color="text.secondary">
                 관리자 권한 + 전체 검색
               </Typography>
              <Chip 
                label={`${permissions.filter(p => p.level === 'audit').length}개`}
                color="info"
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 권한 목록 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
            권한 목록
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ border: 0, background: '#f7fafd' }}>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>권한명</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>설명</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>레벨</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>회사 접근</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>역할 수</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>생성일</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id} sx={{ border: 0 }}>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                        {permission.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {permission.description}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      <Chip
                        icon={getRoleIcon(permission.level)}
                        label={permission.level.toUpperCase()}
                        color={getRoleColor(permission.level) as any}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      <Chip
                        label={getCompanyAccessLabel(permission.company_access)}
                        color={getCompanyAccessColor(permission.company_access) as any}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`${permissionRoles[permission.id]?.length || 0}개`}
                          size="small"
                          color={permissionRoles[permission.id]?.length > 0 ? 'primary' : 'default'}
                          sx={{ fontSize: '0.65rem' }}
                        />
                        {permissionRoles[permission.id]?.length > 0 && (
                          <Tooltip title={permissionRoles[permission.id].map(r => r.name).join(', ')}>
                            <IconButton size="small" sx={{ p: 0.5 }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {new Date(permission.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPermission(permission)}
                            disabled={userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit'}
                            sx={{ p: 0.5, color: '#666', '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePermission(permission.id)}
                            disabled={userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit'}
                            sx={{ p: 0.5, color: '#666', '&:hover': { color: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.1)' } }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 권한 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          {editingPermission ? '권한 수정' : '권한 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="권한명"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              size="small"
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              size="small"
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>권한 레벨</InputLabel>
              <Select
                value={formData.level}
                label="권한 레벨"
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                size="small"
                sx={{ '& .MuiSelect-select': { fontSize: '0.75rem' } }}
              >
                <MenuItem value="root" sx={{ fontSize: '0.75rem' }}>Root (최고 관리자)</MenuItem>
                <MenuItem value="admin" sx={{ fontSize: '0.75rem' }}>Admin (관리자)</MenuItem>
                <MenuItem value="regular" sx={{ fontSize: '0.75rem' }}>Regular (일반 사용자)</MenuItem>
                <MenuItem value="audit" sx={{ fontSize: '0.75rem' }}>Audit (감사)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: '0.75rem' }}>회사 접근 권한</InputLabel>
              <Select
                value={formData.company_access}
                label="회사 접근 권한"
                onChange={(e) => setFormData({ ...formData, company_access: e.target.value as any })}
                size="small"
                sx={{ '& .MuiSelect-select': { fontSize: '0.75rem' } }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>모든 회사</MenuItem>
                <MenuItem value="own" sx={{ fontSize: '0.75rem' }}>자사만</MenuItem>
                <MenuItem value="none" sx={{ fontSize: '0.75rem' }}>접근 불가</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2 }}>취소</Button>
          <Button onClick={handleSavePermission} variant="contained" sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionManagementPage; 