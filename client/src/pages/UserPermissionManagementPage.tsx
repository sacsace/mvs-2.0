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
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Security,
  Person,
  Edit,
  Delete,
  Add,
  Visibility,
  AdminPanelSettings,
  SupervisorAccount,
  VerifiedUser,
  Business,
  Search,
  FilterList
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';


interface User {
  id: number;
  username: string;
  role: string;
  company_id: number;
  company_name?: string;
  default_language: string;
  created_at: string;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  level: 'root' | 'admin' | 'regular' | 'audit';
  company_access: 'all' | 'own' | 'none';
}

interface UserPermission {
  id: number;
  user_id: number;
  permission_id: number;
  granted_at: string;
  granted_by: string;
  permission_name: string;
  permission_level: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  level: string;
  company_access: string;
}

const UserPermissionManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<number>(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{[key: number]: number[]}>({});
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

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
          console.log('사용자 권한 관리 페이지 데이터 로드 시작');
          console.log('현재 사용자:', currentUser);
          setLoading(true);
          await Promise.all([
            fetchUsers(),
            fetchPermissions(),
            fetchUserPermissions(),
            fetchCompanies(),
            fetchRoles()
          ]);
          console.log('사용자 권한 관리 페이지 데이터 로드 완료');
        } catch (error) {
          console.error('데이터 로드 오류:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      console.log('사용자 목록 조회 시작');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('사용자 목록 API 응답:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('받은 사용자 데이터:', data);
        // 권한에 따라 사용자 필터링
        let filteredUsers = data;
        if (userRole === 'admin' || userRole === 'regular') {
          // admin과 regular는 자사 사용자만 볼 수 있음
          filteredUsers = data.filter((user: User) => user.company_id === userCompanyId);
        }
        // audit는 모든 사용자를 볼 수 있음 (검색 가능)
        // root는 모든 사용자를 볼 수 있음
        setUsers(filteredUsers);
        console.log('필터링된 사용자 데이터:', filteredUsers);
      } else {
        console.error('사용자 목록 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
    }
  };

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
        setError('권한 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('권한 목록 조회 오류:', error);
      setError('권한 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchUserPermissions = async () => {
    try {
      console.log('사용자 권한 조회 시작');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user-permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('사용자 권한 API 응답:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('받은 사용자 권한 데이터:', data);
        setUserPermissions(data);
      } else {
        console.error('사용자 권한 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('사용자 권한 조회 오류:', error);
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
      }
    } catch (error) {
      console.error('역할 권한 조회 오류:', error);
    }
  };

  const handleAssignPermissions = (user: User) => {
    setEditingUser(user);
    // 현재 사용자의 권한들을 가져와서 선택된 상태로 설정
    const userCurrentPermissions = userPermissions
      .filter(up => up.user_id === user.id)
      .map(up => up.permission_id);
    setSelectedPermissions(userCurrentPermissions);
    setSelectedRole(null);
    setDialogOpen(true);
  };

  const handleRoleSelect = (roleId: number) => {
    setSelectedRole(roleId);
    // 선택된 역할의 권한들을 자동으로 선택
    const rolePerms = rolePermissions[roleId] || [];
    setSelectedPermissions(rolePerms);
  };

  const handleSaveUserPermissions = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user-permissions/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permission_ids: selectedPermissions
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchUserPermissions();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '사용자 권한 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 권한 저장 오류:', error);
      setError('사용자 권한 저장에 실패했습니다.');
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
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

  const getRoleIcon = (role: string) => {
    switch (role) {
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

  const getUserPermissions = (userId: number) => {
    return userPermissions.filter(up => up.user_id === userId);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesCompany = filterCompany === 0 || user.company_id === filterCompany;
    
    return matchesSearch && matchesRole && matchesCompany;
  });

  if (loading || !currentUser.role) {
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
          <Security sx={{ fontSize: '1.5rem', color: '#1976d2' }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
            사용자 권한 관리
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="사용자명 또는 회사명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '0.75rem' }}>역할 필터</InputLabel>
                <Select
                  value={filterRole}
                  label="역할 필터"
                  onChange={(e) => setFilterRole(e.target.value)}
                  sx={{ '& .MuiSelect-select': { fontSize: '0.75rem' } }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>모든 역할</MenuItem>
                  <MenuItem value="root" sx={{ fontSize: '0.75rem' }}>Root</MenuItem>
                  <MenuItem value="admin" sx={{ fontSize: '0.75rem' }}>Admin</MenuItem>
                  <MenuItem value="audit" sx={{ fontSize: '0.75rem' }}>Audit</MenuItem>
                  <MenuItem value="regular" sx={{ fontSize: '0.75rem' }}>Regular</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '0.75rem' }}>회사 필터</InputLabel>
                <Select
                  value={filterCompany}
                  label="회사 필터"
                  onChange={(e) => setFilterCompany(Number(e.target.value))}
                  sx={{ '& .MuiSelect-select': { fontSize: '0.75rem' } }}
                >
                  <MenuItem value={0} sx={{ fontSize: '0.75rem' }}>모든 회사</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.company_id} value={company.company_id} sx={{ fontSize: '0.75rem' }}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                  setFilterCompany(0);
                }}
                sx={{ fontSize: '0.75rem' }}
                fullWidth
              >
                필터 초기화
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 사용자 권한 목록 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
            사용자 권한 목록 ({filteredUsers.length}명)
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ border: 0, background: '#f7fafd' }}>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>사용자</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>역할</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>회사</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>할당된 권한</TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const userPerms = getUserPermissions(user.id);
                  return (
                    <TableRow key={user.id} sx={{ border: 0 }}>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {user.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={user.role.toUpperCase()}
                          color={getRoleColor(user.role) as any}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {user.company_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {userPerms.length > 0 ? (
                            userPerms.slice(0, 3).map((perm) => (
                              <Chip
                                key={perm.id}
                                label={perm.permission_name}
                                size="small"
                                sx={{ fontSize: '0.6rem', height: 18 }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              권한 없음
                            </Typography>
                          )}
                          {userPerms.length > 3 && (
                            <Chip
                              label={`+${userPerms.length - 3}`}
                              size="small"
                              sx={{ fontSize: '0.6rem', height: 18 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                        <Tooltip title="권한 할당">
                          <IconButton
                            size="small"
                            onClick={() => handleAssignPermissions(user)}
                            disabled={userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit'}
                            sx={{ p: 0.5, color: '#666', '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 권한 할당 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          {editingUser ? `${editingUser.username} 사용자 권한 할당` : '사용자 권한 할당'}
        </DialogTitle>
        <DialogContent>
          {editingUser && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1, fontWeight: 600 }}>
                  사용자 정보:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      사용자명: {editingUser.username}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      역할: {editingUser.role}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      회사: {editingUser.company_name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      언어: {editingUser.default_language}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="h6" sx={{ mb: 2, fontSize: '0.85rem', fontWeight: 700 }}>
                역할 기반 권한 할당
              </Typography>
              
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 2, fontWeight: 600 }}>
                  역할 선택 (선택 시 해당 역할의 권한이 자동으로 적용됩니다):
                </Typography>
                <Grid container spacing={1}>
                  {roles.map((role) => (
                    <Grid item xs={12} sm={6} md={4} key={role.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedRole === role.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          bgcolor: selectedRole === role.id ? '#f3f8ff' : 'white',
                          '&:hover': { bgcolor: selectedRole === role.id ? '#f3f8ff' : '#f5f5f5' }
                        }}
                        onClick={() => handleRoleSelect(role.id)}
                      >
                        <CardContent sx={{ p: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>
                            {role.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 1 }}>
                            {role.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip
                              label={role.level}
                              size="small"
                              color={getRoleColor(role.level) as any}
                              sx={{ fontSize: '0.6rem', height: 18 }}
                            />
                            <Chip
                              label={role.company_access === 'all' ? '전체' : 
                                     role.company_access === 'own' ? '자사' : '없음'}
                              size="small"
                              sx={{ fontSize: '0.6rem', height: 18 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Typography variant="h6" sx={{ mb: 2, fontSize: '0.85rem', fontWeight: 700 }}>
                개별 권한 선택
              </Typography>
              
              <Grid container spacing={2}>
                {permissions.map((permission) => (
                  <Grid item xs={12} sm={6} md={4} key={permission.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
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
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                                {permission.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.625rem' }}>
                                {permission.description}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  label={permission.level.toUpperCase()}
                                  size="small"
                                  color={getRoleColor(permission.level) as any}
                                  sx={{ fontSize: '0.5rem', height: 16, mr: 0.5 }}
                                />
                                <Chip
                                  label={permission.company_access === 'all' ? '전체' : 
                                         permission.company_access === 'own' ? '자사' : '없음'}
                                  size="small"
                                  sx={{ fontSize: '0.5rem', height: 16 }}
                                />
                              </Box>
                            </Box>
                          }
                          sx={{ width: '100%', alignItems: 'flex-start' }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2 }}>
            취소
          </Button>
          <Button onClick={handleSaveUserPermissions} variant="contained" sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#145ea8' } }}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserPermissionManagementPage; 