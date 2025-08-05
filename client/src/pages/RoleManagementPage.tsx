import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton, 
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
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
  BusinessCenter,
  Group,
  Search,
  Clear
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';


interface Role {
  id: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  level: 'root' | 'admin' | 'regular' | 'audit' | 'custom';
  company_access: 'all' | 'own' | 'none';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  level: 'root' | 'admin' | 'regular' | 'audit';
  company_access: 'all' | 'own' | 'none';
}

interface User {
  id: number;
  username: string;
  role: string;
  company_id: number;
  company_name?: string;
}

const RoleManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    level: 'custom' as 'root' | 'admin' | 'regular' | 'audit' | 'custom',
    company_access: 'own' as 'all' | 'own' | 'none'
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roleUsers, setRoleUsers] = useState<{[key: number]: User[]}>({});

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
          setLoading(true);
          await Promise.all([
            fetchRoles(),
            fetchPermissions(),
            fetchUsers()
          ]);
        } catch (error) {
          console.error('데이터 로드 오류:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [currentUser]);

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
        setFilteredRoles(data);
      } else {
        console.error('역할 목록 조회 실패:', response.status);
        setError('역할 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('역할 목록 조회 오류:', error);
      setError('역할 목록을 불러오는데 실패했습니다.');
    }
  };

  // 검색 함수
  const handleSearch = useCallback((searchValue: string) => {
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredRoles(roles);
      return;
    }

    const filtered = roles.filter((role) => {
      const searchLower = searchValue.toLowerCase();
      return (
        role.name.toLowerCase().includes(searchLower) ||
        role.name_en.toLowerCase().includes(searchLower) ||
        role.description.toLowerCase().includes(searchLower) ||
        role.description_en.toLowerCase().includes(searchLower) ||
        role.level.toLowerCase().includes(searchLower) ||
        role.company_access.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredRoles(filtered);
  }, [roles]);

  // 디바운싱 효과
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 검색어가 변경될 때마다 검색 실행
  useEffect(() => {
    handleSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, roles, handleSearch]);

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
        console.error('권한 목록 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('권한 목록 조회 오류:', error);
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
        setUsers(data);
        // 각 역할별 사용자 정보 계산
        const roleUserMap: {[key: number]: User[]} = {};
        data.forEach((user: User) => {
          // 사용자의 역할이 역할 ID와 일치하는지 확인
          const matchingRole = roles.find(role => role.name === user.role);
          if (matchingRole) {
            if (!roleUserMap[matchingRole.id]) {
              roleUserMap[matchingRole.id] = [];
            }
            roleUserMap[matchingRole.id].push(user);
          }
        });
        setRoleUsers(roleUserMap);
      } else {
        console.error('사용자 목록 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      name_en: '',
      description: '',
      description_en: '',
      level: 'custom',
      company_access: 'own'
    });
    setSelectedPermissions([]);
    setDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      name_en: role.name_en,
      description: role.description,
      description_en: role.description_en,
      level: role.level,
      company_access: role.company_access
    });
    // 역할의 권한들을 가져와서 설정
    fetchRolePermissions(role.id);
    setDialogOpen(true);
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
        setSelectedPermissions(data.map((p: Permission) => p.id));
      }
    } catch (error) {
      console.error('역할 권한 조회 오류:', error);
    }
  };

  const handleSaveRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          permission_ids: selectedPermissions
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchRoles();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '역할 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('역할 저장 오류:', error);
      setError('역할 저장에 실패했습니다.');
    }
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setRoleToDelete(null);
        fetchRoles();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '역할 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('역할 삭제 오류:', error);
      setError('역할 삭제에 실패했습니다.');
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'root': return 'error';
      case 'admin': return 'warning';
      case 'audit': return 'info';
      case 'regular': return 'success';
      case 'custom': return 'default';
      default: return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'root': return <AdminPanelSettings />;
      case 'admin': return <BusinessCenter />;
      case 'audit': return <VerifiedUser />;
      case 'regular': return <Person />;
      case 'custom': return <Group />;
      default: return <Person />;
    }
  };

  const getCompanyAccessLabel = (access: string) => {
    switch (access) {
      case 'all': return '모든 회사';
      case 'own': return '자사만';
      case 'none': return '접근 불가';
      default: return access;
    }
  };

  const getCompanyAccessColor = (access: string) => {
    switch (access) {
      case 'all': return 'success';
      case 'own': return 'warning';
      case 'none': return 'error';
      default: return 'default';
    }
  };

  if (loading || !currentUser.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            color: '#191f28',
            fontSize: '1.125rem',
            mb: 0.5
          }}>
            역할 관리
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#8b95a1',
            fontSize: '0.75rem',
            fontWeight: 400
          }}>
            시스템 내 역할을 정의하고 관리합니다.
          </Typography>
        </Box>
      </Box>

      {/* 요약 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AdminPanelSettings sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  시스템 관리자
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                전체 시스템 관리 권한
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessCenter sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  회사 관리자
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                회사 내 관리 권한
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VerifiedUser sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  감사자
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                모든 회사 데이터 조회 권한
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Group sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  커스텀 역할
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                사용자 정의 역할
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 검색 필드 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
            <Search sx={{ position: 'absolute', left: 12, color: '#666', fontSize: 20 }} />
            <TextField
              fullWidth
              placeholder={t('roleSearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
              sx={{
                '& .MuiInputBase-root': {
                  pl: 5,
                  pr: searchTerm ? 8 : 2,
                  fontSize: '0.875rem',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2'
                    }
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.875rem'
                }
              }}
              InputProps={{
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ position: 'absolute', right: 8 }}
                    title="검색어 지우기"
                  >
                    <Clear sx={{ fontSize: 18 }} />
                  </IconButton>
                )
              }}
            />
          </Box>
          {debouncedSearchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              {filteredRoles.length}개 결과
            </Typography>
          )}
        </Box>
      </Paper>

      {/* 액션 버튼 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddRole}
          sx={{ fontSize: '0.75rem' }}
        >
          역할 추가
        </Button>
      </Box>

      {/* 역할 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>역할명</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>레벨</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>회사 접근</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>설명</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>사용자 수</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>생성일</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {debouncedSearchTerm ? '검색 결과가 없습니다.' : '등록된 역할이 없습니다.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {role.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {role.name_en}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <Chip
                    icon={getLevelIcon(role.level)}
                    label={role.level}
                    color={getLevelColor(role.level) as any}
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <Chip
                    label={getCompanyAccessLabel(role.company_access)}
                    color={getCompanyAccessColor(role.company_access) as any}
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {role.description}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${roleUsers[role.id]?.length || 0}명`}
                      size="small"
                      color={roleUsers[role.id]?.length > 0 ? 'primary' : 'default'}
                      sx={{ fontSize: '0.65rem' }}
                    />
                    {roleUsers[role.id]?.length > 0 && (
                      <Tooltip title={roleUsers[role.id].map(u => u.username).join(', ')}>
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  {new Date(role.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="수정">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRole(role)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 역할 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '0.875rem' }}>
          {editingRole ? '역할 수정' : '역할 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="역할명 (한글)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="역할명 (영문)"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>레벨</InputLabel>
                <Select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                  label="레벨"
                >
                  <MenuItem value="root">시스템 관리자</MenuItem>
                  <MenuItem value="admin">회사 관리자</MenuItem>
                  <MenuItem value="audit">감사자</MenuItem>
                  <MenuItem value="regular">일반 사용자</MenuItem>
                  <MenuItem value="custom">커스텀</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>회사 접근</InputLabel>
                <Select
                  value={formData.company_access}
                  onChange={(e) => setFormData({ ...formData, company_access: e.target.value as any })}
                  label="회사 접근"
                >
                  <MenuItem value="all">모든 회사</MenuItem>
                  <MenuItem value="own">자사만</MenuItem>
                  <MenuItem value="none">접근 불가</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명 (한글)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명 (영문)"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                multiline
                rows={2}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontSize: '0.875rem', mb: 2 }}>
                권한 할당
              </Typography>
              <Grid container spacing={1}>
                {permissions.map((permission) => (
                  <Grid item xs={12} sm={6} md={4} key={permission.id}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {permission.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {permission.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontSize: '0.75rem' }}>
            취소
          </Button>
          <Button onClick={handleSaveRole} variant="contained" sx={{ fontSize: '0.75rem' }}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontSize: '0.875rem' }}>역할 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.75rem' }}>
            "{roleToDelete?.name}" 역할을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            이 작업은 되돌릴 수 없으며, 해당 역할에 할당된 모든 권한도 함께 삭제됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontSize: '0.75rem' }}>
            취소
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ fontSize: '0.75rem' }}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagementPage; 