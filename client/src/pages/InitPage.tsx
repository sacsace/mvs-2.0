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

interface FormData {
  companyName: string;
  businessNumber: string;
  representativeName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  username: string;
  password: string;
  confirmPassword: string;
  menus: Menu[];
  menuPermissions: { menu_id: number; role: string }[];
}

const InitPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [t('companyInfo'), t('adminAccount'), t('menuStructure'), t('menuPermissions')];
  const [formData, setFormData] = useState<FormData>({
    // 회사 정보
    companyName: '',
    businessNumber: '',
    representativeName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    
    // 관리자 계정
    username: '',
    password: '',
    confirmPassword: '',
    
    // 메뉴 구성
    menus: [
      { id: 1, name: '대시보드', icon: 'dashboard', order: 1, parent_id: null },
      { id: 2, name: '사용자 관리', icon: 'people', order: 2, parent_id: null },
      { id: 3, name: '메뉴 권한 관리', icon: 'security', order: 3, parent_id: null },
    ],
    
    // 메뉴 권한
    menuPermissions: [],
  });

  const [nextMenuId, setNextMenuId] = useState(4);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
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
        },
        admin: {
          username: formData.username,
          password: formData.password,
        },
        menus: formData.menus,
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
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              회사 정보
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
              <Grid item xs={12}>
                <StyledTextField
                  required
                  fullWidth
                  label="사업자등록번호"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
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
                  value={formData.companyAddress}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="회사 전화번호"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  required
                  fullWidth
                  label="회사 이메일"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              관리자 계정
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <StyledTextField
                  required
                  fullWidth
                  label="관리자 아이디"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  required
                  fullWidth
                  label="비밀번호"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
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
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              메뉴 구성
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

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              메뉴 권한
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              각 메뉴별로 권한을 설정합니다. root는 모든 메뉴에 접근 가능하며, admin은 root로부터 받은 메뉴 권한을 user에게 부여할 수 있습니다.
            </Typography>
            {formData.menus.map((menu, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {menu.name}
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={formData.menuPermissions.find(p => p.menu_id === index)?.role || 'user'}
                    onChange={(e) => {
                      const newPermissions = [...formData.menuPermissions];
                      const existingIndex = newPermissions.findIndex(p => p.menu_id === index);
                      if (existingIndex >= 0) {
                        newPermissions[existingIndex].role = e.target.value;
                      } else {
                        newPermissions.push({ menu_id: index, role: e.target.value });
                      }
                      setFormData({ ...formData, menuPermissions: newPermissions });
                    }}
                  >
                    <FormControlLabel value="root" control={<Radio />} label="Root" />
                    <FormControlLabel value="admin" control={<Radio />} label="Admin" />
                    <FormControlLabel value="user" control={<Radio />} label="User" />
                  </RadioGroup>
                </FormControl>
              </Paper>
            ))}
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