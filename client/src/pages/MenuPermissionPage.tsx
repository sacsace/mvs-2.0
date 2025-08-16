import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { filterUsersByPermission } from '../hooks/useMenuPermission';

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
  Checkbox,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  // 메뉴별 아이콘들
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  AccountCircle as AccountCircleIcon,
  Group as GroupIcon,
  List as ListIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  ContactSupport as ContactSupportIcon,
  Build as BuildIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Code as CodeIcon,
  BugReport as BugReportIcon,
  Update as UpdateIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Archive as ArchiveIcon,
  DeleteSweep as DeleteSweepIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewQuilt as ViewQuiltIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  InsertChart as InsertChartIcon,
  TableChart as TableChartIcon,
  ScatterPlot as ScatterPlotIcon,
  BubbleChart as BubbleChartIcon,
  MultilineChart as MultilineChartIcon,
  StackedLineChart as StackedLineChartIcon,
  DonutSmall as DonutSmallIcon,
  DonutLarge as DonutLargeIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  StarHalf as StarHalfIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUpAlt as ThumbUpAltIcon,
  ThumbDownAlt as ThumbDownAltIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmber as WarningAmberIcon,
  InfoOutlined as InfoOutlinedIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CancelOutlined as CancelOutlinedIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
  ExpandMore as ExpandMoreIcon2,
  ExpandLess as ExpandLessIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  MoreVert as MoreVertIcon,
  MoreHoriz as MoreHorizIcon,
  Apps as AppsIcon,
  GridView as GridViewIcon,
  ViewComfy as ViewComfyIcon,
  ViewCompact as ViewCompactIcon,
  ViewHeadline as ViewHeadlineIcon,
  ViewStream as ViewStreamIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon,
  ViewCarousel as ViewCarouselIcon,
  ViewColumn as ViewColumnIcon,
  ViewSidebar as ViewSidebarIcon,
  ViewTimeline as ViewTimelineIcon,
  ViewInAr as ViewInArIcon,
  ViewKanban as ViewKanbanIcon
} from '@mui/icons-material';

interface User {
  id: number;
  username: string;
  role: string;
  company_id: number;
  company?: {
    name: string;
  };
}

interface Menu {
  menu_id: number;
  name: string;
  name_en?: string;
  parent_id: number | null;
  order_num: number;
  url?: string;
}

interface MenuPermission {
  id: number;
  user_id: number;
  menu_id: number;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  create_date: string;
}

