import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  FormControlLabel,
  Checkbox,
  Chip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Business,
  AccountBalance,
  LocationOn,
  Receipt,
  CheckBox,
  CheckBoxOutlineBlank,
  Search,
  Clear
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useMenuPermission } from '../hooks/useMenuPermission';


// 공백 제거 유틸리티 함수
const removeSpaces = (value: string): string => {
  return value.replace(/\s/g, '');
};

// 계좌번호 포맷팅 함수
const formatAccountNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

interface Partner {
  partner_id: number;
  company_id: number;
  name: string;
  partner_type: 'supplier' | 'customer' | 'both' | '';
  coi?: string;
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
  address?: string;
  website?: string;
  email?: string;
  phone?: string;
  product_category?: string;
  contact_person?: string;
  contact_designation?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_terms?: string;
  credit_limit?: number;
  is_active: boolean;
  is_deleted: boolean;
  create_date: string;
  update_date?: string;
}

const PartnerPage: React.FC = () => {
  const { t } = useLanguage();
  const { permission: partnerMenuPermission, loading: permissionLoading } = useMenuPermission('파트너 업체 관리');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    coi: '',
    address: '',
    pan: '',
    gst1: '',
    gst2: '',
    gst3: '',
    gst4: '',
    iec: '',
    msme: '',
    bank_name: '',
    account_holder: '',
    account_number: '',
    ifsc_code: '',
    partner_type: '' as 'supplier' | 'customer' | 'both' | '',
    product_category: ''
  });

  // 협력 업체 목록 조회
  const fetchPartners = useCallback(async () => {
    try {
      console.log('=== 협력 업체 목록 조회 시작 ===');
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('토큰 존재 여부:', !!token);
      
      const response = await fetch('/api/partners', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API 응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('받은 협력 업체 데이터:', data);
        console.log('협력 업체 개수:', data.length);
        setPartners(data);
        setFilteredPartners(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 오류 응답:', errorData);
        setError(`협력 업체 목록을 불러오는데 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('협력 업체 목록 조회 오류:', error);
      setError('협력 업체 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      console.log('=== 협력 업체 목록 조회 완료 ===');
    }
  }, []);

  // 검색 함수
  const handleSearch = useCallback((searchValue: string) => {
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredPartners(partners);
      return;
    }

    const filtered = partners.filter((partner) => {
      const searchLower = searchValue.toLowerCase();
      return (
        partner.name.toLowerCase().includes(searchLower) ||
        (partner.coi && partner.coi.toLowerCase().includes(searchLower)) ||
        (partner.address && partner.address.toLowerCase().includes(searchLower)) ||
        (partner.pan && partner.pan.toLowerCase().includes(searchLower)) ||
        (partner.gst1 && partner.gst1.toLowerCase().includes(searchLower)) ||
        (partner.gst2 && partner.gst2.toLowerCase().includes(searchLower)) ||
        (partner.gst3 && partner.gst3.toLowerCase().includes(searchLower)) ||
        (partner.gst4 && partner.gst4.toLowerCase().includes(searchLower)) ||
        (partner.iec && partner.iec.toLowerCase().includes(searchLower)) ||
        (partner.msme && partner.msme.toLowerCase().includes(searchLower)) ||
        (partner.bank_name && partner.bank_name.toLowerCase().includes(searchLower)) ||
        (partner.account_holder && partner.account_holder.toLowerCase().includes(searchLower)) ||
        (partner.account_number && partner.account_number.toLowerCase().includes(searchLower)) ||
        (partner.ifsc_code && partner.ifsc_code.toLowerCase().includes(searchLower)) ||
        (partner.product_category && partner.product_category.toLowerCase().includes(searchLower))
      );
    });
    
    setFilteredPartners(filtered);
  }, [partners]);

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
  }, [debouncedSearchTerm, partners, handleSearch]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // 파트너사 추가 다이얼로그 열기
  const handleAddPartner = () => {
    setFormData({
      name: '',
      coi: '',
      address: '',
      pan: '',
      gst1: '',
      gst2: '',
      gst3: '',
      gst4: '',
      iec: '',
      msme: '',
      bank_name: '',
      account_holder: '',
      account_number: '',
      ifsc_code: '',
      partner_type: '',
      product_category: ''
    });
    setIsEditing(false);
    setSelectedPartner(null);
    setDialogOpen(true);
  };

  // 파트너사 정보 보기 다이얼로그 열기
  const handleViewPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setViewDialogOpen(true);
  };

  // 파트너사 수정 다이얼로그 열기
  const handleEditPartner = (partner: Partner) => {
    setFormData({
      name: partner.name,
      coi: partner.coi || '',
      address: partner.address || '',
      pan: partner.pan || '',
      gst1: partner.gst1 || '',
      gst2: partner.gst2 || '',
      gst3: partner.gst3 || '',
      gst4: partner.gst4 || '',
      iec: partner.iec || '',
      msme: partner.msme || '',
      bank_name: partner.bank_name || '',
      account_holder: partner.account_holder || '',
      account_number: partner.account_number || '',
      ifsc_code: partner.ifsc_code || '',
      partner_type: partner.partner_type,
      product_category: partner.product_category || ''
    });
    setIsEditing(true);
    setSelectedPartner(partner);
    setDialogOpen(true);
  };

  // 파트너사 삭제
  const handleDeletePartner = (partner: Partner) => {
    if (window.confirm(`"${partner.name}" 파트너사를 삭제하시겠습니까?`)) {
      deletePartner(partner.partner_id);
    }
  };

  const deletePartner = async (partnerId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPartners();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '파트너사 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('파트너사 삭제 오류:', error);
      setError('파트너사 삭제 중 오류가 발생했습니다.');
    }
  };

  // 협력 업체 저장
  const handleSavePartner = async () => {
    // 필수 필드 검증
    if (!formData.name.trim()) {
      setError('파트너사명을 입력해주세요.');
      return;
    }

    if (!formData.partner_type || 
        (formData.partner_type !== 'supplier' && 
         formData.partner_type !== 'customer' && 
         formData.partner_type !== 'both')) {
      setError('파트너 타입(공급업체 또는 고객회사)을 반드시 선택해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = isEditing && selectedPartner 
        ? `/api/partners/${selectedPartner.partner_id}` 
        : '/api/partners';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchPartners();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '파트너사 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('파트너사 저장 오류:', error);
      setError('파트너사 저장 중 오류가 발생했습니다.');
    }
  };

  // 파트너 타입 관련 함수들
  const isSupplier = (partnerType?: string) => {
    return partnerType === 'supplier' || partnerType === 'both';
  };

  const isCustomer = (partnerType?: string) => {
    return partnerType === 'customer' || partnerType === 'both';
  };

  const handleSupplierChange = (checked: boolean) => {
    const currentType = formData.partner_type;
    let newType: 'supplier' | 'customer' | 'both' | '';

    if (checked) {
      if (isCustomer(currentType)) {
        newType = 'both';
      } else {
        newType = 'supplier';
      }
    } else {
      if (isCustomer(currentType)) {
        newType = 'customer';
      } else {
        newType = '';
      }
    }

    setFormData({ ...formData, partner_type: newType });
  };

  const handleCustomerChange = (checked: boolean) => {
    const currentType = formData.partner_type;
    let newType: 'supplier' | 'customer' | 'both' | '';

    if (checked) {
      if (isSupplier(currentType)) {
        newType = 'both';
      } else {
        newType = 'customer';
      }
    } else {
      if (isSupplier(currentType)) {
        newType = 'supplier';
      } else {
        newType = '';
      }
    }

    setFormData({ ...formData, partner_type: newType });
  };

  const getPartnerTypeLabel = (partnerType?: string) => {
    if (partnerType === 'supplier') return '공급업체';
    if (partnerType === 'customer') return '고객회사';
    if (partnerType === 'both') return '공급업체/고객회사';
    return '-';
  };

  const getPartnerTypeColor = (partnerType?: string) => {
    if (partnerType === 'supplier') return 'primary';
    if (partnerType === 'customer') return 'success';
    if (partnerType === 'both') return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            color: '#191f28',
            fontSize: '1.125rem',
            mb: 0.5
          }}>
            파트너사 관리
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#8b95a1',
            fontSize: '0.75rem',
            fontWeight: 400
          }}>
            파트너사 정보를 관리합니다.
          </Typography>
        </Box>
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 검색 필드 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
            <Search sx={{ position: 'absolute', left: 12, color: '#666', fontSize: 20 }} />
            <TextField
              size="small"
              fullWidth
              placeholder={t('partnerSearchPlaceholder')}
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
                    <Clear sx={{ fontSize: 18 }} />
                  </IconButton>
                )
              }}
            />
          </Box>
          {debouncedSearchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              {filteredPartners.length}개 결과
            </Typography>
          )}
        </Box>
      </Paper>

      {/* 액션 버튼 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        {!!partnerMenuPermission.can_create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddPartner}
            sx={{ fontSize: '0.75rem' }}
          >
            파트너사 추가
          </Button>
        )}
      </Box>

      {/* 파트너사 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>회사명</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>파트너 타입</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>취급품목</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>GST</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPartners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {debouncedSearchTerm ? '검색 결과가 없습니다.' : '등록된 파트너사가 없습니다.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners.map((partner) => (
                <TableRow 
                  key={partner.partner_id} 
                  hover 
                  onClick={() => handleViewPartner(partner)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Business sx={{ mr: 1, fontSize: '1rem' }} />
                      {partner.name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    <Chip
                      label={getPartnerTypeLabel(partner.partner_type)}
                      color={getPartnerTypeColor(partner.partner_type) as any}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {partner.product_category || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {partner.gst1 || partner.gst2 || partner.gst3 || partner.gst4 || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {new Date(partner.create_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {!!partnerMenuPermission.can_update && (
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPartner(partner);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!!partnerMenuPermission.can_delete && (
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePartner(partner);
                            }}
                          >
                            <Delete fontSize="small" />
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

      {/* 파트너사 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '0.875rem' }}>
          {isEditing ? '파트너사 수정' : '파트너사 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="회사명 *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="COI *"
                value={formData.coi}
                onChange={(e) => setFormData({ ...formData, coi: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="주소 *"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                파트너 타입 <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center',
                border: (formData.partner_type === '' || !formData.partner_type) ? '1px solid #f44336' : '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1,
                backgroundColor: (formData.partner_type === '' || !formData.partner_type) ? '#ffebee' : 'transparent'
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSupplier(formData.partner_type)}
                      onChange={(e) => handleSupplierChange(e.target.checked)}
                      size="small"
                    />
                  }
                  label="공급업체"
                  sx={{ fontSize: '0.75rem' }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isCustomer(formData.partner_type)}
                      onChange={(e) => handleCustomerChange(e.target.checked)}
                      size="small"
                    />
                  }
                  label="고객회사"
                  sx={{ fontSize: '0.75rem' }}
                />
              </Box>
              {(formData.partner_type === '' || !formData.partner_type) && (
                <Typography variant="caption" sx={{ color: '#f44336', fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                  공급업체 또는 고객회사를 반드시 선택해주세요.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="취급품목"
                value={formData.product_category}
                onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                size="small"
                multiline
                rows={3}
                sx={{ fontSize: '0.75rem' }}
                placeholder="파트너사의 주요 취급품목을 입력하세요"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PAN"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IEC"
                value={formData.iec}
                onChange={(e) => setFormData({ ...formData, iec: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST 1"
                value={formData.gst1}
                onChange={(e) => setFormData({ ...formData, gst1: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST 2"
                value={formData.gst2}
                onChange={(e) => setFormData({ ...formData, gst2: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST 3"
                value={formData.gst3}
                onChange={(e) => setFormData({ ...formData, gst3: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST 4"
                value={formData.gst4}
                onChange={(e) => setFormData({ ...formData, gst4: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="MSME"
                value={formData.msme}
                onChange={(e) => setFormData({ ...formData, msme: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="은행명"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="예금주"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="계좌번호"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IFSC 코드"
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: removeSpaces(e.target.value) })}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontSize: '0.75rem' }}>
            취소
          </Button>
          <Button onClick={handleSavePartner} variant="contained" sx={{ fontSize: '0.75rem' }}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 파트너사 상세보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '0.875rem' }}>
          파트너사 상세 정보
        </DialogTitle>
        <DialogContent>
          {selectedPartner && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  회사명
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  COI
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.coi}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  주소
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.address}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  파트너 타입
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {getPartnerTypeLabel(selectedPartner.partner_type)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  취급품목
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.product_category || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  PAN
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.pan || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  IEC
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.iec || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  GST 1
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.gst1 || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  GST 2
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.gst2 || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  GST 3
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.gst3 || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  GST 4
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.gst4 || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  MSME
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.msme || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  은행명
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.bank_name || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  예금주
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.account_holder || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  계좌번호
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.account_number ? formatAccountNumber(selectedPartner.account_number) : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  IFSC 코드
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.ifsc_code || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  등록일
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {new Date(selectedPartner.create_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  수정일
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {selectedPartner.update_date ? new Date(selectedPartner.update_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            variant="contained" 
            onClick={() => {
              setViewDialogOpen(false);
              handleEditPartner(selectedPartner!);
            }} 
            sx={{ fontSize: '0.75rem' }}
          >
            수정
          </Button>
          <Button onClick={() => setViewDialogOpen(false)} sx={{ fontSize: '0.75rem' }}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnerPage; 