import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CalendarToday,
  FilterList
} from '@mui/icons-material';
import axios from 'axios';

interface StatisticsData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    purchase: {
      count: number;
      total_amount: number;
      avg_amount: number;
    };
    sale: {
      count: number;
      total_amount: number;
      avg_amount: number;
    };
    net_profit: number;
  };
  monthly: Array<{
    month: string;
    transaction_type: string;
    count: number;
    total_amount: number;
    avg_amount: number;
  }>;
  status: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
  partners: Array<{
    partner_name: string;
    transaction_type: string;
    count: number;
    total_amount: number;
  }>;
  recent: Array<{
    id: number;
    transaction_type: string;
    total_amount: number;
    transaction_date: string;
    status: string;
    partner_name: string;
    creator: string;
    description: string;
  }>;
  companies: Array<{
    company_id: number;
    name: string;
  }>;
}

const AccountingStatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 필터 상태
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('인증 토큰이 없습니다.');
        return;
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedCompany) params.append('companyFilter', selectedCompany);

      const response = await axios.get(`/api/accounting/statistics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError('통계 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('통계 조회 오류:', error);
      setError(error.response?.data?.error || '통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedCompany]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    
    // 기본 날짜 설정 (올해 1월 1일 ~ 오늘)
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    setStartDate(startOfYear.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [fetchStatistics]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'purchase' ? 'error' : 'success';
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'purchase' ? <TrendingDown /> : <TrendingUp />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={3}>
        <Alert severity="info">데이터가 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: 0.5 }}>
        매입/매출 통계
      </Typography>

      {/* 필터 섹션 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <TextField
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                '& .MuiInputBase-input': { fontSize: '0.75rem' }
              }}
            />
          </Grid>
          <Grid item>
            <TextField
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                '& .MuiInputBase-input': { fontSize: '0.75rem' }
              }}
            />
          </Grid>
          {(currentUser?.role === 'root' || currentUser?.role === 'audit') && (
            <Grid item>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>회사 선택</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  label="회사 선택"
                  sx={{ 
                    '& .MuiSelect-select': { fontSize: '0.75rem' }
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.75rem' }}>전체</MenuItem>
                  {data.companies.map((company) => (
                    <MenuItem key={company.company_id} value={company.company_id} sx={{ fontSize: '0.75rem' }}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item>
            <Button
              variant="contained"
              startIcon={<FilterList />}
              onClick={fetchStatistics}
              sx={{ fontSize: '0.75rem' }}
            >
              조회
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 요약 통계 카드 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingDown color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  매입
                </Typography>
              </Box>
              <Typography variant="h4" color="error" sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {formatCurrency(data.summary.purchase.total_amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {data.summary.purchase.count}건 (평균: {formatCurrency(data.summary.purchase.avg_amount)})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="success" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  매출
                </Typography>
              </Box>
              <Typography variant="h4" color="success" sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {formatCurrency(data.summary.sale.total_amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {data.summary.sale.count}건 (평균: {formatCurrency(data.summary.sale.avg_amount)})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  순이익
                </Typography>
              </Box>
              <Typography 
                variant="h4" 
                color={data.summary.net_profit >= 0 ? 'success' : 'error'}
                sx={{ fontSize: '1.2rem', fontWeight: 700 }}
              >
                {formatCurrency(data.summary.net_profit)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                매출 - 매입
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarToday color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" color="info" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  기간
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {data.period.start} ~ {data.period.end}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                조회 기간
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 상태별 통계 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              상태별 통계
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>상태</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>건수</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>총액</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.status.map((stat) => (
                    <TableRow key={stat.status}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Chip 
                          label={stat.status === 'completed' ? '완료' : 
                                 stat.status === 'pending' ? '대기' : '취소'} 
                          color={getStatusColor(stat.status) as any}
                          size="small"
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{stat.count}건</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(stat.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* 협력업체별 통계 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              협력업체별 통계 (상위 10개)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>협력업체</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>구분</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>건수</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>총액</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.partners.map((partner, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{partner.partner_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Chip 
                          label={partner.transaction_type === 'purchase' ? '매입' : '매출'}
                          color={getTransactionTypeColor(partner.transaction_type) as any}
                          size="small"
                          icon={getTransactionTypeIcon(partner.transaction_type)}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{partner.count}건</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(partner.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* 최근 거래 내역 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              최근 거래 내역
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>거래일</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>구분</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>협력업체</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>설명</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>금액</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>상태</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>등록자</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {new Date(transaction.transaction_date).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Chip 
                          label={transaction.transaction_type === 'purchase' ? '매입' : '매출'}
                          color={getTransactionTypeColor(transaction.transaction_type) as any}
                          size="small"
                          icon={getTransactionTypeIcon(transaction.transaction_type)}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{transaction.partner_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{transaction.description}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                        {formatCurrency(transaction.total_amount)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Chip 
                          label={transaction.status === 'completed' ? '완료' : 
                                 transaction.status === 'pending' ? '대기' : '취소'} 
                          color={getStatusColor(transaction.status) as any}
                          size="small"
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{transaction.creator}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountingStatisticsPage; 