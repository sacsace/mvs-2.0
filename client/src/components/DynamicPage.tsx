import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Icon,
  Chip
} from '@mui/material';
import { useParams } from 'react-router-dom';

interface DynamicPageProps {
  menuData?: {
    name: string;
    icon?: string;
    url?: string;
    description?: string;
  };
}

const DynamicPage: React.FC<DynamicPageProps> = ({ menuData }) => {
  const { pageId } = useParams<{ pageId: string }>();

  // 기본 페이지 데이터
  const defaultPageData = {
    name: menuData?.name || '새 페이지',
    icon: menuData?.icon || 'pageview',
    description: menuData?.description || '이 페이지는 동적으로 생성되었습니다. 향후 기능이 추가될 예정입니다.',
    features: [
      '데이터 조회 기능',
      '데이터 추가/수정 기능',
      '데이터 삭제 기능',
      '권한 관리 기능'
    ]
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* 페이지 헤더 */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Icon sx={{ fontSize: 40, mr: 2 }}>
                {defaultPageData.icon}
              </Icon>
              <Typography variant="h4" component="h1">
                {defaultPageData.name}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {defaultPageData.description}
            </Typography>
          </Paper>
        </Grid>

        {/* 페이지 정보 카드 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="페이지 정보"
              subheader="현재 페이지의 기본 정보"
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  페이지 ID
                </Typography>
                <Typography variant="body1">
                  {pageId || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  URL 경로
                </Typography>
                <Typography variant="body1">
                  {menuData?.url || '/dynamic-page'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  생성 상태
                </Typography>
                <Chip 
                  label="기본 페이지" 
                  color="primary" 
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 예상 기능 카드 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="예상 기능"
              subheader="향후 추가될 예정인 기능들"
            />
            <CardContent>
              <Grid container spacing={1}>
                {defaultPageData.features.map((feature, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Icon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}>
                        check_circle_outline
                      </Icon>
                      <Typography variant="body2">
                        {feature}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 개발 가이드 카드 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="개발 가이드"
              subheader="이 페이지를 확장하는 방법"
            />
            <CardContent>
              <Typography variant="body2" paragraph>
                이 페이지는 동적으로 생성된 기본 페이지입니다. 실제 기능을 추가하려면:
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>컴포넌트 생성:</strong> src/pages/ 디렉토리에 새로운 페이지 컴포넌트를 생성하세요.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>라우트 등록:</strong> App.tsx에서 새로운 라우트를 등록하세요.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>API 연동:</strong> 필요한 API 엔드포인트를 서버에 추가하세요.
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>권한 설정:</strong> 메뉴 권한 관리에서 해당 페이지에 대한 권한을 설정하세요.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DynamicPage; 