import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import DynamicPage from './DynamicPage';
import MenuManagement from '../pages/MenuManagement';
import InvoicePage from '../pages/InvoicePage';
import { CircularProgress, Box, Typography } from '@mui/material';

interface MenuItem {
  menu_id: number;
  name: string;
  icon: string;
  url: string;
  order_num: number;
  parent_id: number | null;
  children?: MenuItem[];
}

const DynamicRouter: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await axios.get('/api/menu');
        if (response.data.success) {
          setMenus(response.data.data);
        }
      } catch (err) {
        console.error('메뉴 조회 실패:', err);
        setError('메뉴를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // 메뉴를 URL로 매핑하는 함수
  const createMenuRoutes = (menuList: MenuItem[]): JSX.Element[] => {
    const routes: JSX.Element[] = [];
    console.log('=== DynamicRouter: 메뉴 라우트 생성 시작 ===');
    console.log('메뉴 목록:', menuList);

    const processMenu = (menu: MenuItem) => {
      console.log('처리 중인 메뉴:', menu.name, 'URL:', menu.url);
      
      if (menu.url) {
        // 특정 URL에 대한 컴포넌트 매핑
        let component = <DynamicPage menuData={menu} />;
        
        if (menu.url === '/accounting/invoices') {
          console.log('매출 관리 페이지 매핑됨!');
          component = <InvoicePage />;
        }
        
        console.log('라우트 추가:', menu.url, '컴포넌트:', component.type.name || 'DynamicPage');
        routes.push(
          <Route
            key={menu.menu_id}
            path={menu.url}
            element={component}
          />
        );
      }

      // 하위 메뉴 처리
      if (menu.children && menu.children.length > 0) {
        menu.children.forEach(processMenu);
      }
    };

    menuList.forEach(processMenu);
    console.log('생성된 라우트 수:', routes.length);
    return routes;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        flexDirection="column"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          메뉴를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        flexDirection="column"
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Routes>
      {/* 동적으로 생성된 메뉴 라우트들 */}
      {createMenuRoutes(menus)}
      
      {/* 기본 라우트들 */}
      <Route path="/dashboard" element={<div>대시보드</div>} />
      <Route path="/users" element={<div>사용자 관리</div>} />
      <Route path="/permissions" element={<div>권한 관리</div>} />
      <Route path="/menus" element={<MenuManagement />} />
      <Route path="/invoices" element={<div>Invoice 관리</div>} />
      <Route path="/payments" element={<div>결제 관리</div>} />
      
      {/* 404 페이지 */}
      <Route path="*" element={<DynamicPage menuData={{ name: '페이지를 찾을 수 없습니다' }} />} />
    </Routes>
  );
};

export default DynamicRouter; 