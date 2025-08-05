import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardMedia
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Upload as UploadIcon,
  RemoveCircle as RemoveCircleIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';


// 유틸리티 함수들
const removeSpaces = (value: string): string => {
  return value.replace(/\s/g, '');
};

const formatAccountNumber = (value: string): string => {
  const cleanValue = removeSpaces(value);
  return cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// GST 중복 확인 함수
const hasGstDuplicates = (gstNumbers: string[]): boolean => {
  const nonEmptyGst = gstNumbers.filter(gst => gst.trim());
  return nonEmptyGst.length !== new Set(nonEmptyGst).size;
};

interface Company {
  company_id: number;
  name: string;
  coi: string;
  address: string;
  pan?: string;
  gst1?: string;
  gst2?: string;
  gst3?: string;
  gst4?: string;
  iec?: string;
  msme?: string;
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  ifsc_code?: string;
  website?: string;
  email?: string;
  phone?: string;
  signature_url?: string;
  stamp_url?: string;
  partner_type?: 'supplier' | 'customer' | 'both' | '';
  login_period_start?: string;
  login_period_end?: string;
  create_date: string;
  update_date?: string;
  user_count?: number;
}

const CompanyPage: React.FC = () => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    coi: '',
    address: '',
    pan: '',
    gst1: '',
    gst2: '',
    gst3: '',
    gst4: '',
    gstNumbers: [''] as string[],
    iec: '',
    msme: '',
    bank_name: '',
    account_holder: '',
    account_number: '',
    ifsc_code: '',
    website: '',
    email: '',
    phone: '',
    signature_url: '',
    stamp_url: '',
    partner_type: '' as 'supplier' | 'customer' | 'both' | '',
    login_period_start: '',
    login_period_end: ''
  });

  // 서명 이미지 업로드 핸들러
  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      setUploadingSignature(true);
      setError(null);

      const formData = new FormData();
      formData.append('signature', file);
      formData.append('company_id', selectedCompany?.company_id.toString() || '');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies/upload-signature', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, signature_url: data.signature_url }));
        setSignaturePreview(URL.createObjectURL(file));
        setSuccess('서명 이미지가 업로드되었습니다.');
        
        // 회사 목록 새로고침
        fetchCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.message || '서명 이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('서명 이미지 업로드 오류:', error);
      setError('서명 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingSignature(false);
    }
  };

  // 서명 이미지 삭제 핸들러
  const handleRemoveSignature = async () => {
    try {
      console.log('=== 서명 이미지 삭제 시작 ===');
      console.log('선택된 회사 ID:', selectedCompany?.company_id);
      
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('토큰 존재 여부:', !!token);
      
      const url = `/api/companies/${selectedCompany?.company_id}/remove-signature`;
      console.log('요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('응답 상태:', response.status, response.statusText);
      console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        console.log('서명 삭제 성공');
        setFormData(prev => ({ ...prev, signature_url: '' }));
        setSignaturePreview(null);
        setSuccess('서명 이미지가 삭제되었습니다.');
        
        // 회사 목록 새로고침
        fetchCompanies();
      } else {
        console.log('서명 삭제 실패 - 상태 코드:', response.status);
        const errorData = await response.json();
        console.log('오류 데이터:', errorData);
        setError(errorData.message || '서명 이미지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('서명 이미지 삭제 오류:', error);
      setError('서명 이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 도장 이미지 업로드 핸들러
  const handleStampUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      setUploadingStamp(true);
      setError(null);

      const formData = new FormData();
      formData.append('stamp', file);
      formData.append('company_id', selectedCompany?.company_id.toString() || '');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies/upload-stamp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, stamp_url: data.stamp_url }));
        setStampPreview(URL.createObjectURL(file));
        setSuccess('도장 이미지가 업로드되었습니다.');
        
        // 회사 목록 새로고침
        fetchCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.message || '도장 이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('도장 이미지 업로드 오류:', error);
      setError('도장 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingStamp(false);
    }
  };

  // 도장 이미지 삭제 핸들러
  const handleRemoveStamp = async () => {
    try {
      console.log('=== 도장 이미지 삭제 시작 ===');
      console.log('선택된 회사 ID:', selectedCompany?.company_id);
      
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('토큰 존재 여부:', !!token);
      
      const url = `/api/companies/${selectedCompany?.company_id}/remove-stamp`;
      console.log('요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('응답 상태:', response.status, response.statusText);
      console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        console.log('도장 삭제 성공');
        setFormData(prev => ({ ...prev, stamp_url: '' }));
        setStampPreview(null);
        setSuccess('도장 이미지가 삭제되었습니다.');
        
        // 회사 목록 새로고침
        fetchCompanies();
      } else {
        console.log('도장 삭제 실패 - 상태 코드:', response.status);
        const errorData = await response.json();
        console.log('오류 데이터:', errorData);
        setError(errorData.message || '도장 이미지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('도장 이미지 삭제 오류:', error);
      setError('도장 이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 회사 목록 조회
  const fetchCompanies = useCallback(async (searchTerm?: string) => {
    try {
      console.log('=== 회사 목록 조회 시작 ===');
      console.log('현재 사용자 정보:', currentUser);
      console.log('검색어:', searchTerm);
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('토큰 존재 여부:', !!token);
      
      // 검색 파라미터 추가
      const url = searchTerm && searchTerm.trim() 
        ? `/api/companies?search=${encodeURIComponent(searchTerm.trim())}`
        : '/api/companies';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API 응답 상태:', response.status, response.statusText);
      console.log('요청 URL:', url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('받은 회사 데이터:', data);
        console.log('회사 개수:', data.length);
        
        // MVS 고객회사만 필터링 (partner_type이 null, 빈 문자열, 'customer', 'both'인 경우)
        let filteredCompanies = data.filter((company: Company) => {
          const partnerType = company.partner_type;
          return !partnerType || 
                 partnerType === 'customer' || 
                 partnerType === 'both' ||
                 (partnerType as string) === '';
        });
        
        console.log('MVS 고객회사 필터링 후:', filteredCompanies.length, '개');
        
        // 권한에 따라 회사 필터링
        if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
          console.log('root/audit이 아님 - 회사 ID 필터링 적용');
          // root와 audit이 아닌 경우 등록된 회사만 표시
          filteredCompanies = filteredCompanies.filter((company: Company) => company.company_id === currentUser?.company_id);
          console.log('회사 ID 필터링 후:', filteredCompanies.length, '개');
          // 단일 회사 정보로 설정
          if (filteredCompanies.length > 0) {
            setCurrentCompany(filteredCompanies[0]);
          }
        } else {
          console.log('root/audit 사용자 - 모든 회사 표시');
        }
        
        console.log('최종 필터링된 회사 데이터:', filteredCompanies);
        console.log('현재 사용자 역할:', currentUser?.role);
        console.log('현재 사용자 회사 ID:', currentUser?.company_id);
        console.log('조건 확인:', currentUser?.role === 'root' || currentUser?.role === 'audit');
        setCompanies(filteredCompanies);
        setFilteredCompanies(filteredCompanies);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 오류 응답:', errorData);
        setError(`회사 목록을 불러오는데 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('회사 목록 조회 오류:', error);
      setError('회사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      console.log('=== 회사 목록 조회 완료 ===');
    }
  }, [currentUser]);

  // 검색 함수
  const handleSearch = useCallback((searchValue: string) => {
    console.log('=== 검색 함수 호출 ===');
    console.log('검색어:', searchValue);
    
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      console.log('검색어가 비어있음 - 전체 회사 표시');
      // 검색어가 비어있으면 전체 회사 목록 다시 로드
      fetchCompanies();
      return;
    }

    console.log('서버 검색 실행:', searchValue);
    // 서버에서 검색 실행
    fetchCompanies(searchValue);
  }, [fetchCompanies]);

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
  }, [debouncedSearchTerm]);

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
    console.log('User role:', userData.role);
    console.log('User company_id:', userData.company_id);
    setCurrentUser(userData);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCompanies();
    }
  }, [currentUser]);

  // 회사 추가 다이얼로그 열기
  const handleAddCompany = () => {
    setFormData({
      name: '',
      coi: '',
      address: '',
      pan: '',
      gst1: '',
      gst2: '',
      gst3: '',
      gst4: '',
      gstNumbers: [''],
      iec: '',
      msme: '',
      bank_name: '',
      account_holder: '',
      account_number: '',
      ifsc_code: '',
      website: '',
      email: '',
      phone: '',
      signature_url: '',
      stamp_url: '',
      partner_type: '',
      login_period_start: '',
      login_period_end: ''
    });
    setIsEditing(false);
    setSelectedCompany(null);
    setDialogOpen(true);
  };

  // 회사 정보 보기 다이얼로그 열기
  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setViewDialogOpen(true);
  };

  // 회사 수정 다이얼로그 열기
  const handleEditCompany = (company: Company) => {
    setFormData({
      name: company.name,
      coi: company.coi,
      address: company.address,
      pan: company.pan || '',
      gst1: company.gst1 || '',
      gst2: company.gst2 || '',
      gst3: company.gst3 || '',
      gst4: company.gst4 || '',
      iec: company.iec || '',
      msme: company.msme || '',
      bank_name: company.bank_name || '',
      account_holder: company.account_holder || '',
      account_number: company.account_number || '',
      ifsc_code: company.ifsc_code || '',
      website: company.website || '',
      email: company.email || '',
      phone: company.phone || '',
      signature_url: company.signature_url || '',
      stamp_url: company.stamp_url || '',
      partner_type: company.partner_type || '',
      login_period_start: company.login_period_start || '',
      login_period_end: company.login_period_end || '',
      gstNumbers: [company.gst1 || '', company.gst2 || '', company.gst3 || '', company.gst4 || ''].filter(Boolean)
    });
    setIsEditing(true);
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  // 회사 삭제 다이얼로그 열기
  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  // 회사 저장 (추가/수정)
  const handleSaveCompany = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `/api/companies/${selectedCompany?.company_id}`
        : '/api/companies';
      
      // gstNumbers를 개별 gst 필드로 변환
      const gstNumbers = formData.gstNumbers || [''];
      const { gstNumbers: _, ...requestData } = {
        ...formData,
        gst1: gstNumbers[0] || '',
        gst2: gstNumbers[1] || '',
        gst3: gstNumbers[2] || '',
        gst4: gstNumbers[3] || '',
      };
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setSuccess(isEditing ? '회사 정보가 수정되었습니다.' : '회사가 추가되었습니다.');
        setDialogOpen(false);
        fetchCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('회사 저장 오류:', error);
      setError('저장 중 오류가 발생했습니다.');
    }
  };

  // 회사 삭제 확인
  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${companyToDelete.company_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('회사가 삭제되었습니다.');
        setDeleteDialogOpen(false);
        setCompanyToDelete(null);
        fetchCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('회사 삭제 오류:', error);
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ fontSize: 20, color: '#1976d2' }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {t('companyManagement')}
          </Typography>
        </Box>
        {/* root와 audit만 회사 추가 가능 */}
        {(currentUser?.role === 'root' || currentUser?.role === 'audit') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCompany}
            sx={{ bgcolor: '#1976d2', fontSize: '0.75rem' }}
          >
            {t('companyAdd')}
          </Button>
        )}
      </Box>

      {/* 에러 및 성공 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 검색 필드 */}
      {(currentUser?.role === 'root' || currentUser?.role === 'audit') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
              <SearchIcon sx={{ position: 'absolute', left: 12, color: '#666', fontSize: 20 }} />
              <TextField
                size="small"
                fullWidth
                placeholder={t('searchPlaceholder')}
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
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )
                }}
              />
            </Box>
            {debouncedSearchTerm && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {filteredCompanies.length} {t('searchResults')}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* 회사 정보 표시 */}
      {currentUser?.role === 'root' || currentUser?.role === 'audit' ? (
        // root와 audit은 회사 목록 표시
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{t('companyName')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{t('companyType')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>로그인 종료일</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>사용자 수</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{t('management')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {debouncedSearchTerm ? t('noSearchResults') : t('noCompanies')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow 
                      key={company.company_id} 
                      hover 
                      onClick={() => handleViewCompany(company)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {company.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            company.company_id === currentUser?.company_id ? 
                            (currentUser?.role === 'root' ? t('myCompanyRoot') : t('myCompany')) :
                            !company.partner_type ? t('mvsCustomer') :
                            company.partner_type === 'supplier' ? t('supplier') :
                            company.partner_type === 'customer' ? t('customer') :
                            company.partner_type === 'both' ? t('supplierAndCustomer') : '-'
                          }
                          size="small" 
                          variant="outlined"
                          color={
                            company.company_id === currentUser?.company_id ? 'secondary' :
                            !company.partner_type ? 'primary' :
                            company.partner_type === 'supplier' ? 'warning' :
                            company.partner_type === 'customer' ? 'success' :
                            company.partner_type === 'both' ? 'info' : 'default'
                          }
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: company.company_id === currentUser?.company_id ? 600 : 400
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {company.login_period_end ? 
                            new Date(company.login_period_end).toLocaleDateString('ko-KR') : 
                            '설정되지 않음'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {company.user_count || 0}명
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={t('edit')}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCompany(company);
                              }}
                              sx={{ color: '#1976d2' }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          {/* root와 audit만 삭제 가능 */}
                          {(currentUser?.role === 'root' || currentUser?.role === 'audit') && (
                            <Tooltip title={t('delete')}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCompany(company);
                                }}
                                sx={{ color: '#d32f2f' }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        // admin과 regular는 단일 회사 정보 표시
        currentCompany && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {currentCompany.name}
              </Typography>
              {/* admin만 수정 가능 */}
              {currentUser?.role === 'admin' && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditCompany(currentCompany)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {t('edit')}
                </Button>
              )}
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    COI
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.coi}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    {t('address')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.address || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    웹사이트
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.website || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    대표 이메일
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.email || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    대표 전화번호
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.phone || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    {t('pan')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.pan || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    GST
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {[currentCompany.gst1, currentCompany.gst2, currentCompany.gst3, currentCompany.gst4]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    IEC
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.iec || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    MSME
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.msme || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    {t('bankName')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.bank_name || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    {t('accountHolder')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.account_holder || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    {t('accountNumber')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.account_number ? formatAccountNumber(currentCompany.account_number) : '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                    IFSC Code
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {currentCompany.ifsc_code || '-'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* 이미지 섹션 */}
            {(currentCompany.signature_url || currentCompany.stamp_url) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 2 }}>
                  이미지
                </Typography>
                <Grid container spacing={2}>
                  {currentCompany.signature_url && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                        대표자 서명
                      </Typography>
                      <Card sx={{ maxWidth: 200 }}>
                        <CardMedia
                          component="img"
                          image={currentCompany.signature_url}
                          alt="대표자 서명"
                          sx={{ height: 100, objectFit: 'contain' }}
                        />
                      </Card>
                    </Grid>
                  )}
                  {currentCompany.stamp_url && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                        회사 도장
                      </Typography>
                      <Card sx={{ maxWidth: 200 }}>
                        <CardMedia
                          component="img"
                          image={currentCompany.stamp_url}
                          alt="회사 도장"
                          sx={{ height: 100, objectFit: 'contain' }}
                        />
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Paper>
        )
      )}

      {/* 회사 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.875rem' }}>
          {isEditing ? t('companyEdit') : t('companyAdd')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('companyName')}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
              required
            />
            <TextField
              fullWidth
              label="COI"
              value={formData.coi}
              onChange={(e) => setFormData(prev => ({ ...prev, coi: removeSpaces(e.target.value) }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
              required
            />
            <TextField
              fullWidth
              label={t('address')}
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              multiline
              rows={2}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('pan')}
              value={formData.pan}
              onChange={(e) => setFormData(prev => ({ ...prev, pan: removeSpaces(e.target.value) }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            {/* GST 번호 입력 (동적 추가/삭제) */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1, color: '#1976d2' }}>
                GST 번호
              </Typography>
              {formData.gstNumbers?.map((gst, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                     <TextField
                     fullWidth
                     label={`GST ${index + 1}`}
                     value={gst}
                     onChange={(e) => {
                       const newValue = removeSpaces(e.target.value);
                       const newGstNumbers = [...(formData.gstNumbers || [])];
                       newGstNumbers[index] = newValue;
                       
                       // 중복 확인
                       const duplicates = newGstNumbers.filter((gst, i) => 
                         gst && i !== index && newGstNumbers.indexOf(gst) !== i
                       );
                       
                       if (duplicates.length > 0) {
                         setError(`GST 번호 "${newValue}"가 중복됩니다.`);
                       } else {
                         setError(null);
                       }
                       
                       setFormData(prev => ({ ...prev, gstNumbers: newGstNumbers }));
                     }}
                     error={formData.gstNumbers && formData.gstNumbers.some((gst, i) => 
                       gst && i !== index && formData.gstNumbers!.indexOf(gst) !== i
                     )}
                     helperText={formData.gstNumbers && formData.gstNumbers.some((gst, i) => 
                       gst && i !== index && formData.gstNumbers!.indexOf(gst) !== i
                     ) ? '중복된 GST 번호입니다.' : ''}
                     sx={{ 
                       '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                       '& .MuiInputBase-input': { fontSize: '0.75rem' },
                       '& .MuiFormHelperText-root': { fontSize: '0.65rem' }
                     }}
                   />
                  {index > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newGstNumbers = formData.gstNumbers?.filter((_, i) => i !== index) || [];
                        setFormData(prev => ({ ...prev, gstNumbers: newGstNumbers }));
                      }}
                      sx={{ color: '#d32f2f' }}
                    >
                      <RemoveCircleIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
              {(!formData.gstNumbers || formData.gstNumbers.length < 4) && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newGstNumbers = [...(formData.gstNumbers || ['']), ''];
                    setFormData(prev => ({ ...prev, gstNumbers: newGstNumbers }));
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    mt: 1,
                    '& .MuiButton-startIcon': { mr: 0.5 }
                  }}
                >
                  GST 번호 추가
                </Button>
              )}
            </Box>
            <TextField
              fullWidth
              label={t('iec')}
              value={formData.iec}
              onChange={(e) => setFormData(prev => ({ ...prev, iec: removeSpaces(e.target.value) }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('msme')}
              value={formData.msme}
              onChange={(e) => setFormData(prev => ({ ...prev, msme: e.target.value }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('bankName')}
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('accountHolder')}
              value={formData.account_holder}
              onChange={(e) => setFormData(prev => ({ ...prev, account_holder: e.target.value }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('accountNumber')}
              value={formatAccountNumber(formData.account_number)}
              onChange={(e) => setFormData(prev => ({ ...prev, account_number: removeSpaces(e.target.value) }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('ifscCode')}
              value={formData.ifsc_code}
              onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: removeSpaces(e.target.value) }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('website')}
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('email')}
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              fullWidth
              label={t('phone')}
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              sx={{ mb: 2, '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            
            {/* 회사 타입 선택 (root/audit만 표시) */}
            {(currentUser?.role === 'root' || currentUser?.role === 'audit') && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>회사 타입</InputLabel>
                <Select
                  value={formData.partner_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner_type: e.target.value as 'supplier' | 'customer' | 'both' | '' }))}
                  label="회사 타입"
                  sx={{ 
                    '& .MuiSelect-select': { fontSize: '0.75rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.75rem' }}>선택하세요</MenuItem>
                  <MenuItem value="supplier" sx={{ fontSize: '0.75rem' }}>공급업체</MenuItem>
                  <MenuItem value="customer" sx={{ fontSize: '0.75rem' }}>고객사</MenuItem>
                  <MenuItem value="both" sx={{ fontSize: '0.75rem' }}>공급업체 + 고객사</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* 로그인 기간 설정 (root만 수정 가능) */}
            {currentUser?.role === 'root' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1, color: '#1976d2' }}>
                  로그인 기간 설정 (Root 전용)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="로그인 시작일"
                      type="date"
                      value={formData.login_period_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, login_period_start: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                        '& .MuiInputBase-input': { fontSize: '0.75rem' } 
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="로그인 종료일"
                      type="date"
                      value={formData.login_period_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, login_period_end: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                        '& .MuiInputBase-input': { fontSize: '0.75rem' } 
                      }}
                    />
                  </Grid>
                </Grid>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#666' }}>
                  설정하지 않으면 로그인 기간 제한이 없습니다.
                </Typography>
              </Box>
            )}
            
            {/* 서명 이미지 업로드 섹션 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                대표자 서명 이미지
              </Typography>
              
              {/* 서명 이미지 미리보기 */}
              {(formData.signature_url || signaturePreview) && (
                <Card sx={{ mb: 2, maxWidth: 200 }}>
                  <CardMedia
                    component="img"
                    image={signaturePreview || formData.signature_url}
                    alt="대표자 서명"
                    sx={{ height: 100, objectFit: 'contain' }}
                  />
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      서명 이미지
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleRemoveSignature}
                      sx={{ color: '#d32f2f' }}
                    >
                      <RemoveCircleIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Card>
              )}
              
              {/* 파일 업로드 버튼 */}
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={uploadingSignature}
                sx={{ 
                  fontSize: '0.75rem',
                  '& .MuiButton-startIcon': { mr: 0.5 }
                }}
              >
                {uploadingSignature ? '업로드 중...' : '서명 이미지 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleSignatureUpload}
                />
              </Button>
              
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#666' }}>
                이미지 파일만 가능 (최대 5MB)
              </Typography>
            </Box>

            {/* 도장 이미지 업로드 섹션 */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                도장 이미지
              </Typography>
              
              {/* 도장 이미지 미리보기 */}
              {(formData.stamp_url || stampPreview) && (
                <Card sx={{ mb: 2, maxWidth: 200 }}>
                  <CardMedia
                    component="img"
                    image={stampPreview || formData.stamp_url}
                    alt="도장"
                    sx={{ height: 100, objectFit: 'contain' }}
                  />
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      도장 이미지
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleRemoveStamp}
                      sx={{ color: '#d32f2f' }}
                    >
                      <RemoveCircleIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Card>
              )}
              
              {/* 파일 업로드 버튼 */}
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={uploadingStamp}
                sx={{ 
                  fontSize: '0.75rem',
                  '& .MuiButton-startIcon': { mr: 0.5 }
                }}
              >
                {uploadingStamp ? '업로드 중...' : '도장 이미지 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleStampUpload}
                />
              </Button>
              
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#666' }}>
                이미지 파일만 가능 (최대 5MB)
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontSize: '0.75rem' }}>{t('cancel')}</Button>
          <Button 
            onClick={handleSaveCompany} 
            variant="contained"
            disabled={
              !formData.name.trim() || 
              !formData.coi.trim() || 
              hasGstDuplicates(formData.gstNumbers || [])
            }
            sx={{ fontSize: '0.75rem' }}
          >
            {isEditing ? t('edit') : t('add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 회사 정보 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '0.875rem' }}>
          {t('companyInfo')} - {selectedCompany?.name}
        </DialogTitle>
        <DialogContent>
          {selectedCompany && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 1, color: '#1976d2' }}>
                    {t('basicInfo')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {t('companyName')}: {selectedCompany.name}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      COI: {selectedCompany.coi}
                    </Typography>
                  </Box>
                  {selectedCompany.address && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {t('address')}: {selectedCompany.address}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.pan && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        PAN: {selectedCompany.pan}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {t('companyType')}: {
                        selectedCompany.company_id === currentUser?.company_id ? 
                        (currentUser?.role === 'root' ? t('myCompanyRoot') : t('myCompany')) :
                        !selectedCompany.partner_type ? t('mvsCustomer') :
                        selectedCompany.partner_type === 'supplier' ? t('supplier') :
                        selectedCompany.partner_type === 'customer' ? t('customer') :
                        selectedCompany.partner_type === 'both' ? t('supplierAndCustomer') : '-'
                      }
                    </Typography>
                  </Box>
                  {selectedCompany.website && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        웹사이트: {selectedCompany.website}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.email && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        대표 이메일: {selectedCompany.email}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.phone && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        대표 전화번호: {selectedCompany.phone}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 1, color: '#1976d2' }}>
                    {t('taxInfo')}
                  </Typography>
                  {selectedCompany.gst1 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        GST1: {selectedCompany.gst1}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.gst2 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        GST2: {selectedCompany.gst2}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.gst3 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        GST3: {selectedCompany.gst3}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.gst4 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        GST4: {selectedCompany.gst4}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.iec && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        IEC: {selectedCompany.iec}
                      </Typography>
                    </Box>
                  )}
                  {selectedCompany.msme && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        MSME: {selectedCompany.msme}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 1, color: '#1976d2' }}>
                    {t('bankInfo')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      {selectedCompany.bank_name && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {t('bankName')}: {selectedCompany.bank_name}
                          </Typography>
                        </Box>
                      )}
                      {selectedCompany.account_holder && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {t('accountHolder')}: {selectedCompany.account_holder}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {selectedCompany.account_number && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {t('accountNumber')}: {formatAccountNumber(selectedCompany.account_number)}
                          </Typography>
                        </Box>
                      )}
                      {selectedCompany.ifsc_code && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {t('ifscCode')}: {selectedCompany.ifsc_code}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 1, color: '#1976d2' }}>
                    {t('systemInfo')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          {t('registrationDate')}: {new Date(selectedCompany.create_date).toLocaleDateString('ko-KR')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {selectedCompany.update_date && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {t('lastUpdate')}: {new Date(selectedCompany.update_date).toLocaleDateString('ko-KR')}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Grid>

                {/* 로그인 기간 정보 */}
                {(selectedCompany.login_period_start || selectedCompany.login_period_end) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 1, color: '#1976d2' }}>
                      로그인 기간
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            로그인 시작일: {selectedCompany.login_period_start ? new Date(selectedCompany.login_period_start).toLocaleDateString('ko-KR') : '설정되지 않음'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            로그인 종료일: {selectedCompany.login_period_end ? new Date(selectedCompany.login_period_end).toLocaleDateString('ko-KR') : '설정되지 않음'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
                
                {/* 서명 이미지 표시 */}
                {selectedCompany.signature_url && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 1, color: '#1976d2' }}>
                      대표자 서명
                    </Typography>
                    <Card sx={{ maxWidth: 300 }}>
                      <CardMedia
                        component="img"
                        image={selectedCompany.signature_url}
                        alt="대표자 서명"
                        sx={{ height: 150, objectFit: 'contain' }}
                      />
                    </Card>
                  </Grid>
                )}
                
                {/* 도장 이미지 표시 */}
                {selectedCompany.stamp_url && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 1, color: '#1976d2' }}>
                      회사 도장
                    </Typography>
                    <Card sx={{ maxWidth: 300 }}>
                      <CardMedia
                        component="img"
                        image={selectedCompany.stamp_url}
                        alt="회사 도장"
                        sx={{ height: 150, objectFit: 'contain' }}
                      />
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} sx={{ fontSize: '0.75rem' }}>
            {t('close')}
          </Button>
          <Button 
            onClick={() => {
              setViewDialogOpen(false);
              handleEditCompany(selectedCompany!);
            }} 
            variant="contained" 
            sx={{ fontSize: '0.75rem' }}
          >
            {t('edit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontSize: '0.875rem' }}>{t('companyDeleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.75rem' }}>
            "{companyToDelete?.name}" {t('companyDeleteMessage')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            {t('companyDeleteWarning')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontSize: '0.75rem' }}>{t('cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ fontSize: '0.75rem' }}>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyPage; 