import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  Divider,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(2.5),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  borderRadius: '8px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1.5),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
  },
  '& .MuiInputBase-input': {
    fontSize: '0.875rem',
    padding: '8px 12px',
    height: '1.2em',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderWidth: '1px',
    },
    minHeight: '40px',
  },
  marginBottom: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '0.875rem',
  padding: '6px 16px',
}));

const StyledFooter = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(1),
  textAlign: 'center',
  backgroundColor: 'transparent',
  '& .MuiTypography-root': {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: theme.spacing(4),
}));

interface Menu {
  id: number;
  name: string;
  icon: string;
  order: number;
  parent_id: number | null;
}

interface CompanyGstData {
  gst_number: string;
  address: string;
  is_primary: boolean;
}

interface RoleData {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  level: 'root' | 'admin' | 'regular' | 'audit' | 'custom';
  company_access: 'all' | 'own' | 'none';
}

interface PermissionData {
  name: string;
  description: string;
  level: 'root' | 'admin' | 'regular' | 'audit';
  company_access: 'all' | 'own' | 'none';
}

interface FormData {
  // 회사 기본 정보
  companyName: string;
  businessNumber: string; // coi
  representativeName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  website: string;
  
  // 회사 세무/법인 정보
  pan: string;
  iec: string;
  msme: string;
  
  // 은행 정보
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  
  // GST 정보 (복수 가능)
  gstData: CompanyGstData[];
  
  // 파트너 정보
  partnerType: 'supplier' | 'customer' | 'both' | '';
  productCategory: string;
  
  // 로그인 기간 설정
  loginPeriodStart: string;
  loginPeriodEnd: string;
  
  // 관리자 계정
  adminUserId: string;
  adminUsername: string;
  adminPassword: string;
  confirmPassword: string;
  defaultLanguage: string;
  
  // 메뉴 구성
  menus: Menu[];
  
  // 역할 및 권한 설정
  roles: RoleData[];
  permissions: PermissionData[];
  menuPermissions: { menu_id: number; role: string }[];
}

const InitPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    '회사 기본 정보', 
    '회사 세무/법인 정보', 
    '은행 정보', 
    'GST 정보', 
    '파트너 정보', 
    '관리자 계정', 
    '메뉴 구성', 
    '역할 및 권한'
  ];
  
  const [formData, setFormData] = useState<FormData>({
    // 회사 기본 정보
    companyName: '',
    businessNumber: '',
    representativeName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    website: '',
    
    // 회사 세무/법인 정보
    pan: '',
    iec: '',
    msme: '',
    
    // 은행 정보
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    
    // GST 정보
    gstData: [{ gst_number: '', address: '', is_primary: true }],
    
    // 파트너 정보
    partnerType: '',
    productCategory: '',
    
    // 로그인 기간 설정
    loginPeriodStart: '',
    loginPeriodEnd: '',
    
    // 관리자 계정
    adminUserId: '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: '',
    defaultLanguage: 'ko',
    
    // 메뉴 구성
    menus: [
      { id: 1, name: '대시보드', icon: 'dashboard', order: 1, parent_id: null },
      { id: 2, name: '사용자 관리', icon: 'people', order: 2, parent_id: null },
      { id: 3, name: '회사 관리', icon: 'business', order: 3, parent_id: null },
      { id: 4, name: '파트너 관리', icon: 'handshake', order: 4, parent_id: null },
      { id: 5, name: '인보이스 관리', icon: 'receipt', order: 5, parent_id: null },
      { id: 6, name: '회계 통계', icon: 'analytics', order: 6, parent_id: null },
      { id: 7, name: '승인 관리', icon: 'approval', order: 7, parent_id: null },
      { id: 8, name: '메뉴 권한 관리', icon: 'security', order: 8, parent_id: null },
      { id: 9, name: '역할 관리', icon: 'admin_panel_settings', order: 9, parent_id: null },
      { id: 10, name: '권한 관리', icon: 'key', order: 10, parent_id: null },
    ],
    
    // 역할 및 권한 설정
    roles: [
      {
        name: '관리자',
        name_en: 'Administrator',
        description: '시스템 전체 관리 권한',
        description_en: 'Full system administration privileges',
        level: 'admin',
        company_access: 'own'
      },
      {
        name: '일반 사용자',
        name_en: 'Regular User',
        description: '기본 사용자 권한',
        description_en: 'Basic user privileges',
        level: 'regular',
        company_access: 'own'
      }
    ],
    permissions: [
      {
        name: '사용자 관리',
        description: '사용자 생성, 수정, 삭제 권한',
        level: 'admin',
        company_access: 'own'
      },
      {
        name: '회사 정보 관리',
        description: '회사 정보 수정 권한',
        level: 'admin',
        company_access: 'own'
      },
      {
        name: '메뉴 관리',
        description: '메뉴 및 권한 관리',
        level: 'admin',
        company_access: 'own'
      }
    ],
    
    // 메뉴 권한
    menuPermissions: [],
  });

  const [nextMenuId, setNextMenuId] = useState(11);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // GST 데이터 핸들러
  const handleGstChange = (index: number, field: string, value: any) => {
    const newGstData = [...formData.gstData];
    newGstData[index] = { ...newGstData[index], [field]: value };
    setFormData({ ...formData, gstData: newGstData });
  };

  const addGstEntry = () => {
    setFormData({
      ...formData,
      gstData: [...formData.gstData, { gst_number: '', address: '', is_primary: false }]
    });
  };

  const removeGstEntry = (index: number) => {
    if (formData.gstData.length > 1) {
      const newGstData = formData.gstData.filter((_, i) => i !== index);
      setFormData({ ...formData, gstData: newGstData });
    }
  };

  // 역할 데이터 핸들러
  const handleRoleChange = (index: number, field: string, value: any) => {
    const newRoles = [...formData.roles];
    newRoles[index] = { ...newRoles[index], [field]: value };
    setFormData({ ...formData, roles: newRoles });
  };

  const addRole = () => {
    setFormData({
      ...formData,
      roles: [...formData.roles, {
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        level: 'custom',
        company_access: 'own'
      }]
    });
  };

  const removeRole = (index: number) => {
    if (formData.roles.length > 1) {
      const newRoles = formData.roles.filter((_, i) => i !== index);
      setFormData({ ...formData, roles: newRoles });
    }
  };

  // 권한 데이터 핸들러
  const handlePermissionChange = (index: number, field: string, value: any) => {
    const newPermissions = [...formData.permissions];
    newPermissions[index] = { ...newPermissions[index], [field]: value };
    setFormData({ ...formData, permissions: newPermissions });
  };

  const addPermission = () => {
    setFormData({
      ...formData,
      permissions: [...formData.permissions, {
        name: '',
        description: '',
        level: 'regular',
        company_access: 'own'
      }]
    });
  };

  const removePermission = (index: number) => {
    if (formData.permissions.length > 1) {
      const newPermissions = formData.permissions.filter((_, i) => i !== index);
      setFormData({ ...formData, permissions: newPermissions });
    }
  };

  const handleMenuChange = (id: number, field: string, value: any) => {
    const newMenus = formData.menus.map(menu => 
      menu.id === id ? { ...menu, [field]: value } : menu
    );
    setFormData({ ...formData, menus: newMenus });
  };

  const addMenu = (parentId: number | null = null) => {
    const newMenu = {
      id: nextMenuId,
      name: '',
      icon: '',
      order: formData.menus.filter(m => m.parent_id === parentId).length + 1,
      parent_id: parentId
    };
    setNextMenuId(nextMenuId + 1);
    setFormData({
      ...formData,
      menus: [...formData.menus, newMenu]
    });
  };

  const removeMenu = (id: number) => {
    // 메뉴와 그 하위 메뉴들을 모두 삭제
    const removeMenuAndChildren = (menuId: number) => {
      const children = formData.menus.filter(m => m.parent_id === menuId);
      children.forEach(child => removeMenuAndChildren(child.id));
      return formData.menus.filter(m => m.id !== menuId);
    };
    
    setFormData({
      ...formData,
      menus: removeMenuAndChildren(id)
    });
  };

  const getChildMenus = (parentId: number | null) => {
    return formData.menus.filter(menu => menu.parent_id === parentId);
  };

  const renderMenuItems = (parentId: number | null = null, level: number = 0) => {
    const childMenus = getChildMenus(parentId);
    return childMenus.map((menu) => (
      <React.Fragment key={menu.id}>
        <ListItem sx={{ pl: level * 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <StyledTextField
                fullWidth
                label="메뉴명"
                value={menu.name}
                onChange={(e) => handleMenuChange(menu.id, 'name', e.target.value)}
              />
            </Grid>
            <Grid item xs={3}>
              <StyledTextField
                fullWidth
                label="아이콘"
                value={menu.icon}
                onChange={(e) => handleMenuChange(menu.id, 'icon', e.target.value)}
              />
            </Grid>
            <Grid item xs={3}>
              <StyledTextField
                fullWidth
                type="number"
                label="순서"
                value={menu.order}
                onChange={(e) => handleMenuChange(menu.id, 'order', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={() => addMenu(menu.id)} 
                  color="primary"
                  size="small"
                  title="하위 메뉴 추가"
                >
                  <AddIcon />
                </IconButton>
                <IconButton 
                  onClick={() => removeMenu(menu.id)} 
                  color="error"
                  size="small"
                  title="메뉴 삭제"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </ListItem>
        {renderMenuItems(menu.id, level + 1)}
      </React.Fragment>
    ));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!formData.adminUserId.trim()) {
      setError('관리자 아이디를 입력해주세요.');
      return;
    }

    if (!formData.companyName.trim() || !formData.businessNumber.trim()) {
      setError('회사명과 사업자등록번호는 필수입니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 사용자 존재 여부 확인
      const hasUserRes = await axios.get('/api/init/has-user');
      if (hasUserRes.data.hasUser) {
        navigate('/login');
        return;
      }

      // 2. 초기화 진행
      const response = await axios.post('/api/init', {
        company: {
          name: formData.companyName,
          business_number: formData.businessNumber,
          representative_name: formData.representativeName,
          address: formData.companyAddress,
          phone: formData.companyPhone,
          email: formData.companyEmail,
          website: formData.website,
          pan: formData.pan,
          iec: formData.iec,
          msme: formData.msme,
          bank_name: formData.bankName,
          account_holder: formData.accountHolder,
          account_number: formData.accountNumber,
          ifsc_code: formData.ifscCode,
          partner_type: formData.partnerType || null,
          product_category: formData.productCategory,
          login_period_start: formData.loginPeriodStart || null,
          login_period_end: formData.loginPeriodEnd || null,
        },
        admin: {
          userid: formData.adminUserId,
          username: formData.adminUsername,
          password: formData.adminPassword,
          default_language: formData.defaultLanguage,
        },
        gstData: formData.gstData.filter(gst => gst.gst_number.trim()),
        menus: formData.menus,
        roles: formData.roles,
        permissions: formData.permissions,
      });

      if (response.data.success) {
        navigate('/login');
      }
    } catch (err) {
      setError('초기화 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // 회사 기본 정보
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              회사 기본 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <StyledTextField
                  required
                  fullWidth
                  label="회사명"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="사업자등록번호 (COI)"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="대표자명"
                  name="representativeName"
                  value={formData.representativeName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  required
                  fullWidth
                  label="회사 주소"
                  name="companyAddress"
                  multiline
                  rows={2}
                  value={formData.companyAddress}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="회사 전화번호"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="회사 이메일"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="웹사이트"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // 회사 세무/법인 정보
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              회사 세무/법인 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="PAN 번호"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="AAACF1234H"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="IEC 번호"
                  name="iec"
                  value={formData.iec}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="MSME 등록번호"
                  name="msme"
                  value={formData.msme}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2: // 은행 정보
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              은행 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="은행명"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="예금주명"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="계좌번호"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="IFSC 코드"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3: // GST 정보
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              GST 정보
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              여러 GST 번호를 등록할 수 있습니다. 하나는 주요 GST로 설정해주세요.
            </Typography>
            {formData.gstData.map((gst, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <StyledTextField
                        fullWidth
                        label="GST 번호"
                        value={gst.gst_number}
                        onChange={(e) => handleGstChange(index, 'gst_number', e.target.value)}
                        placeholder="07AAAAAAAAB1Z5"
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <StyledTextField
                        fullWidth
                        label="GST 주소"
                        value={gst.address}
                        onChange={(e) => handleGstChange(index, 'address', e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={gst.is_primary}
                            onChange={(e) => {
                              // 주요 GST는 하나만 선택 가능
                              const newGstData = formData.gstData.map((item, i) => ({
                                ...item,
                                is_primary: i === index ? e.target.checked : false
                              }));
                              setFormData({ ...formData, gstData: newGstData });
                            }}
                          />
                        }
                        label="주요 GST"
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        onClick={() => removeGstEntry(index)}
                        color="error"
                        disabled={formData.gstData.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addGstEntry}
              variant="outlined"
              sx={{ mt: 1 }}
            >
              GST 정보 추가
            </Button>
          </Box>
        );

      case 4: // 파트너 정보
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              파트너 정보 설정
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
                <StyledTextField
                  fullWidth
                  label="제품 카테고리"
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleChange}
                  placeholder="전자제품, 의류, 식품 등"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="로그인 기간 시작"
                  name="loginPeriodStart"
                  type="date"
                  value={formData.loginPeriodStart}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="로그인 기간 종료"
                  name="loginPeriodEnd"
                  type="date"
                  value={formData.loginPeriodEnd}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              로그인 기간을 설정하면 해당 기간에만 시스템에 접근할 수 있습니다.
            </Typography>
          </Box>
        );

      case 5: // 관리자 계정
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              관리자 계정 설정
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="관리자 ID"
                  name="adminUserId"
                  value={formData.adminUserId}
                  onChange={handleChange}
                  placeholder="admin_user_01"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="관리자 이름"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="비밀번호"
                  name="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="비밀번호 확인"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
        );

      case 6: // 메뉴 구성
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              메뉴 구성
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              시스템에서 사용할 메뉴를 구성합니다. 기본 메뉴가 미리 설정되어 있습니다.
            </Typography>
            <List>
              {renderMenuItems()}
            </List>
            <Button
              startIcon={<AddIcon />}
              onClick={() => addMenu()}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              최상위 메뉴 추가
            </Button>
          </Box>
        );

      case 7: // 역할 및 권한
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              역할 및 권한 설정
            </Typography>
            
            {/* 역할 설정 */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="역할 설정" />
              <CardContent>
                {formData.roles.map((role, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label="역할명 (한국어)"
                            value={role.name}
                            onChange={(e) => handleRoleChange(index, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label="역할명 (영어)"
                            value={role.name_en}
                            onChange={(e) => handleRoleChange(index, 'name_en', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <StyledTextField
                            fullWidth
                            label="설명 (한국어)"
                            value={role.description}
                            onChange={(e) => handleRoleChange(index, 'description', e.target.value)}
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <StyledTextField
                            fullWidth
                            label="설명 (영어)"
                            value={role.description_en}
                            onChange={(e) => handleRoleChange(index, 'description_en', e.target.value)}
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>권한 레벨</InputLabel>
                            <Select
                              value={role.level}
                              label="권한 레벨"
                              onChange={(e) => handleRoleChange(index, 'level', e.target.value)}
                            >
                              <MenuItem value="root">Root</MenuItem>
                              <MenuItem value="admin">Admin</MenuItem>
                              <MenuItem value="regular">Regular</MenuItem>
                              <MenuItem value="audit">Audit</MenuItem>
                              <MenuItem value="custom">Custom</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>회사 접근 권한</InputLabel>
                            <Select
                              value={role.company_access}
                              label="회사 접근 권한"
                              onChange={(e) => handleRoleChange(index, 'company_access', e.target.value)}
                            >
                              <MenuItem value="all">모든 회사</MenuItem>
                              <MenuItem value="own">자신의 회사만</MenuItem>
                              <MenuItem value="none">접근 불가</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton
                              onClick={() => removeRole(index)}
                              color="error"
                              disabled={formData.roles.length === 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addRole}
                  variant="outlined"
                  size="small"
                >
                  역할 추가
                </Button>
              </CardContent>
            </Card>

            {/* 권한 설정 */}
            <Card>
              <CardHeader title="권한 설정" />
              <CardContent>
                {formData.permissions.map((permission, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label="권한명"
                            value={permission.name}
                            onChange={(e) => handlePermissionChange(index, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>권한 레벨</InputLabel>
                            <Select
                              value={permission.level}
                              label="권한 레벨"
                              onChange={(e) => handlePermissionChange(index, 'level', e.target.value)}
                            >
                              <MenuItem value="root">Root</MenuItem>
                              <MenuItem value="admin">Admin</MenuItem>
                              <MenuItem value="regular">Regular</MenuItem>
                              <MenuItem value="audit">Audit</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <StyledTextField
                            fullWidth
                            label="권한 설명"
                            value={permission.description}
                            onChange={(e) => handlePermissionChange(index, 'description', e.target.value)}
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>회사 접근 권한</InputLabel>
                            <Select
                              value={permission.company_access}
                              label="회사 접근 권한"
                              onChange={(e) => handlePermissionChange(index, 'company_access', e.target.value)}
                            >
                              <MenuItem value="all">모든 회사</MenuItem>
                              <MenuItem value="own">자신의 회사만</MenuItem>
                              <MenuItem value="none">접근 불가</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton
                              onClick={() => removePermission(index)}
                              color="error"
                              disabled={formData.permissions.length === 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addPermission}
                  variant="outlined"
                  size="small"
                >
                  권한 추가
                </Button>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <Container component="main" maxWidth="sm">
        <StyledPaper elevation={0}>
          <Typography component="h1" variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            MVS 2.0 시스템 초기화
          </Typography>
          <Typography variant="caption" color="textSecondary" gutterBottom>
            시스템을 사용하기 위한 초기 설정을 진행합니다.
          </Typography>

          <StyledForm onSubmit={handleSubmit}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {renderStepContent(activeStep)}

            {error && (
              <Alert severity="error" sx={{ mt: 2, fontSize: '0.75rem' }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                이전
              </Button>
              <Button
                variant="contained"
                onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              >
                {activeStep === steps.length - 1 ? '초기화' : '다음'}
              </Button>
            </Box>
          </StyledForm>
        </StyledPaper>
      </Container>
      <StyledFooter>
        <Typography variant="caption">
          powered by Minsub Ventures Private Limited
        </Typography>
      </StyledFooter>
    </PageContainer>
  );
};

export default InitPage; 