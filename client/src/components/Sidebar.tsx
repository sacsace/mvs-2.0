import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Collapse,
  Alert,
  Snackbar,
  Typography,
} from '@mui/material';
import axios from 'axios';
import * as Icons from '@mui/icons-material';
import { 
  Dashboard, 
  People, 
  Business, 
  Menu, 
  Security, 
  Handshake,
  // 심플한 아이콘들
  Home,
  Person,
  Group,
  BusinessCenter,
  Settings,
  Assignment,
  Description,
  Assessment,
  Notifications,
  Help,
  Info,
  ContactSupport,
  Build,
  Storage,
  Cloud,
  Code,
  BugReport,
  Update,
  Backup,
  Restore,
  Archive,
  DeleteSweep,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  ViewQuilt,
  Timeline,
  TrendingUp,
  TrendingDown,
  Analytics,
  BarChart,
  PieChart,
  ShowChart,
  InsertChart,
  TableChart,
  ScatterPlot,
  BubbleChart,
  MultilineChart,
  StackedLineChart,
  DonutSmall,
  DonutLarge,
  IndeterminateCheckBox,
  CheckBox,
  CheckBoxOutlineBlank,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Star,
  StarBorder,
  StarHalf,
  Favorite,
  FavoriteBorder,
  ThumbUp,
  ThumbDown,
  ThumbUpAlt,
  ThumbDownAlt,
  Check,
  Close,
  Warning,
  Error,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  CheckCircleOutline,
  CancelOutlined,
  AddCircle,
  RemoveCircle,
  AddCircleOutline,
  RemoveCircleOutline,
  ExpandMore,
  ExpandLess,
  UnfoldMore,
  UnfoldLess,
  MoreVert,
  MoreHoriz,
  Apps,
  GridView,
  ViewComfy,
  ViewCompact,
  ViewHeadline,
  ViewStream,
  ViewWeek,
  ViewDay,
  ViewAgenda,
  ViewCarousel,
  ViewColumn,
  ViewSidebar,
  ViewTimeline,
  ViewInAr,
  ViewKanban,
  Folder
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

interface Menu {
  menu_id: number;
  name: string;
  icon: string;
  order_num: number;
  parent_id: number | null;
  children: Menu[];
  route?: string;
}

const routeMap: Record<number, string> = {
  1: '/dashboard/info',
  2: '/dashboard/bill',
  3: '/dashboard/payment',
  4: '/dashboard/user',
  5: '/dashboard/menu-mng',
  6: '/dashboard/partner',
  7: '/dashboard/supplier',
  8: '/dashboard/company',
  9: '/dashboard/e-invoice',
  10: '/dashboard/general-bill',
  11: '/dashboard/payment',
  12: '/dashboard/proposal',
  16: '/dashboard/menu-auth',
};

const menusWithRoute = (menus: Menu[]): Menu[] =>
  menus.map(menu => ({
    ...menu,
    route: routeMap[menu.menu_id],
    children: menu.children ? menusWithRoute(menu.children) : [],
  }));

const validRoutes = [
  '/dashboard/info',
  '/dashboard/bill',
  '/dashboard/payment',
  '/dashboard/user',
  '/dashboard/menu-mng',
  '/dashboard/partner',
  '/dashboard/supplier',
  '/dashboard/company',
  '/dashboard/e-invoice',
  '/dashboard/general-bill',
  '/dashboard/payment',
  '/dashboard/proposal',
  '/dashboard/menu-auth',
];

const menuItems = [
  {
    name: '대시보드',
    path: '/dashboard',
    icon: <Dashboard />
  },
  {
    name: '사용자 관리',
    path: '/dashboard/user',
    icon: <People />
  },
  {
    name: '회사 관리',
    path: '/dashboard/company',
    icon: <Business />
  },
  {
    name: '메뉴 관리',
    path: '/dashboard/menu-mng',
    icon: <Menu />
  },
  {
    name: '메뉴 권한 관리',
    path: '/dashboard/menu-auth',
    icon: <Security />
  },
  {
    name: '파트너 관리',
    path: '/dashboard/partner',
    icon: <Handshake />
  }
];

const menuItemStyle = {
  color: 'white',
  fontSize: '0.85rem',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
};

const subMenuItemStyle = {
  color: 'white',
  fontSize: '0.8rem',
  paddingLeft: '32px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const [noPageOpen, setNoPageOpen] = useState(false);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/menus', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.data && response.data.success && response.data.data) {
          // 계층 구조를 평면 구조로 변환
          const flattenMenus = flattenMenuTree(response.data.data);
          setMenus(menusWithRoute(flattenMenus));
        } else if (Array.isArray(response.data)) {
          setMenus(menusWithRoute(response.data));
        } else {
          setMenus([]);
        }
      } catch (error) {
        console.error('Error fetching menus:', error);
        setMenus([]);
      }
    };
    fetchMenus();
  }, []);

  // 메뉴 트리를 평면 구조로 변환하는 함수
  const flattenMenuTree = (menuTree: any[]): any[] => {
    const result: any[] = [];
    
    const flatten = (menus: any[]) => {
      menus.forEach(menu => {
        result.push({
          ...menu,
          children: undefined // children 속성 제거
        });
        if (menu.children && menu.children.length > 0) {
          flatten(menu.children);
        }
      });
    };
    
    flatten(menuTree);
    return result;
  };

  const handleMenuClick = (menu: Menu) => {
    if (menu.children && menu.children.length > 0) {
      // 하위 메뉴가 있는 경우 확장/축소
      setExpandedMenus(prev => 
        prev.includes(menu.menu_id)
          ? prev.filter(id => id !== menu.menu_id)
          : [...prev, menu.menu_id]
      );
    } else {
      console.log('menu.route:', menu.route, '| valid:', validRoutes.includes(menu.route ?? ''));
      if (
        !menu.route ||
        typeof menu.route !== 'string' ||
        menu.route.trim() === '' ||
        !validRoutes.includes(menu.route)
      ) {
        setNoPageOpen(true);
      } else {
        navigate(menu.route);
      }
    }
  };

  const getIcon = (iconName: string) => {
    // 메뉴 이름에 따른 심플한 아이콘 매핑
    const iconMap: { [key: string]: any } = {
      // 기본 아이콘들
      'dashboard': Dashboard,
      'people': People,
      'business': Business,
      'menu': Menu,
      'security': Security,
      'handshake': Handshake,
      
      // 정보 관리 관련
      '정보관리': Group,
      '사용자관리': Person,
      '회사정보관리': BusinessCenter,
      '파트너업체관리': Business,
      
      // 권한 관리 관련
      '권한관리': Security,
      '메뉴권한관리': Assignment,
      '권한관리_sub': Security,
      '사용자권한관리': Person,
      '역할관리': Security,
      
      // 업무관리 관련
      '업무관리': Assignment,
      '업무통계': Assessment,
      '일정관리': Timeline,
      '담당업무': Assignment,
      
      // 회계관리 관련
      '회계관리': BarChart,
      '매입매출통계': PieChart,
      '매출관리': TrendingUp,
      '매입관리': TrendingUp,
      
      // 전자결재 관련
      '전자결재': Description,
      
      // 기타 심플한 아이콘들
      'home': Home,
      'person': Person,
      'group': Group,
      'business_center': BusinessCenter,
      'settings': Settings,
      'assignment': Assignment,
      'description': Description,
      'assessment': Assessment,
      'notifications': Notifications,
      'help': Help,
      'info': Info,
      'contact_support': ContactSupport,
      'build': Build,
      'storage': Storage,
      'cloud': Cloud,
      'code': Code,
      'bug_report': BugReport,
      'update': Update,
      'backup': Backup,
      'restore': Restore,
      'archive': Archive,
      'delete_sweep': DeleteSweep,
      'filter_list': FilterList,
      'sort': Sort,
      'view_list': ViewList,
      'view_module': ViewModule,
      'view_quilt': ViewQuilt,
      'timeline': Timeline,
      'trending_up': TrendingUp,
      'analytics': Analytics,
      'bar_chart': BarChart,
      'pie_chart': PieChart,
      'show_chart': ShowChart,
      'insert_chart': InsertChart,
      'table_chart': TableChart,
      'scatter_plot': ScatterPlot,
      'bubble_chart': BubbleChart,
      'multiline_chart': MultilineChart,
      'stacked_line_chart': StackedLineChart,
      'donut_small': DonutSmall,
      'donut_large': DonutLarge,
      'indeterminate_check_box': IndeterminateCheckBox,
      'check_box': CheckBox,
      'check_box_outline_blank': CheckBoxOutlineBlank,
      'radio_button_checked': RadioButtonChecked,
      'radio_button_unchecked': RadioButtonUnchecked,
      'star': Star,
      'star_border': StarBorder,
      'star_half': StarHalf,
      'favorite': Favorite,
      'favorite_border': FavoriteBorder,
      'thumb_up': ThumbUp,
      'thumb_down': ThumbDown,
      'thumb_up_alt': ThumbUpAlt,
      'thumb_down_alt': ThumbDownAlt,
      'check': Check,
      'close': Close,
      'warning': Warning,
      'error': Error,
      'error_outline': ErrorOutline,
      'warning_amber': WarningAmber,
      'info_outlined': InfoOutlined,
      'check_circle_outline': CheckCircleOutline,
      'cancel_outlined': CancelOutlined,
      'add_circle': AddCircle,
      'remove_circle': RemoveCircle,
      'add_circle_outline': AddCircleOutline,
      'remove_circle_outline': RemoveCircleOutline,
      'expand_more': ExpandMore,
      'expand_less': ExpandLess,
      'unfold_more': UnfoldMore,
      'unfold_less': UnfoldLess,
      'more_vert': MoreVert,
      'more_horiz': MoreHoriz,
      'apps': Apps,
      'grid_view': GridView,
      'view_comfy': ViewComfy,
      'view_compact': ViewCompact,
      'view_headline': ViewHeadline,
      'view_stream': ViewStream,
      'view_week': ViewWeek,
      'view_day': ViewDay,
      'view_agenda': ViewAgenda,
      'view_carousel': ViewCarousel,
      'view_column': ViewColumn,
      'view_sidebar': ViewSidebar,
      'view_timeline': ViewTimeline,
      'view_in_ar': ViewInAr,
      'view_kanban': ViewKanban
    };
    
    // 아이콘 이름을 소문자로 변환하고 언더스코어로 변경
    const normalizedIconName = iconName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // 매핑된 아이콘이 있으면 사용, 없으면 기본 아이콘 사용
    const IconComponent = iconMap[normalizedIconName] || iconMap[iconName] || (Icons as any)[iconName] || Icons.Folder;
    
    return <IconComponent sx={{ fontSize: '1.2rem' }} />;
  };

  // 메뉴 이름에 따른 심플한 아이콘 선택 함수
  const getSimpleIcon = (menuName: string) => {
    const name = menuName.toLowerCase();
    
    // 정보 관리 관련
    if (name.includes('정보관리') || name.includes('information')) {
      return Group;
    }
    if (name.includes('사용자') || name.includes('user')) {
      return Person;
    }
    if (name.includes('회사') || name.includes('company')) {
      return BusinessCenter;
    }
    if (name.includes('파트너') || name.includes('partner')) {
      return Business;
    }
    
    // 권한 관리 관련
    if (name.includes('권한') || name.includes('permission')) {
      return Security;
    }
    if (name.includes('메뉴권한') || name.includes('menu permission')) {
      return Assignment;
    }
    if (name.includes('역할') || name.includes('role')) {
      return Security;
    }
    
    // 업무관리 관련
    if (name.includes('업무') || name.includes('task') || name.includes('work')) {
      return Assignment;
    }
    if (name.includes('통계') || name.includes('statistics')) {
      return Assessment;
    }
    if (name.includes('일정') || name.includes('schedule')) {
      return Timeline;
    }
    if (name.includes('담당') || name.includes('assigned')) {
      return Assignment;
    }
    
    // 회계관리 관련
    if (name.includes('회계') || name.includes('accounting')) {
      return BarChart;
    }
    if (name.includes('매출') || name.includes('sales')) {
      return TrendingUp;
    }
    if (name.includes('매입') || name.includes('purchase')) {
      return TrendingDown;
    }
    
    // 전자결재 관련
    if (name.includes('전자결재') || name.includes('electronic approval')) {
      return Description;
    }
    
    // 기본 아이콘
    return Folder;
  };

  const renderMenuItem = (menu: Menu, level: number = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.includes(menu.menu_id);

    return (
      <React.Fragment key={menu.menu_id}>
        <ListItem
          button
          onClick={() => handleMenuClick(menu)}
          sx={{
            pl: level === 0 ? 1.5 : 3 + level * 1.5,
            minHeight: 32,
            borderRadius: level === 0 ? 2 : 1,
            mb: 0.2,
            bgcolor: level === 0 ? '#f9fafb' : 'rgba(25, 118, 210, 0.02)',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: level === 0 ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)',
            },
            fontWeight: level === 0 ? 600 : 400,
            fontSize: level === 0 ? '0.75rem' : '0.65rem',
            color: '#222',
            boxShadow: 'none',
            border: 'none',
          }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: level === 0 ? '#1976d2' : '#b0b8c1', fontSize: level === 0 ? '1rem' : '0.9rem' }}>
            {(() => {
              const IconComponent = getSimpleIcon(menu.name);
              return <IconComponent sx={{ fontSize: '1.2rem' }} />;
            })()}
          </ListItemIcon>
          <ListItemText
            primary={menu.name}
            primaryTypographyProps={{
              fontSize: level === 0 ? '0.75rem' : '0.65rem',
              fontWeight: level === 0 ? 600 : 400,
              color: '#222',
              fontFamily: `'Pretendard', 'Noto Sans KR', 'Roboto', 'Apple SD Gothic Neo', 'sans-serif'`,
            }}
          />
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ ml: 0.5, pl: 0, borderLeft: '1px solid #e3eafc' }}>
              {menu.children.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        flexShrink: 0,
        borderRight: '1px solid #e3eafc',
        height: '100%',
        overflow: 'auto',
        bgcolor: '#fff',
        boxShadow: '0 4px 24px rgba(25, 118, 210, 0.08)',
        borderTopRightRadius: 32,
        borderBottomRightRadius: 32,
        borderRadius: { sm: '0 16px 16px 0', xs: 0 },
        p: 1.5,
        pt: 10,
        minHeight: 0,
        fontFamily: `'Pretendard', 'Noto Sans KR', 'Roboto', 'Apple SD Gothic Neo', 'sans-serif'`,
      }}
    >
      <List sx={{ pt: 0, fontFamily: `'Pretendard', 'Noto Sans KR', 'Roboto', 'Apple SD Gothic Neo', 'sans-serif'` }}>
        {menus.length > 0 ? (
          menus.map((menu, idx) => (
            <React.Fragment key={menu.menu_id}>
              {idx > 0 && <Divider sx={{ my: 0.7, borderColor: '#e3eafc', borderBottomWidth: 1 }} />}
              {renderMenuItem(menu)}
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.875rem',
                fontFamily: `'Pretendard', 'Noto Sans KR', 'Roboto', 'Apple SD Gothic Neo', 'sans-serif'`
              }}
            >
              메뉴 권한이 없습니다.
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem',
                fontFamily: `'Pretendard', 'Noto Sans KR', 'Roboto', 'Apple SD Gothic Neo', 'sans-serif'`,
                mt: 1,
                display: 'block'
              }}
            >
              관리자에게 메뉴 권한을 요청하세요.
            </Typography>
          </Box>
        )}
      </List>
      <Snackbar open={noPageOpen} autoHideDuration={2000} onClose={() => setNoPageOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="warning" sx={{ width: '100%' }} onClose={() => setNoPageOpen(false)}>
          페이지 없음
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sidebar; 