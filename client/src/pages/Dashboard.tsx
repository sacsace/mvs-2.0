import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemAvatar,
  Collapse,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Language as LanguageIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import UserListPage from './UserListPage';
import MenuPermissionPage from './MenuPermissionPage';
import CompanyPage from './CompanyPage';
import PermissionManagementPage from './PermissionManagementPage';
import UserPermissionManagementPage from './UserPermissionManagementPage';
import RoleManagementPage from './RoleManagementPage';
import PartnerPage from './PartnerPage';
import ApprovalPage from './ApprovalPage';
import AccountingStatisticsPage from './AccountingStatisticsPage';
import InvoicePage from './InvoicePage';

interface MenuItem {
  menu_id: number;
  name: string;
  name_en: string;
  parent_id: number | null;
  order_num: number;
  icon: string;
  url?: string;
  description?: string;
}

interface DashboardStats {
  users: {
    total: number;
    admin: number;
    regular: number;
  };
  menus: {
    total: number;
    topLevel: number;
    subMenus: number;
  };
  companies: {
    total: number;
  };
  permissions: {
    total: number;
  };
  invoices?: {
    total: number;
    regular: number;
    eInvoice: number;
    proforma: number;
    draft: number;
    sent: number;
    paid: number;
    totalAmount: number;
  };
  recentUsers: Array<{
    id: number;
    username: string;
    role: string;
    create_date: string;
  }>;
  system: {
    currentTime: string;
    userRole: string;
    companyId: number;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>([]);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [currentMenu, setCurrentMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const drawerWidth = 280;

  // 메뉴 검색 기능
  useEffect(() => {
    if (!menus || menus.length === 0) return;
    
    if (searchTerm.trim() === '') {
      setFilteredMenus(menus);
      return;
    }
    
    const filtered = menus.filter(menu => 
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMenus(filtered);
  }, [searchTerm, menus]);

  // 검색어 변경 핸들러
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 검색어 초기화
  const handleSearchClear = () => {
    setSearchTerm('');
  };

  // 검색어 변경 시 페이지 상태 초기화
  useEffect(() => {
    if (searchTerm) {
      // 검색 중일 때는 현재 페이지 상태를 유지하지 않음
      setCurrentPage('dashboard');
      setCurrentMenu(null);
    }
  }, [searchTerm]);

  const fetchMenus = useCallback(async () => {
    try {
      console.log('=== fetchMenus 시작 ===');
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('메뉴 조회 시작, 토큰:', token ? '존재함' : '없음');
      
      const url = '/api/menus/tree';
      console.log('API URL:', url);
      
      console.log('fetch 요청 시작...');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('fetch 요청 완료');
      console.log('메뉴 API 응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('응답이 성공적입니다. JSON 파싱 시작...');
        const result = await response.json();
        console.log('JSON 파싱 완료');
        console.log('메뉴 API 응답 데이터:', result);
        
        if (result.success && result.data) {
          console.log('성공적인 응답 구조입니다. 메뉴 데이터 설정:', result.data);
          // 계층 구조를 평면 구조로 변환
          console.log('flattenMenuTree 호출 시작...');
          const flattenMenus = flattenMenuTree(result.data);
          console.log('flattenMenuTree 완료. 평면 구조로 변환된 메뉴:', flattenMenus);
          console.log('setMenus 호출...');
          setMenus(flattenMenus);
          console.log('setMenus 완료');
        } else if (Array.isArray(result)) {
          console.log('배열 형태 메뉴 데이터 설정:', result);
          setMenus(result);
        } else {
          console.error('예상하지 못한 메뉴 데이터 구조:', result);
          setMenus([]);
        }
      } else {
        console.error('메뉴 로딩 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('에러 응답 내용:', errorText);
        setMenus([]);
        setError('메뉴를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 로딩 오류:', error);
      setMenus([]);
      setError('메뉴를 불러오는 중 오류가 발생했습니다.');
    } finally {
      console.log('=== fetchMenus finally 블록 실행 ===');
      setLoading(false);
      console.log('fetchMenus 완료');
    }
  }, []);

  const fetchCompanyData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!userData?.company_id) return;
      
      const response = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const companies = await response.json();
        const userCompany = companies.find((company: any) => company.company_id === userData.company_id);
        if (userCompany) {
          setCompanyData(userCompany);
        }
      }
    } catch (error) {
      console.error('회사 정보 조회 중 오류:', error);
    }
  }, [userData?.company_id]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('통계 조회 시작, 토큰:', token ? '존재함' : '없음');
      
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('통계 API 응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('통계 API 응답 데이터:', result);
        
        if (result.success && result.data) {
          console.log('통계 데이터 설정:', result.data);
          setStats(result.data);
        } else {
          console.error('예상하지 못한 통계 데이터 구조:', result);
          setStats(null);
        }
      } else {
        console.error('통계 로딩 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('에러 응답 내용:', errorText);
        setStats(null);
      }
    } catch (error) {
      console.error('통계 로딩 오류:', error);
      setStats(null);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    console.log('Dashboard useEffect 실행됨');
    
    // 인증 토큰 확인
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('토큰이 없어서 로그인 페이지로 이동');
      navigate('/login');
      return;
    }

    // 사용자 데이터 로드
    const userDataStr = localStorage.getItem('user');
    console.log('로드된 사용자 데이터 문자열:', userDataStr);
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        console.log('파싱된 사용자 데이터:', userData);
        setUserData(userData);
        
        // 사용자의 기본 언어 설정
        if (userData.default_language) {
          console.log('사용자 기본 언어 설정:', userData.default_language);
          setLanguage(userData.default_language as 'ko' | 'en');
        }
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
      }
    } else {
      console.log('localStorage에 사용자 데이터가 없습니다');
      // JWT 토큰에서 사용자 정보 추출 시도
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('JWT 토큰에서 추출한 사용자 정보:', payload);
          setUserData(payload);
        }
      } catch (error) {
        console.error('JWT 토큰 파싱 오류:', error);
      }
    }

    // 메뉴와 통계 데이터 로드
    console.log('fetchMenus 호출 시작');
    fetchMenus();
    console.log('fetchStats 호출 시작');
    fetchStats();
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 함

  // 사용자 데이터가 로드된 후 회사 정보 가져오기
  useEffect(() => {
    if (userData?.company_id) {
      fetchCompanyData();
    }
  }, [userData?.company_id, fetchCompanyData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuClick = (menu: MenuItem) => {
    console.log('메뉴 클릭:', menu.name, 'menu_id:', menu.menu_id);
    console.log('현재 menus 배열:', menus);
    console.log('현재 expandedMenus 상태:', expandedMenus);
    
    // 하위 메뉴가 있는 경우 토글
    const hasChildren = menus.some(m => m.parent_id === menu.menu_id);
    console.log('하위 메뉴 존재 여부:', hasChildren);
    console.log('해당 메뉴의 하위 메뉴들:', menus.filter(m => m.parent_id === menu.menu_id));
    
    if (hasChildren) {
      // 최상위 메뉴인 경우 하위 메뉴 토글만 수행 (페이지 전환 없음)
      console.log('최상위 메뉴 토글:', menu.menu_id, '현재 상태:', expandedMenus[menu.menu_id]);
      setExpandedMenus(prev => {
        const newState = {
          ...prev,
          [menu.menu_id]: !prev[menu.menu_id]
        };
        console.log('새로운 expandedMenus 상태:', newState);
        console.log('토글된 메뉴 ID:', menu.menu_id, '새 상태:', newState[menu.menu_id]);
        return newState;
      });
    } else {
      // 하위 메뉴인 경우에만 페이지 전환
      console.log('하위 메뉴 페이지 전환:', menu.name, 'URL:', menu.url);
      setCurrentPage(menu.url || 'dashboard');
      setCurrentMenu(menu);
    }
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageChange = (lang: 'ko' | 'en') => {
    setLanguage(lang);
    handleLanguageMenuClose();
  };

  // 로고 클릭 시 홈 화면으로 이동
  const handleLogoClick = () => {
    setCurrentPage('dashboard');
    setCurrentMenu(null);
  };

  // 회사명에서 "private limited" 제거하는 함수
  const getDisplayCompanyName = (companyName: string): string => {
    if (!companyName) return 'MSV';
    return companyName.replace(/\s*private\s*limited\s*/gi, '').trim();
  };

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      dashboard: DashboardIcon,
      people: PeopleIcon,
      menu: MenuIcon,
      business: BusinessIcon,
      security: SecurityIcon,
      admin_panel_settings: AdminIcon,
      list: MenuIcon,
      person_add: PeopleIcon,
      list_alt: MenuIcon,
      add_circle: MenuIcon,
      approval: MenuIcon,
      receipt_long: MenuIcon,
      edit_note: MenuIcon,
      verified: MenuIcon,
    };
    return iconMap[iconName] || MenuIcon;
  };

  // 메뉴명 번역 함수
  // 계층 구조 메뉴를 평면 구조로 변환하는 함수
  const flattenMenuTree = (menuTree: any[]): MenuItem[] => {
    const result: MenuItem[] = [];
    
    const flatten = (menus: any[]) => {
      menus.forEach(menu => {
        // children 속성을 제거하고 MenuItem 형태로 변환
        const { children, ...menuItem } = menu;
        result.push(menuItem as MenuItem);
        
        // 하위 메뉴가 있으면 재귀적으로 처리
        if (children && children.length > 0) {
          flatten(children);
        }
      });
    };
    
    flatten(menuTree);
    return result;
  };

  const getMenuDisplayName = (menu: MenuItem): string => {
    // 사용자의 기본 언어에 따라 메뉴명 표시
    if (language === 'en' && menu.name_en) {
      return menu.name_en;
    }
    return menu.name;
  };

  // 계층 구조 메뉴 렌더링 함수
  const renderMenuTree = (menuTree: MenuItem[], parentId: number | null = null) => {
    console.log('=== renderMenuTree 호출됨 ===');
    console.log('매개변수:', { parentId, menuTreeLength: menuTree.length });
    console.log('전체 메뉴 데이터:', menuTree);
    
    // 현재 레벨의 메뉴만 필터링
    const currentMenus = menuTree.filter(menu => menu.parent_id === parentId);
    console.log('현재 레벨 메뉴:', currentMenus.map(m => ({ id: m.menu_id, name: m.name, parent_id: m.parent_id })));
    
    if (currentMenus.length === 0) {
      console.log('현재 레벨에 메뉴가 없음');
      return null;
    }

    return currentMenus.map((menu) => {
      // 하위 메뉴가 있는지 확인
      const hasChildren = menuTree.some(m => m.parent_id === menu.menu_id);
      const isExpanded = expandedMenus[menu.menu_id];
      const IconComponent = getIcon(menu.icon);
      
      console.log('메뉴 렌더링:', { 
        id: menu.menu_id, 
        name: menu.name, 
        hasChildren, 
        isExpanded,
        하위메뉴목록: menuTree.filter(m => m.parent_id === menu.menu_id).map(m => m.name)
      });

      return (
        <Box key={menu.menu_id}>
          <ListItemButton
            onClick={() => handleMenuClick(menu)}
            sx={{
              mx: 1,
              borderRadius: '4px',
              minHeight: 36,
              pl: parentId ? 3 : 2,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&.Mui-selected': {
                backgroundColor: '#e3f2fd',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 32,
              color: parentId ? '#666' : '#333',
              '& .MuiSvgIcon-root': { fontSize: '1.1rem' }
            }}>
              <IconComponent />
            </ListItemIcon>
            <ListItemText 
              primary={getMenuDisplayName(menu)}
              primaryTypographyProps={{
                sx: { 
                  fontSize: parentId ? '0.75rem' : '0.85rem',
                  fontWeight: parentId ? 400 : 600,
                  color: parentId ? '#666' : '#333'
                }
              }}
            />
            {hasChildren && (
              <Box sx={{ ml: 'auto' }}>
                {isExpanded ? (
                  <ExpandLessIcon sx={{ fontSize: '1rem', color: '#666' }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: '1rem', color: '#666' }} />
                )}
              </Box>
            )}
          </ListItemButton>
          
          {hasChildren && (
            <Collapse in={isExpanded} timeout={200} unmountOnExit>
              <List component="div" disablePadding sx={{ 
                ml: 1
              }}>
                {renderMenuTree(menuTree, menu.menu_id)}
              </List>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  // 대시보드 내용 렌더링
  const renderDashboardContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!stats) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            통계 데이터를 불러올 수 없습니다.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => fetchStats()}
            sx={{ mt: 2 }}
          >
            다시 시도
          </Button>
        </Box>
      );
    }

    return (
      <>
        {/* 페이지 제목 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            color: '#191f28',
            fontSize: '1.125rem',
            mb: 0.5
          }}>
            {t('dashboard')}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#8b95a1',
            fontSize: '0.75rem',
            fontWeight: 400
          }}>
            {t('systemStatus')}
          </Typography>
        </Box>

        {/* 통계 카드 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: '0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3, gap: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: '#1976d2',
                  fontSize: '1rem'
                }}>
                  <PeopleIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h3" sx={{ 
                    fontSize: '1.5rem',
                    mb: 0.5,
                    fontWeight: 700,
                    color: '#191f28'
                  }}>
                    {stats.users.total}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontSize: '0.75rem',
                    color: '#8b95a1',
                    mb: 1.5,
                    fontWeight: 500
                  }}>
                    {t('totalUsers')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={`${t('admin')} ${stats.users.admin}`}
                      size="small"
                      sx={{ 
                        fontSize: '0.625rem',
                        height: 20,
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                    <Chip 
                      label={`${t('regular')} ${stats.users.regular}`}
                      size="small"
                      sx={{ 
                        fontSize: '0.625rem',
                        height: 20,
                        bgcolor: '#f3e5f5',
                        color: '#7b1fa2',
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: '0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3, gap: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#ff9500',
                  fontSize: '0.875rem'
                }}>
                  <MenuIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h3" sx={{ 
                    fontSize: '1.25rem',
                    mb: 0.5,
                    fontWeight: 700,
                    color: '#191f28'
                  }}>
                    {stats.menus.total}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontSize: '0.625rem',
                    color: '#8b95a1',
                    mb: 1.5,
                    fontWeight: 500
                  }}>
                    {t('totalMenus')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={`${t('topLevel')} ${stats.menus.topLevel}`}
                      size="small"
                      sx={{ 
                        fontSize: '0.5rem',
                        height: 18,
                        bgcolor: '#fff3e0',
                        color: '#f57c00',
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 0.75 }
                      }}
                    />
                    <Chip 
                      label={`${t('subMenus')} ${stats.menus.subMenus}`}
                      size="small"
                      sx={{ 
                        fontSize: '0.5rem',
                        height: 18,
                        bgcolor: '#e8f5e8',
                        color: '#388e3c',
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 0.75 }
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: '0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3, gap: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#007aff',
                  fontSize: '0.875rem'
                }}>
                  <BusinessIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h3" sx={{ 
                    fontSize: '1.25rem',
                    mb: 0.5,
                    fontWeight: 700,
                    color: '#191f28'
                  }}>
                    {stats.companies.total}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontSize: '0.625rem',
                    color: '#8b95a1',
                    fontWeight: 500
                  }}>
                    {t('registeredCompanies')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: '0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3, gap: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#ff3b30',
                  fontSize: '0.875rem'
                }}>
                  <SecurityIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h3" sx={{ 
                    fontSize: '1.25rem',
                    mb: 0.5,
                    fontWeight: 700,
                    color: '#191f28'
                  }}>
                    {stats.permissions.total}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontSize: '0.625rem',
                    color: '#8b95a1',
                    fontWeight: 500
                  }}>
                    {t('permissions')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 매입/매출 통계 카드 */}
          {stats.invoices && (
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: '0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ p: 3, gap: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: '#34c759',
                    fontSize: '0.875rem'
                  }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h3" sx={{ 
                      fontSize: '1.25rem',
                      mb: 0.5,
                      fontWeight: 700,
                      color: '#191f28'
                    }}>
                      {stats.invoices.total}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontSize: '0.625rem',
                      color: '#8b95a1',
                      fontWeight: 500
                    }}>
                      총 인보이스
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={`정규 ${stats.invoices.regular}`}
                        size="small"
                        sx={{ 
                          fontSize: '0.625rem',
                          height: 20,
                          bgcolor: '#e8f5e8',
                          color: '#34c759',
                          fontWeight: 600,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                      <Chip 
                        label={`E-${stats.invoices.eInvoice}`}
                        size="small"
                        sx={{ 
                          fontSize: '0.625rem',
                          height: 20,
                          bgcolor: '#fff3e0',
                          color: '#ff9500',
                          fontWeight: 600,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* 하단 카드들 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ 
                    width: 28, 
                    height: 28, 
                    bgcolor: '#03c75a',
                    fontSize: '0.75rem'
                  }}>
                    <PeopleIcon />
                  </Avatar>
                }
                title={t('recentUsers')}
                titleTypographyProps={{
                  sx: { 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#191f28'
                  }
                }}
                sx={{ pb: 1 }}
              />
              <List sx={{ py: 0 }}>
                {stats.recentUsers.map((user, index) => (
                  <ListItem key={user.id} sx={{ py: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: ['#03c75a', '#ff9500', '#007aff', '#ff3b30'][index % 4],
                        fontSize: '0.625rem',
                        width: 24,
                        height: 24
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      secondary={`${user.role} • ${new Date(user.create_date).toLocaleDateString('ko-KR')}`}
                      primaryTypographyProps={{
                        sx: { 
                          fontSize: '0.975rem',
                          fontWeight: 600,
                          color: '#191f28'
                        }
                      }}
                      secondaryTypographyProps={{
                        sx: { 
                          fontSize: '0.5rem',
                          color: '#8b95a1'
                        }
                      }}
                    />
                    <Chip 
                      label={user.role}
                      size="small"
                      sx={{ 
                        fontSize: '0.5rem',
                        height: 18,
                        bgcolor: user.role === 'admin' ? '#e3f2fd' : '#f3e5f5',
                        color: user.role === 'admin' ? '#1976d2' : '#7b1fa2',
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 0.75 }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ 
                    width: 28, 
                    height: 28, 
                    bgcolor: '#007aff',
                    fontSize: '0.75rem'
                  }}>
                    <SettingsIcon />
                  </Avatar>
                }
                title={t('systemInfo')}
                titleTypographyProps={{
                  sx: { 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#191f28'
                  }
                }}
                sx={{ pb: 1 }}
              />
              <Box sx={{ p: 3, mb: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.5rem',
                    color: '#8b95a1',
                    mb: 0.5,
                    fontWeight: 500
                  }}>
                    {t('currentTime')}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    color: '#191f28'
                  }}>
                    {stats.system.currentTime}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.5rem',
                    color: '#8b95a1',
                    mb: 0.5,
                    fontWeight: 500
                  }}>
                    {t('userRole')}
                  </Typography>
                  <Chip 
                    label={stats.system.userRole}
                    size="small"
                    sx={{ 
                      fontSize: '0.78rem',
                      height: 18,
                      bgcolor: '#e3f2fd',
                      color: '#1976d2',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.5rem',
                    color: '#8b95a1',
                    mb: 0.5,
                    fontWeight: 500
                  }}>
                    {t('companyId')}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    color: '#191f28'
                  }}>
                    {stats.system.companyId}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* 인보이스 상세 통계 카드 */}
          {stats.invoices && (
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ 
                      width: 28, 
                      height: 28, 
                      bgcolor: '#34c759',
                      fontSize: '0.75rem'
                    }}>
                      <BusinessIcon />
                    </Avatar>
                  }
                  title="인보이스 상세 통계"
                  titleTypographyProps={{
                    sx: { 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#191f28'
                    }
                  }}
                  sx={{ pb: 1 }}
                />
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.5rem',
                          color: '#8b95a1',
                          mb: 0.5,
                          fontWeight: 500
                        }}>
                          상태별 인보이스
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', color: '#666' }}>
                              초안
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#191f28' }}>
                              {stats.invoices.draft}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', color: '#666' }}>
                              발송됨
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#191f28' }}>
                              {stats.invoices.sent}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', color: '#666' }}>
                              결제됨
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#191f28' }}>
                              {stats.invoices.paid}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.5rem',
                          color: '#8b95a1',
                          mb: 0.5,
                          fontWeight: 500
                        }}>
                          유형별 인보이스
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', color: '#666' }}>
                              정규
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#191f28' }}>
                              {stats.invoices.regular}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', color: '#666' }}>
                              E-인보이스
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#191f28' }}>
                              {stats.invoices.eInvoice}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', color: '#666' }}>
                              프로포마
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#191f28' }}>
                              {stats.invoices.proforma}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.5rem',
                      color: '#8b95a1',
                      mb: 0.5,
                      fontWeight: 500
                    }}>
                      총 인보이스 금액
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#34c759'
                    }}>
                      ₹{stats.invoices.totalAmount.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          )}
        </Grid>
      </>
    );
  };

  // 페이지 내용 렌더링
  const renderPageContent = () => {
    console.log('=== renderPageContent 호출됨 ===');
    console.log('현재 상태:', { 
      loading, 
      error, 
      menusLength: menus.length, 
      searchTerm, 
      filteredMenusLength: filteredMenus.length,
      menus: menus.map(m => ({ id: m.menu_id, name: m.name }))
    });
    
    // 로딩 중일 때
    if (loading) {
      console.log('로딩 상태이므로 로딩 UI 렌더링');
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center'
        }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ 
            color: '#8b95a1',
            fontSize: '1rem',
            fontWeight: 500
          }}>
            메뉴를 불러오는 중...
          </Typography>
        </Box>
      );
    }

    // 오류가 있을 때
    if (error) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ 
            color: '#d32f2f',
            fontSize: '1rem',
            fontWeight: 500,
            mb: 2
          }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => {
              setError(null);
              fetchMenus();
            }}
            sx={{ 
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            다시 시도
          </Button>
        </Box>
      );
    }

    // 검색 결과가 있을 때 (최우선)
    if (searchTerm && filteredMenus.length > 0) {
      return (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#191f28',
              fontSize: '1.125rem',
              mb: 0.5
            }}>
              검색 결과: "{searchTerm}"
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#8b95a1',
              fontSize: '0.75rem',
              fontWeight: 400
            }}>
              {filteredMenus.length}개의 메뉴를 찾았습니다
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {filteredMenus.map((menu) => (
              <Grid item xs={12} sm={6} md={4} key={menu.menu_id}>
                <Card sx={{ 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: '0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => {
                  // 검색 결과에서 메뉴 클릭 시 해당 페이지로 이동
                  setCurrentPage(menu.url || 'dashboard');
                  setCurrentMenu(menu);
                  setSearchTerm(''); // 검색어 초기화
                }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: '#1976d2',
                        fontSize: '0.75rem',
                        mr: 1
                      }}>
                        {(() => {
                          const IconComponent = getIcon(menu.icon);
                          return <IconComponent sx={{ fontSize: '0.75rem' }} />;
                        })()}
                      </Avatar>
                                                                   <Typography variant="body1" sx={{ 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#191f28'
                      }}>
                        {getMenuDisplayName(menu)}
                      </Typography>
                    </Box>
                    {menu.url && (
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.65rem',
                        color: '#8b95a1'
                      }}>
                        {menu.url}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      );
    }

    // 검색 결과가 없을 때
    if (searchTerm && filteredMenus.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ 
            color: '#8b95a1',
            fontSize: '1.25rem',
            fontWeight: 500,
            mb: 1
          }}>
            검색 결과가 없습니다
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#8b95a1',
            fontSize: '0.75rem'
          }}>
            "{searchTerm}"에 대한 검색 결과를 찾을 수 없습니다
          </Typography>
        </Box>
      );
    }

    // 검색어가 없을 때 현재 페이지에 따라 내용 표시
    if (!searchTerm) {
      // 대시보드 페이지
      if (currentPage === 'dashboard') {
        return renderDashboardContent();
      }

      // 다른 메뉴 페이지
      if (currentMenu) {
        // 사용자 목록 페이지
        if (currentMenu.url === '/users/list') {
          return <UserListPage />;
        }

        // 메뉴 권한 관리 페이지
        if (currentMenu.url === '/permissions/menu') {
          return <MenuPermissionPage />;
        }

        // 회사정보 관리 페이지
        if (currentMenu.url === '/users/company') {
          return <CompanyPage />;
        }

        // 권한 관리 페이지
        if (currentMenu.url === '/permissions/manage') {
          return <PermissionManagementPage />;
        }

        // 사용자 권한 관리 페이지
        if (currentMenu.url === '/permissions/user') {
          return <UserPermissionManagementPage />;
        }

        // 역할 관리 페이지
        if (currentMenu.url === '/permissions/role' || currentMenu.url === '/permissions/roles') {
          return <RoleManagementPage />;
        }

        // 협력 업체 관리 페이지
        if (currentMenu.url === '/users/partners') {
          return <PartnerPage />;
        }

        // 전자 결제 페이지
        if (currentMenu.url === '/approval') {
          return <ApprovalPage />;
        }

        // 매입/매출 통계 페이지
        if (currentMenu.url === '/accounting/statistics') {
          return <AccountingStatisticsPage />;
        }

        // 매출 관리 페이지
        if (currentMenu.url === '/accounting/invoices') {
          return <InvoicePage />;
        }

        // 다른 페이지들은 기본 템플릿 사용
        return (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 600, 
                color: '#191f28',
                fontSize: '1.125rem',
                mb: 0.5
              }}>
                {getMenuDisplayName(currentMenu)}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#8b95a1',
                fontSize: '0.75rem',
                fontWeight: 400
              }}>
                {currentMenu.url}
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '400px',
              textAlign: 'center'
            }}>
              <Typography variant="h5" sx={{ 
                color: '#8b95a1',
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 1
              }}>
                {getMenuDisplayName(currentMenu)} 페이지
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#8b95a1',
                fontSize: '0.875rem'
              }}>
                이 페이지는 개발 중입니다.
              </Typography>
            </Box>
          </>
        );
      }
    }

    return null;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* A 구역: 좌측 사이드바 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e0e0e0',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          },
        }}
      >
        {/* 로고 영역 */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #d0d7de',
          height: 60,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={handleLogoClick}
          >
            {/* MSV 로고 - 6개의 파랑 원 */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 0.3,
              width: 28,
              height: 20,
            }}>
              {[...Array(6)].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                  }}
                />
              ))}
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: '#333',
              fontSize: '1rem'
            }}>
              {companyData?.name ? getDisplayCompanyName(companyData.name) : 'MSV'}
            </Typography>
          </Box>
        </Box>
        
        {/* 메뉴 영역 */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {/* 메뉴 목록 */}
          <Box sx={{ py: 0.5 }} className="scrollable">
            {loading ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <CircularProgress size={20} sx={{ color: '#1976d2' }} />
                <Typography variant="body2" sx={{ color: '#8b95a1', fontSize: '0.75rem', mt: 1 }}>
                  메뉴를 불러오는 중...
                </Typography>
              </Box>
            ) : !Array.isArray(menus) || menus.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#8b95a1', fontSize: '0.75rem' }}>
                  메뉴가 없습니다
                </Typography>
              </Box>
            ) : (
              renderMenuTree(menus, null)
            )}
          </Box>
        </Box>
      </Drawer>

      {/* B 구역: 상단 헤더 + C 구역: 본문 */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* B 구역: 상단 헤더 */}
        <AppBar 
          position="fixed" 
          sx={{ 
            width: `calc(100% - ${drawerWidth}px)`, 
            ml: `${drawerWidth}px`,
            backgroundColor: '#ffffff',
            color: '#191f28',
            height: 60,
            boxShadow: 'none',
            borderBottom: '1px solid #d0d7de'
          }}
        >
          <Toolbar sx={{ 
            height: 60,
            px: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* 좌측: 대시보드 버튼과 검색바 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flexGrow: 1, 
              maxWidth: 500, 
              mx: 2.5,
            }}>
              {/* 대시보드 버튼 (홈 버튼 역할) */}
              <Tooltip title={t('dashboard')}>
                <IconButton 
                  onClick={() => {
                    setCurrentPage('dashboard');
                    setCurrentMenu(null);
                  }}
                  sx={{ 
                    color: '#1976d2',
                    backgroundColor: '#e3f2fd',
                    mr: 2,
                    '&:hover': { 
                      backgroundColor: '#bbdefb',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <DashboardIcon sx={{ fontSize: '1.125rem' }} />
                </IconButton>
              </Tooltip>
              
              {/* 검색바 */}
              <Box sx={{ 
                flexGrow: 1, 
                position: 'relative'
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  px: 2.5,
                  py: 1,
                  border: '1px solid transparent',
                  '&:hover': {
                    border: '1px solid #1976d2',
                  },
                  '&:focus-within': {
                    border: '1px solid #1976d2',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                  },
                }}>
                  <SearchIcon sx={{ 
                    color: '#8b95a1', 
                    mr: 1.5, 
                    width: 14, 
                    height: 14 
                  }} />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      flex: 1,
                      fontSize: '0.75rem',
                      color: '#191f28',
                    }}
                  />
                  {searchTerm && (
                    <IconButton
                      size="small"
                      onClick={handleSearchClear}
                      sx={{ 
                        color: '#8b95a1',
                        p: 0.5,
                        '&:hover': { color: '#1976d2' }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: '0.875rem' }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* 우측: 사용자 메뉴 */}
            <Box display="flex" alignItems="center" gap={1.5}>
              <Tooltip title={t('notifications')}>
                <IconButton 
                  size="small" 
                  sx={{ 
                    color: '#8b95a1',
                    '&:hover': { backgroundColor: '#f2f3f5' }
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: '1.125rem' }} />
                </IconButton>
              </Tooltip>
              
              {/* 언어 변경 메뉴 */}
              <Tooltip title={t('language')}>
                <IconButton 
                  size="small" 
                  onClick={handleLanguageMenuOpen}
                  sx={{ 
                    color: '#8b95a1',
                    '&:hover': { backgroundColor: '#f2f3f5' }
                  }}
                >
                  <LanguageIcon sx={{ fontSize: '1.125rem' }} />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={languageMenuAnchor}
                open={Boolean(languageMenuAnchor)}
                onClose={handleLanguageMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 120,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e1e5e9',
                  }
                }}
              >
                <MenuItem 
                  onClick={() => handleLanguageChange('ko')}
                  selected={language === 'ko'}
                  sx={{ 
                    fontSize: '0.75rem',
                    py: 1,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      '&:hover': { backgroundColor: '#e3f2fd' }
                    }
                  }}
                >
                  한국어
                </MenuItem>
                <MenuItem 
                  onClick={() => handleLanguageChange('en')}
                  selected={language === 'en'}
                  sx={{ 
                    fontSize: '0.75rem',
                    py: 1,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      '&:hover': { backgroundColor: '#e3f2fd' }
                    }
                  }}
                >
                  English
                </MenuItem>
              </Menu>
              
              <Tooltip title={t('settings')}>
                <IconButton 
                  size="small" 
                  sx={{ 
                    color: '#8b95a1',
                    '&:hover': { backgroundColor: '#f2f3f5' }
                  }}
                >
                  <SettingsIcon sx={{ fontSize: '1.125rem' }} />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 28 }} />
              
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar 
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    bgcolor: '#1976d2',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {(userData?.username || userData?.userid)?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: '#191f28',
                  fontSize: '0.75rem'
                }}>
                  {userData?.username || userData?.userid || '사용자'}
                </Typography>

                {userData?.role && (
                  <Chip 
                    label={userData.role}
                    size="small"
                    sx={{ 
                      fontSize: '0.5rem',
                      height: 16,
                      bgcolor: userData.role === 'admin' ? '#e3f2fd' : '#f3e5f5',
                      color: userData.role === 'admin' ? '#1976d2' : '#7b1fa2',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                  />
                )}
              </Box>
              
              <Tooltip title={t('logout')}>
                <IconButton 
                  size="small" 
                  onClick={handleLogout}
                  sx={{ 
                    color: '#8b95a1',
                    '&:hover': { backgroundColor: '#f2f3f5' }
                  }}
                >
                  <LogoutIcon sx={{ fontSize: '1.125rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* C 구역: 본문 영역 */}
        <Box
          sx={{
            flexGrow: 1,
            p: 2.5,
            backgroundColor: '#f8f9fa',
            minHeight: 'calc(100vh - 60px)',
            marginTop: '60px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="scrollable"
        >
          <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
            {renderPageContent()}
          </Container>
          
          {/* Footer - 화면 맨 아래 고정 */}
          <Box sx={{ 
            mt: 'auto', 
            pt: 4, 
            pb: 2, 
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ 
              color: '#8b95a1',
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              Provided by MS Ventures Private Limited
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 