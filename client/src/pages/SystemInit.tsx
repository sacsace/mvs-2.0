import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  AlertTitle,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const SystemInit: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // 필수 정보
    companyName: '',
    username: '',
    password: '',
    confirmPassword: '',
    
    // 선택 정보 - 회사 상세
    businessNumber: '',
    representativeName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    
    // 선택 정보 - 관리자 상세
    adminUserId: '',
    defaultLanguage: 'ko',
    
    // 선택 정보 - 시스템 설정
    partnerType: '',
    productCategory: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (!formData.companyName.trim() || !formData.username.trim()) {
      setError('회사명과 사용자명은 필수입니다.');
      setLoading(false);
      return;
    }

    try {
      // 1. 사용자 존재 여부 확인
      const hasUserRes = await axios.get('/api/init/has-user');
      if (hasUserRes.data.hasUser) {
        setError('시스템이 이미 초기화되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // 2. 기본 초기화 API 호출 - InitPage의 구조와 맞춤
      const response = await axios.post('/api/init', {
        company: {
          name: formData.companyName,
          business_number: formData.businessNumber || '',
          representative_name: formData.representativeName || '',
          address: formData.companyAddress || '',
          phone: formData.companyPhone || '',
          email: formData.companyEmail || '',
          partner_type: formData.partnerType || null,
          product_category: formData.productCategory || ''
        },
        admin: {
          userid: formData.adminUserId || formData.username,
          username: formData.username,
          password: formData.password,
          default_language: formData.defaultLanguage
        },
        gstData: [], // 빈 배열로 시작
        menus: [
          // 메인 카테고리
          { id: 1, name: '대시보드', name_en: 'Dashboard', icon: 'dashboard', order: 1, parent_id: null, url: '/dashboard' },
          { id: 2, name: '사용자 관리', name_en: 'User Management', icon: 'people', order: 2, parent_id: null, url: null },
          { id: 3, name: '권한 관리', name_en: 'Permission Management', icon: 'security', order: 3, parent_id: null, url: null },
          { id: 4, name: '업무 관리', name_en: 'Business Management', icon: 'work', order: 4, parent_id: null, url: null },
          { id: 5, name: '회계 관리', name_en: 'Accounting Management', icon: 'account_balance', order: 5, parent_id: null, url: null },
          
          // 사용자 관리 하위 메뉴
          { id: 21, name: '사용자 목록', name_en: 'User List', icon: 'list', order: 1, parent_id: 2, url: '/users/list' },
          { id: 22, name: '회사 정보 관리', name_en: 'Company Management', icon: 'business', order: 2, parent_id: 2, url: '/users/company' },
          { id: 23, name: '파트너 업체 관리', name_en: 'Partner Management', icon: 'handshake', order: 3, parent_id: 2, url: '/users/partners' },
          
          // 권한 관리 하위 메뉴
          { id: 31, name: '메뉴 권한 관리', name_en: 'Menu Permission', icon: 'menu_book', order: 1, parent_id: 3, url: '/permissions/menu' },
          { id: 32, name: '사용자 권한 관리', name_en: 'User Permission', icon: 'person_add', order: 2, parent_id: 3, url: '/permissions/user' },
          { id: 33, name: '역할 관리', name_en: 'Role Management', icon: 'admin_panel_settings', order: 3, parent_id: 3, url: '/permissions/roles' },
          { id: 34, name: '권한 설정', name_en: 'Permission Settings', icon: 'settings', order: 4, parent_id: 3, url: '/permissions/manage' },
          
          // 업무 관리 하위 메뉴
          { id: 41, name: '전자결재', name_en: 'Electronic Approval', icon: 'approval', order: 1, parent_id: 4, url: '/approval' },
          
          // 회계 관리 하위 메뉴
          { id: 51, name: '매출 관리', name_en: 'Sales Management', icon: 'receipt', order: 1, parent_id: 5, url: '/accounting/invoices' },
          { id: 52, name: '매입/매출 통계', name_en: 'Purchase/Sales Statistics', icon: 'analytics', order: 2, parent_id: 5, url: '/accounting/statistics' }
        ],
        roles: [
          {
            name: '관리자',
            name_en: 'Administrator',
            description: '시스템 전체 관리 권한',
            description_en: 'Full system administration privileges',
            level: 'admin',
            company_access: 'own'
          }
        ],
        permissions: [
          {
            name: '시스템 관리',
            description: '시스템 전체 관리 권한',
            level: 'admin',
            company_access: 'own'
          }
        ]
      });

      if (response.data.success) {
        setError('');
        setSuccess(true);
        // 2초 후 페이지 새로고침 (자동으로 로그인 페이지로 리다이렉트됨)
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Initialization error:', error);
      
      if (error.response?.status === 400 && error.response?.data?.error === 'ALREADY_INITIALIZED') {
        setError('시스템이 이미 초기화되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('초기화 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 2
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%', borderRadius: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            시스템 초기화
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            최초 관리자 계정을 생성합니다
          </Typography>
          <Chip 
            label="필수 정보를 입력하고, 선택 정보는 나중에 설정할 수 있습니다" 
            variant="outlined" 
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        <form onSubmit={handleSubmit}>

          {/* 필수 정보 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <BusinessIcon sx={{ mr: 1, color: '#1976d2' }} />
              필수 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="회사명 *"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="사용자명 *"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="관리자 ID (선택사항)"
                  name="adminUserId"
                  value={formData.adminUserId}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  placeholder="비어있으면 사용자명 사용"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="비밀번호 *"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="비밀번호 확인 *"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>기본 언어</InputLabel>
                  <Select
                    value={formData.defaultLanguage}
                    label="기본 언어"
                    onChange={(e) => handleSelectChange('defaultLanguage', e.target.value)}
                  >
                    <MenuItem value="ko">한국어</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 선택 정보 섹션 - 접이식 */}
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1, color: '#666' }} />
                회사 상세 정보 (선택사항)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="사업자등록번호"
                    name="businessNumber"
                    value={formData.businessNumber}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="대표자명"
                    name="representativeName"
                    value={formData.representativeName}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="회사 주소"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="회사 전화번호"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="회사 이메일"
                    name="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: '#666' }} />
                비즈니스 설정 (선택사항)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>파트너 유형</InputLabel>
                    <Select
                      value={formData.partnerType}
                      label="파트너 유형"
                      onChange={(e) => handleSelectChange('partnerType', e.target.value)}
                    >
                      <MenuItem value="">선택 안함</MenuItem>
                      <MenuItem value="supplier">공급업체</MenuItem>
                      <MenuItem value="customer">고객</MenuItem>
                      <MenuItem value="both">공급업체 & 고객</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="제품 카테고리"
                    name="productCategory"
                    value={formData.productCategory}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    placeholder="전자제품, 의류, 식품 등"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading || success}
            sx={{ 
              mt: 3, 
              py: 1.5, 
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? '초기화 중...' : success ? '완료됨' : '초기화'}
          </Button>

          {/* 성공 메시지 */}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <AlertTitle>초기화 완료!</AlertTitle>
              시스템 초기화가 성공적으로 완료되었습니다. 잠시 후 페이지가 새로고침됩니다...
            </Alert>
          )}

          {/* 오류 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>오류</AlertTitle>
              {error}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2, display: 'block' }}>
            초기화 후 나머지 설정은 관리 메뉴에서 할 수 있습니다
          </Typography>
        </form>
      </Paper>
    </Box>
  );
};

export default SystemInit; 