const MenuPermissionPage: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
  
  // 메뉴 관리 관련 상태
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    name_en: '',
    url: '',
    order_num: 1,
    parent_id: null as number | null
  });
  const [addFormData, setAddFormData] = useState({
    name: '',
    name_en: '',
    url: '',
    order_num: 1,
    parent_id: null as number | null
  });

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser as number);
    } else {
      setPermissions([]);
    }
  }, [selectedUser]);

  // 트리 확장 상태는 사용자의 조작을 그대로 유지한다.
  // 메뉴 데이터가 새로 로드되더라도 임의로 접지 않는다.

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Current user:', data.user);
        setCurrentUser(data.user);
        return data.user;
      } else {
        console.error('현재 사용자 조회 실패:', response.status);
        return null;
      }
    } catch (error) {
      console.error('현재 사용자 조회 오류:', error);
      return null;
    }
  }, []);

  const fetchUsers = useCallback(async () => {
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
        
        // 현재 사용자 정보가 있으면 필터링 적용
        if (currentUser) {
          const filtered = filterUsersByPermission(data, currentUser.role);
          console.log('Filtered users by permission:', filtered);
          setFilteredUsers(filtered);
        } else {
          setFilteredUsers(data);
        }
        setError(null);
      } else {
        console.error('사용자 목록 조회 실패:', response.status);
        // 사용자 목록이 없어도 메뉴 트리는 보이도록 에러를 설정하지 않음
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      // 사용자 목록이 없어도 메뉴 트리는 보이도록 에러를 설정하지 않음
      setUsers([]);
      setFilteredUsers([]);
    }
  }, [currentUser]);

  const fetchMenus = useCallback(async () => {
    try {
      console.log('=== MenuPermissionPage fetchMenus 시작 ===');
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('토큰:', token ? '존재함' : '없음');
      
      const response = await fetch('/api/menu/tree', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('받은 데이터:', data);
        const treeData = data.data || data;
        console.log('트리 데이터:', treeData);
        setMenuTree(treeData);
        // 계층 구조를 평면화하여 메뉴 목록도 유지
        const flattenedMenus = flattenMenuTree(treeData);
        setMenus(flattenedMenus);
        console.log('메뉴 데이터 설정 완료');
      } else {
        const errorText = await response.text();
        console.error('메뉴 목록 조회 실패:', response.status, errorText);
        setError('메뉴 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 목록 조회 오류:', error);
      setError('메뉴 목록을 불러오는데 실패했습니다.');
    } finally {
      console.log('=== MenuPermissionPage fetchMenus 완료 ===');
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentUser();
      fetchMenus();
    };
    initializeData();
  }, [fetchCurrentUser, fetchMenus]);

  // 현재 사용자 정보가 로드된 후 사용자 목록 가져오기
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const flattenMenuTree = (menuTree: any[]): Menu[] => {
    const result: Menu[] = [];
    const flatten = (menus: any[]) => {
      menus.forEach(menu => {
        const { children, ...menuItem } = menu;
        result.push(menuItem as Menu);
        if (children && children.length > 0) {
          flatten(children);
        }
      });
    };
    flatten(menuTree);
    return result;
  };

  const fetchUserPermissions = async (userId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/menu-permissions/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      } else {
        setError('메뉴 권한을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 권한 조회 오류:', error);
      setError('메뉴 권한을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (menuId: number, permissionType: keyof Omit<MenuPermission, 'id' | 'user_id' | 'menu_id' | 'create_date'>, value: boolean) => {
    console.log('=== 권한 변경 로그 ===');
    console.log('메뉴 ID:', menuId);
    console.log('권한 타입:', permissionType);
    console.log('변경 값:', value);
    console.log('현재 권한 목록:', permissions);
    
    const existingPermission = permissions.find(p => p.menu_id === menuId);
    
    if (existingPermission) {
      console.log('기존 권한 업데이트:', existingPermission);
      setPermissions(prev => 
        prev.map(p => 
          p.menu_id === menuId 
            ? { ...p, [permissionType]: value }
            : p
        )
      );
    } else {
      const newPermission: MenuPermission = {
        id: 0,
        user_id: selectedUser as number,
        menu_id: menuId,
        can_read: permissionType === 'can_read' ? value : true,
        can_create: permissionType === 'can_create' ? value : true,
        can_update: permissionType === 'can_update' ? value : true,
        can_delete: permissionType === 'can_delete' ? value : true,
        create_date: new Date().toISOString()
      };
      console.log('새로운 권한 생성:', newPermission);
      setPermissions(prev => [...prev, newPermission]);
    }
    
    // 리렌더링은 permissions 상태 변경으로 충분하므로 별도 트리 강제 업데이트 불필요
    
    console.log('========================');
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) {
      setError('사용자를 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      console.log('=== 메뉴 권한 저장 요청 로그 ===');
      console.log('선택된 사용자 ID:', selectedUser);
      console.log('저장할 권한 데이터:', permissions);
      console.log('========================');

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/menu-permissions/user/${selectedUser}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissions),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('권한 저장 성공:', result);
        setSuccess('메뉴 권한이 성공적으로 저장되었습니다.');
        fetchUserPermissions(selectedUser as number);
      } else {
        const errorData = await response.json();
        console.error('권한 저장 실패:', errorData);
        setError(errorData.error || '메뉴 권한 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 권한 저장 오류:', error);
      setError('메뉴 권한 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPermissions = () => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser as number);
    }
  };

  // 메뉴 수정 다이얼로그 열기
  const handleEditMenu = (menu: Menu) => {
    setEditMenu(menu);
    setEditFormData({
      name: menu.name,
      name_en: menu.name_en || '',
      url: menu.url || '',
      order_num: menu.order_num,
      parent_id: menu.parent_id
    });
    setEditDialogOpen(true);
  };

  // 메뉴 삭제 다이얼로그 열기
  const handleDeleteMenu = (menu: Menu) => {
    setMenuToDelete(menu);
    setDeleteDialogOpen(true);
  };

  // 메뉴 추가 다이얼로그 열기
  const handleAddMenu = () => {
    setAddFormData({
      name: '',
      name_en: '',
      url: '',
      order_num: 1,
      parent_id: null
    });
    setAddDialogOpen(true);
  };

  // 메뉴 추가 저장
  const handleSaveMenuAdd = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addFormData),
      });

      if (response.ok) {
        setSuccess('메뉴가 성공적으로 추가되었습니다.');
        setAddDialogOpen(false);
        setAddFormData({
          name: '',
          name_en: '',
          url: '',
          order_num: 1,
          parent_id: null
        });
        fetchMenus(); // 메뉴 목록 새로고침
      } else {
        const errorData = await response.json();
        setError(errorData.error || '메뉴 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 추가 오류:', error);
      setError('메뉴 추가 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 순서 변경 (위로)
  const handleMoveUp = async (menu: Menu) => {
    try {
      console.log('=== 메뉴 위로 이동 시작 ===');
      console.log('이동할 메뉴:', menu);
      
      const token = localStorage.getItem('token');
      console.log('토큰 존재:', !!token);
      
      const response = await fetch(`/api/menu/${menu.menu_id}/move-up`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('응답 상태:', response.status);
      console.log('응답 OK:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('응답 데이터:', responseData);
        setSuccess('메뉴 순서가 변경되었습니다.');
        fetchMenus(); // 메뉴 목록 새로고침
      } else {
        const errorText = await response.text();
        console.error('메뉴 순서 변경 실패:', response.status, errorText);
        setError('메뉴 순서 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 순서 변경 오류:', error);
      setError('메뉴 순서 변경 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 순서 변경 (아래로)
  const handleMoveDown = async (menu: Menu) => {
    try {
      console.log('=== 메뉴 아래로 이동 시작 ===');
      console.log('이동할 메뉴:', menu);
      
      const token = localStorage.getItem('token');
      console.log('토큰 존재:', !!token);
      
      const response = await fetch(`/api/menu/${menu.menu_id}/move-down`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('응답 상태:', response.status);
      console.log('응답 OK:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('응답 데이터:', responseData);
        setSuccess('메뉴 순서가 변경되었습니다.');
        fetchMenus(); // 메뉴 목록 새로고침
      } else {
        const errorText = await response.text();
        console.error('메뉴 순서 변경 실패:', response.status, errorText);
        setError('메뉴 순서 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 순서 변경 오류:', error);
      setError('메뉴 순서 변경 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 수정 저장
  const handleSaveMenuEdit = async () => {
    if (!editMenu) return;

    try {
      const token = localStorage.getItem('token');
      
      console.log('=== 메뉴 수정 요청 로그 ===');
      console.log('수정할 메뉴 ID:', editMenu.menu_id);
      console.log('수정 데이터:', editFormData);
      console.log('영문명 값:', editFormData.name_en);
      console.log('========================');
      
      const response = await fetch(`/api/menu/${editMenu.menu_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setSuccess('메뉴가 성공적으로 수정되었습니다.');
        setEditDialogOpen(false);
        setEditMenu(null);
        fetchMenus(); // 메뉴 목록 새로고침
      } else {
        setError('메뉴 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 수정 오류:', error);
      setError('메뉴 수정 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 삭제 확인
  const handleConfirmDelete = async () => {
    if (!menuToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/menu/${menuToDelete.menu_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('메뉴가 성공적으로 삭제되었습니다.');
        setDeleteDialogOpen(false);
        setMenuToDelete(null);
        fetchMenus(); // 메뉴 목록 새로고침
      } else {
        setError('메뉴 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 삭제 오류:', error);
      setError('메뉴 삭제 중 오류가 발생했습니다.');
    }
  };

  const getPermissionForMenu = (menuId: number) => {
    return permissions.find(p => p.menu_id === menuId) || {
      id: 0,
      user_id: selectedUser as number,
      menu_id: menuId,
      can_read: true,
      can_create: true,
      can_update: true,
      can_delete: true,
      create_date: new Date().toISOString()
    };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'root':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'root':
        return '최고관리자';
      default:
        return '일반사용자';
    }
  };

  const searchFilteredUsers = filteredUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMenuLevel = (menu: Menu) => {
    if (!menu.parent_id) return 0;
    const parent = menus.find(m => m.menu_id === menu.parent_id);
    if (!parent) return 1;
    return 2;
  };

  const getMenuIndent = (level: number) => {
    return level * 2;
  };

  // 권한이 있는 메뉴만 필터링하는 함수
  const filterMenusByPermission = (menus: any[]): any[] => {
    return menus.filter(menu => {
      const permission = getPermissionForMenu(menu.menu_id);
      
      // 조회 권한이 있으면 메뉴 표시
      if (permission.can_read) {
        // 하위 메뉴가 있는 경우 재귀적으로 필터링
        if (menu.children && menu.children.length > 0) {
          const filteredChildren = filterMenusByPermission(menu.children);
          menu.children = filteredChildren;
          
          // 하위 메뉴 중 하나라도 표시 가능하면 부모 메뉴도 표시
          return filteredChildren.length > 0;
        }
        return true;
      }
      return false;
    });
  };

  // 메뉴 이름에 따른 아이콘 반환 함수
  const getMenuIcon = (menuName: string, hasChildren: boolean) => {
    const name = menuName.toLowerCase();
    
    // 대시보드 관련
    if (name.includes('대시보드') || name.includes('dashboard')) {
      return <DashboardIcon sx={{ fontSize: 14, color: '#1976d2' }} />;
    }
    
    // 사용자 관리 관련
    if (name.includes('사용자') || name.includes('user')) {
      return <PeopleIcon sx={{ fontSize: 14, color: '#2196f3' }} />;
    }
    
    // 회사 관리 관련
    if (name.includes('회사') || name.includes('company') || name.includes('파트너')) {
      return <BusinessIcon sx={{ fontSize: 14, color: '#4caf50' }} />;
    }
    
    // 권한 관리 관련
    if (name.includes('권한') || name.includes('permission') || name.includes('role')) {
      return <SecurityIcon sx={{ fontSize: 14, color: '#ff9800' }} />;
    }
    
    // 메뉴 관리
    if (name.includes('메뉴') || name.includes('menu')) {
      return <MenuIcon sx={{ fontSize: 14, color: '#9c27b0' }} />;
    }
    
    // 인보이스 관련
    if (name.includes('인보이스') || name.includes('invoice')) {
      return <ReceiptIcon sx={{ fontSize: 14, color: '#f44336' }} />;
    }
    
    // 결제 관련
    if (name.includes('결제') || name.includes('payment')) {
      return <PaymentIcon sx={{ fontSize: 14, color: '#4caf50' }} />;
    }
    
    // 계정 관련
    if (name.includes('계정') || name.includes('account')) {
      return <AccountCircleIcon sx={{ fontSize: 14, color: '#607d8b' }} />;
    }
    
    // 그룹 관련
    if (name.includes('그룹') || name.includes('group')) {
      return <GroupIcon sx={{ fontSize: 14, color: '#795548' }} />;
    }
    
    // 설정 관련
    if (name.includes('설정') || name.includes('setting')) {
      return <SettingsIcon sx={{ fontSize: 14, color: '#607d8b' }} />;
    }
    
    // 목록 관련
    if (name.includes('목록') || name.includes('list')) {
      return <ListIcon sx={{ fontSize: 14, color: '#3f51b5' }} />;
    }
    
    // 홈 관련
    if (name.includes('홈') || name.includes('home')) {
      return <HomeIcon sx={{ fontSize: 14, color: '#4caf50' }} />;
    }
    
    // 문서 관련
    if (name.includes('문서') || name.includes('document') || name.includes('description')) {
      return <DescriptionIcon sx={{ fontSize: 14, color: '#ff9800' }} />;
    }
    
    // 보고서/분석 관련
    if (name.includes('보고서') || name.includes('report') || name.includes('분석') || name.includes('analytics')) {
      return <AssessmentIcon sx={{ fontSize: 14, color: '#e91e63' }} />;
    }
    
    // 알림 관련
    if (name.includes('알림') || name.includes('notification')) {
      return <NotificationsIcon sx={{ fontSize: 14, color: '#ff5722' }} />;
    }
    
    // 도움말 관련
    if (name.includes('도움말') || name.includes('help')) {
      return <HelpIcon sx={{ fontSize: 14, color: '#607d8b' }} />;
    }
    
    // 정보 관련
    if (name.includes('정보') || name.includes('info')) {
      return <InfoIcon sx={{ fontSize: 14, color: '#2196f3' }} />;
    }
    
    // 연락처 관련
    if (name.includes('연락처') || name.includes('contact')) {
      return <ContactSupportIcon sx={{ fontSize: 14, color: '#9c27b0' }} />;
    }
    
    // 시스템 관련
    if (name.includes('시스템') || name.includes('system')) {
      return <BuildIcon sx={{ fontSize: 14, color: '#607d8b' }} />;
    }
    
    // 데이터베이스 관련
    if (name.includes('데이터') || name.includes('data') || name.includes('storage')) {
      return <StorageIcon sx={{ fontSize: 14, color: '#795548' }} />;
    }
    
    // 클라우드 관련
    if (name.includes('클라우드') || name.includes('cloud')) {
      return <CloudIcon sx={{ fontSize: 14, color: '#2196f3' }} />;
    }
    
    // 개발 관련
    if (name.includes('개발') || name.includes('development') || name.includes('code')) {
      return <CodeIcon sx={{ fontSize: 14, color: '#607d8b' }} />;
    }
    
    // 디버그 관련
    if (name.includes('디버그') || name.includes('debug') || name.includes('bug')) {
      return <BugReportIcon sx={{ fontSize: 14, color: '#f44336' }} />;
    }
    
    // 업데이트 관련
    if (name.includes('업데이트') || name.includes('update')) {
      return <UpdateIcon sx={{ fontSize: 14, color: '#4caf50' }} />;
    }
    
    // 백업 관련
    if (name.includes('백업') || name.includes('backup')) {
      return <BackupIcon sx={{ fontSize: 14, color: '#ff9800' }} />;
    }
    
    // 복원 관련
    if (name.includes('복원') || name.includes('restore')) {
      return <RestoreIcon sx={{ fontSize: 14, color: '#2196f3' }} />;
    }
    
    // 아카이브 관련
    if (name.includes('아카이브') || name.includes('archive')) {
      return <ArchiveIcon sx={{ fontSize: 14, color: '#795548' }} />;
    }
    
    // 삭제 관련
    if (name.includes('삭제') || name.includes('delete')) {
      return <DeleteSweepIcon sx={{ fontSize: 14, color: '#f44336' }} />;
    }
    
    // 필터 관련
    if (name.includes('필터') || name.includes('filter')) {
      return <FilterListIcon sx={{ fontSize: 14, color: '#607d8b' }} />;
    }
    
    // 정렬 관련
    if (name.includes('정렬') || name.includes('sort')) {
      return <SortIcon sx={{ fontSize: 14, color: '#795548' }} />;
    }
    
    // 차트 관련
    if (name.includes('차트') || name.includes('chart')) {
      return <BarChartIcon sx={{ fontSize: 14, color: '#e91e63' }} />;
    }
    
    // 통계 관련
    if (name.includes('통계') || name.includes('statistics') || name.includes('analytics')) {
      return <AnalyticsIcon sx={{ fontSize: 14, color: '#9c27b0' }} />;
    }
    
    // 기본 아이콘 (폴더 또는 파일)
    if (hasChildren) {
      return <FolderIcon sx={{ fontSize: 14, color: '#ff9800' }} />;
    } else {
      return <FileIcon sx={{ fontSize: 14, color: '#999' }} />;
    }
  };

  const handleToggleMenu = (menuId: number) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (menuId: number) => {
    return expandedMenus.has(menuId);
  };

  // 트리 구조로 메뉴 렌더링
  const renderMenuTree = (menus: any[], level: number = 0): React.ReactNode[] => {
    return menus.map((menu, index) => {
      const permission = getPermissionForMenu(menu.menu_id);
      const hasChildren = menu.children && menu.children.length > 0;
      const isExpanded = isMenuExpanded(menu.menu_id);
      
      return (
        <React.Fragment key={menu.menu_id}>
          <TableRow 
            hover
            sx={{
              backgroundColor: level === 0 ? '#f8f9fa' : 'inherit',
              '&:hover': {
                backgroundColor: level === 0 ? '#e3f2fd' : '#f5f5f5'
              },
              height: '40px', // 기본 높이를 20% 줄임 (기존 50px에서 40px로)
              '& .MuiTableCell-root': {
                padding: '8px 16px', // 셀 패딩도 줄임
                borderBottom: '1px solid #e0e0e0'
              }
            }}
          >
            <TableCell>
              <Box sx={{ pl: level * 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* 트리 라인 표시 */}
                  {level > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      {Array.from({ length: level }, (_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 16,
                            borderLeft: i === level - 1 ? '2px solid #ddd' : '1px solid #eee',
                            borderBottom: i === level - 1 ? '2px solid #ddd' : 'none',
                            height: 20,
                            mr: 0.5
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  {/* 접기/펼치기 버튼 */}
                  {hasChildren && (
                    <IconButton
                      size="small"
                      onClick={() => handleToggleMenu(menu.menu_id)}
                      sx={{ 
                        p: 0.25, 
                        mr: 0.5,
                        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                      }}
                    >
                      {isExpanded ? (
                        <ExpandMoreIcon sx={{ fontSize: 14, color: '#1976d2' }} />
                      ) : (
                        <ChevronRightIcon sx={{ fontSize: 14, color: '#666' }} />
                      )}
                    </IconButton>
                  )}
                  
                  {/* 아이콘 */}
                  <Box sx={{ mr: 0.5 }}>
                    {getMenuIcon(menu.name, hasChildren)}
                  </Box>
                  
                  {/* 메뉴명 */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: level === 0 ? 600 : 400,
                        color: level === 0 ? '#1976d2' : 'inherit',
                        fontSize: level === 0 ? '0.85rem' : '0.75rem'
                      }}
                    >
                      {menu.name}
                    </Typography>
                    {menu.name_en && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#666',
                          fontSize: level === 0 ? '0.7rem' : '0.6rem',
                          display: 'block',
                          mt: 0.1
                        }}
                      >
                        {menu.name_en}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* 하위메뉴 개수 표시 */}
                  {hasChildren && (
                    <Chip 
                      label={`${menu.children.length}개 하위메뉴`} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: level === 0 ? '0.6rem' : '0.55rem', height: 16, mr: 1 }}
                    />
                  )}

                  {/* 메뉴 관리 버튼들 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* 순서 변경 버튼들 */}
                    <Tooltip title="위로 이동">
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUp(menu)}
                        sx={{ 
                          p: 0.25,
                          color: '#666',
                          '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <ArrowUpIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="아래로 이동">
                      <IconButton
                        size="small"
                        onClick={() => handleMoveDown(menu)}
                        sx={{ 
                          p: 0.25,
                          color: '#666',
                          '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <ArrowDownIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>

                    {/* 수정 버튼 */}
                    <Tooltip title="메뉴 수정">
                      <IconButton
                        size="small"
                        onClick={() => handleEditMenu(menu)}
                        sx={{ 
                          p: 0.25,
                          color: '#666',
                          '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>

                    {/* 삭제 버튼 */}
                    <Tooltip title="메뉴 삭제">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMenu(menu)}
                        sx={{ 
                          p: 0.25,
                          color: '#666',
                          '&:hover': { color: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.1)' }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                {/* URL 표시 */}
                {menu.url && (
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.25, ml: 2.5, fontSize: level === 0 ? '0.65rem' : '0.6rem' }}>
                    {menu.url}
                  </Typography>
                )}
              </Box>
                                     </TableCell>
                         {selectedUser && (
                           <>

                             <TableCell align="center">
                               <Checkbox
                                 checked={permission.can_read}
                                 onChange={(e) => handlePermissionChange(menu.menu_id, 'can_read', e.target.checked)}
                                 color="primary"
                                 size="small"
                                 sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                               />
                             </TableCell>
                             <TableCell align="center">
                               <Checkbox
                                 checked={permission.can_create}
                                 onChange={(e) => handlePermissionChange(menu.menu_id, 'can_create', e.target.checked)}
                                 color="primary"
                                 size="small"
                                 sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                               />
                             </TableCell>
                             <TableCell align="center">
                               <Checkbox
                                 checked={permission.can_update}
                                 onChange={(e) => handlePermissionChange(menu.menu_id, 'can_update', e.target.checked)}
                                 color="primary"
                                 size="small"
                                 sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                               />
                             </TableCell>
                             <TableCell align="center">
                               <Checkbox
                                 checked={permission.can_delete}
                                 onChange={(e) => handlePermissionChange(menu.menu_id, 'can_delete', e.target.checked)}
                                 color="primary"
                                 size="small"
                                 sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                               />
                             </TableCell>
                           </>
                         )}
          </TableRow>
          {hasChildren && isExpanded && renderMenuTree(menu.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon sx={{ fontSize: 20, color: '#1976d2' }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            사용자 권한 관리
          </Typography>
          <Chip 
            label="통합 권한 관리" 
            size="small" 
            sx={{ 
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              fontWeight: 600,
              fontSize: '0.7rem'
            }} 
          />
        </Box>
      </Box>

      {/* 에러 및 성공 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* 사용자 선택 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          사용자 선택
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="사용자명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>사용자 선택</InputLabel>
            <Select
              value={selectedUser}
              label="사용자 선택"
              onChange={(e) => setSelectedUser(e.target.value as number | '')}
            >
              <MenuItem value="">
                <em>사용자를 선택하세요</em>
              </MenuItem>
              {searchFilteredUsers.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>사용자명: {user.username}</span>
                    <span style={{ color: '#666', fontSize: '0.875rem' }}>
                      (ID: {user.id})
                    </span>
                    <Chip
                      label={getRoleLabel(user.role)}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                    {user.company && (
                      <span style={{ color: '#666', fontSize: '0.875rem' }}>
                        ({user.company.name})
                      </span>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 메뉴 권한 테이블 */}
      {menuTree && menuTree.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                메뉴 트리 구조
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddMenu}
                  sx={{ 
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    '&:hover': {
                      borderColor: '#1565c0',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  메뉴 추가
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    fetchMenus();
                    if (selectedUser) {
                      fetchUserPermissions(selectedUser as number);
                    }
                  }}
                  disabled={saving}
                >
                  새로고침
                </Button>
                {selectedUser && (
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSavePermissions}
                    disabled={saving}
                  >
                    {saving ? '저장 중...' : '권한 저장'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, minWidth: 300 }}>메뉴명</TableCell>
                    {selectedUser && (
                      <>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>조회</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>생성</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>수정</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>삭제</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renderMenuTree(menuTree)}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            메뉴 데이터를 불러오는 중입니다...
          </Typography>
        </Paper>
      )}



      {/* 메뉴 추가 다이얼로그 */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 메뉴 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('menuName')}
              value={addFormData.name}
              onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label={t('menuNameEn')}
              value={addFormData.name_en}
              onChange={(e) => setAddFormData(prev => ({ ...prev, name_en: e.target.value }))}
              sx={{ mb: 2 }}
              placeholder="Menu Name (English)"
            />
            <TextField
              fullWidth
              label="URL"
              value={addFormData.url}
              onChange={(e) => setAddFormData(prev => ({ ...prev, url: e.target.value }))}
              sx={{ mb: 2 }}
              placeholder="/example"
            />
            <TextField
              fullWidth
              type="number"
              label="순서"
              value={addFormData.order_num}
              onChange={(e) => setAddFormData(prev => ({ ...prev, order_num: parseInt(e.target.value) || 1 }))}
              sx={{ mb: 2 }}
              required
            />
            <FormControl fullWidth>
              <InputLabel>상위 메뉴</InputLabel>
              <Select
                value={addFormData.parent_id || ''}
                onChange={(e) => setAddFormData(prev => ({ ...prev, parent_id: e.target.value as number || null }))}
                label="상위 메뉴"
              >
                <MenuItem value="">없음 (최상위 메뉴)</MenuItem>
                {menus.map(menu => (
                  <MenuItem key={menu.menu_id} value={menu.menu_id}>
                    {menu.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handleSaveMenuAdd} 
            variant="contained"
            disabled={!addFormData.name.trim()}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 메뉴 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>메뉴 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('menuName')}
              value={editFormData.name}
              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('menuNameEn')}
              value={editFormData.name_en}
              onChange={(e) => setEditFormData(prev => ({ ...prev, name_en: e.target.value }))}
              sx={{ mb: 2 }}
              placeholder="Menu Name (English)"
            />
            <TextField
              fullWidth
              label="URL"
              value={editFormData.url}
              onChange={(e) => setEditFormData(prev => ({ ...prev, url: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="순서"
              value={editFormData.order_num}
              onChange={(e) => setEditFormData(prev => ({ ...prev, order_num: parseInt(e.target.value) || 1 }))}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>상위 메뉴</InputLabel>
              <Select
                value={editFormData.parent_id || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, parent_id: e.target.value as number || null }))}
                label="상위 메뉴"
              >
                <MenuItem value="">없음 (최상위 메뉴)</MenuItem>
                {menus
                  .filter(menu => menu.menu_id !== editMenu?.menu_id) // 자기 자신은 제외
                  .map(menu => (
                    <MenuItem key={menu.menu_id} value={menu.menu_id}>
                      {menu.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveMenuEdit} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>

      {/* 메뉴 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>메뉴 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 "{menuToDelete?.name}" 메뉴를 삭제하시겠습니까?
            <br />
            <strong>주의:</strong> 이 메뉴와 관련된 모든 하위 메뉴와 권한 정보도 함께 삭제됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuPermissionPage; 