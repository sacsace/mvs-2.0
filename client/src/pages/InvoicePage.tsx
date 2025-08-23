import React, { useState, useEffect } from 'react';
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
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Description as DescriptionIcon,
  ReceiptLong as ReceiptLongIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useMenuPermission } from '../hooks/useMenuPermission';
import html2pdf from 'html2pdf.js';
import EInvoicePage from './EInvoicePage';

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: 'regular' | 'e-invoice' | 'lotus' | 'proforma';
  company_id: number;
  partner_company_id: number;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  company?: {
    company_id: number;
    name: string;
  };
  partnerCompany?: {
    company_id: number;
    name: string;
    address?: string;
    gst1?: string;
  };
  creator?: {
    id: number;
    username: string;
    userid: string;
  };
}

interface Company {
  company_id: number;
  name: string;
  address?: string;
  gst1?: string;
  gst2?: string;
  gst3?: string;
  gst4?: string;
  coi?: string;
  pan?: string;
  email?: string;
  website?: string;
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  ifsc_code?: string;
  swift_code?: string;
  signature_url?: string;
  stamp_url?: string;
}

const InvoicePage: React.FC = () => {
  const { t } = useLanguage();
  const { permission: invoiceMenuPermission, loading: permissionLoading } = useMenuPermission('매출 관리');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // 정렬 상태 관리
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState(0);

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [invoiceFormDialogOpen, setInvoiceFormDialogOpen] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    invoice_number: '',
    invoice_type: 'regular' as 'regular' | 'e-invoice' | 'lotus' | 'proforma',
    invoice_date: new Date().toISOString().split('T')[0],
    partner_company_id: 1,
    customer_input_type: 'existing' as 'existing' | 'manual', // 고객 입력 방식
    manual_customer: {
      name: '',
      address: '',
      gst: ''
    },
    service_items: [
      {
        description: '',
        hsn_code: '998314',
        igst_rate: 0,
        cgst_rate: 9,
        sgst_rate: 9,
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
        igst_amount: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        total_amount: 0
      }
    ],
    notes: '',
    terms_conditions: 'Payment due within 30 days\nLate payment may incur additional charges',
    header_info: {
      company_name: '',
      address: '',
      gstin: '',
      cin: '',
      email: '',
      website: ''
    }
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentCompany, setCurrentCompany] = useState<any>(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_type: 'regular' as 'regular' | 'e-invoice' | 'lotus' | 'proforma',
    partner_company_id: 1,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: 'INR',
    description: '',
    notes: ''
  });

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    console.log('=== InvoicePage 초기화 ===');
    console.log('사용자 정보:', userData);
    console.log('토큰 존재:', !!token);
    console.log('토큰 길이:', token ? token.length : 0);
    setCurrentUser(userData);
  }, []);

  useEffect(() => {
    console.log('=== currentUser 변경됨 ===');
    console.log('currentUser:', currentUser);
    console.log('currentUser 타입:', typeof currentUser);
    console.log('currentUser가 객체인가:', currentUser && typeof currentUser === 'object');
    
    // 사용자 정보가 없어도 API 호출 시도
    console.log('API 호출 시작...');
    fetchInvoices();
    fetchCompanies();
    fetchCurrentCompany();
  }, [currentUser]);

  const fetchInvoices = async () => {
    try {
      console.log('인보이스 목록 조회 시작');
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('토큰:', token ? '존재함' : '없음');
      
      const response = await fetch('/api/invoice', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('인보이스 데이터:', data);
        setInvoices(data);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        setError('Failed to load invoice list.');
      }
    } catch (error) {
      console.error('인보이스 목록 조회 오류:', error);
      setError('Failed to load invoice list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      console.log('회사 목록 조회 시작');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('회사 API 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('회사 데이터:', data);
        setCompanies(data);
      } else {
        console.error('회사 API 오류:', response.status);
      }
    } catch (error) {
      console.error('회사 목록 조회 오류:', error);
    }
  };

  const fetchCurrentCompany = async () => {
    try {
      console.log('현재 사용자 회사 정보 조회 시작');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('현재 회사 API 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('현재 회사 데이터:', data);
        setCurrentCompany(data);
      } else {
        console.error('현재 회사 API 오류:', response.status);
      }
    } catch (error) {
      console.error('현재 회사 정보 조회 오류:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };

  const handleTypeFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleAddInvoice = async () => {
    setEditingInvoice(null);
    
    // 현재 사용자 회사로 기본 설정
    const defaultCompanyId = currentUser?.company_id || 1;
    
         setFormData({
       invoice_number: '',
       invoice_type: 'regular',
       partner_company_id: defaultCompanyId,
       invoice_date: new Date().toISOString().split('T')[0],
       due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
       subtotal: 0,
       tax_amount: 0,
       total_amount: 0,
       currency: 'INR',
       description: '',
       notes: ''
     });
    setDialogOpen(true);
  };

  const handleCreateRegularInvoice = async () => {
    console.log('=== 일반 인보이스 생성 ===');
    
    // 현재 사용자 회사로 기본 설정
    const defaultCompanyId = currentUser?.company_id || 1;
    
    // 인보이스 번호 자동 생성
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invoice/generate-number/regular', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let invoiceNumber = '';
      if (response.ok) {
        const data = await response.json();
        invoiceNumber = data.invoice_number;
      }
      
      // 헤더 정보를 현재 회사 정보로 초기화
      const headerInfo = {
        company_name: currentCompany?.name || '',
        address: currentCompany?.address || '',
        gstin: currentCompany?.gst1 || '',
        cin: currentCompany?.coi || '',
        email: currentCompany?.email || '',
        website: currentCompany?.website || ''
      };
      
      // 인라인 폼용 기본값 세팅
      setFormData({
        invoice_number: invoiceNumber,
        invoice_type: 'regular',
        partner_company_id: defaultCompanyId,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        currency: 'INR',
        description: '',
        notes: ''
      });
      // 필요 시 headerInfo는 별도 상태에 저장해 사용할 수 있음
    } catch (error) {
      console.error('인보이스 번호 생성 오류:', error);
      setError('Failed to generate invoice number.');
    }
  };

  // Regular 탭 진입 시 자동으로 신규 인보이스 번호 발급 및 폼 초기화
  useEffect(() => {
    if (activeTab === 1 && !formData.invoice_number) {
      handleCreateRegularInvoice();
    }
  }, [activeTab]);

  const handleCreateProformaInvoice = async () => {
    console.log('=== Proforma Invoice 생성 ===');
    
    // 현재 사용자 회사로 기본 설정
    const defaultCompanyId = currentUser?.company_id || 1;
    
    // 인보이스 번호 자동 생성
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invoice/generate-number/proforma', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let invoiceNumber = '';
      if (response.ok) {
        const data = await response.json();
        invoiceNumber = data.invoice_number;
      }
      
      // 헤더 정보를 현재 회사 정보로 초기화
      const headerInfo = {
        company_name: currentCompany?.name || '',
        address: currentCompany?.address || '',
        gstin: currentCompany?.gst1 || '',
        cin: currentCompany?.coi || '',
        email: currentCompany?.email || '',
        website: currentCompany?.website || ''
      };
      
      setInvoiceFormData({
        invoice_number: invoiceNumber,
        invoice_type: 'proforma' as 'regular' | 'e-invoice' | 'lotus' | 'proforma',
        invoice_date: new Date().toISOString().split('T')[0],
        partner_company_id: defaultCompanyId,
        customer_input_type: 'existing' as 'existing' | 'manual',
        manual_customer: {
          name: '',
          address: '',
          gst: ''
        },
        service_items: [
          {
            description: '',
            hsn_code: '998314',
            igst_rate: 0,
            cgst_rate: 9,
            sgst_rate: 9,
            quantity: 1,
            unit_price: 0,
            subtotal: 0,
            igst_amount: 0,
            cgst_amount: 0,
            sgst_amount: 0,
            total_amount: 0
          }
        ],
        notes: '',
        terms_conditions: 'Payment due within 30 days\nLate payment may incur additional charges',
        header_info: headerInfo
      });
      setInvoiceFormDialogOpen(true);
    } catch (error) {
      console.error('인보이스 번호 생성 오류:', error);
      setError('Failed to generate invoice number.');
    }
  };

     const handleEditInvoice = (invoice: Invoice) => {
     setEditingInvoice(invoice);
     setFormData({
       invoice_number: invoice.invoice_number,
       invoice_type: invoice.invoice_type,
       partner_company_id: invoice.partner_company_id,
       invoice_date: new Date(invoice.invoice_date).toISOString().split('T')[0],
       due_date: new Date(invoice.due_date).toISOString().split('T')[0],
       subtotal: invoice.subtotal,
       tax_amount: invoice.tax_amount,
       total_amount: invoice.total_amount,
       currency: 'INR', // 항상 INR로 고정
       description: invoice.description || '',
       notes: invoice.notes || ''
     });
     setDialogOpen(true);
   };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/invoice/${invoiceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setSnackbarMessage('Invoice has been successfully deleted.');
          setSnackbarOpen(true);
          fetchInvoices();
        } else {
          setError('Failed to delete invoice.');
        }
      } catch (error) {
        console.error('인보이스 삭제 오류:', error);
        setError('Failed to delete invoice.');
      }
    }
  };

  const handleSaveInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingInvoice ? `/api/invoice/${editingInvoice.id}` : '/api/invoice';
      const method = editingInvoice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbarMessage(editingInvoice ? 'Invoice has been successfully updated.' : 'Invoice has been successfully created.');
        setSnackbarOpen(true);
        setDialogOpen(false);
        fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save invoice.');
      }
    } catch (error) {
      console.error('인보이스 저장 오류:', error);
      setError('Failed to save invoice.');
    }
  };

  const handleSaveInvoiceForm = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        setError('User information not found.');
        return;
      }

      // Calculate totals from all service items
      let totalSubtotal = 0;
      let totalTaxAmount = 0;
      let totalAmount = 0;
      let combinedDescription = '';

      invoiceFormData.service_items.forEach((item, index) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemIgstAmount = itemSubtotal * (item.igst_rate / 100);
        const itemCgstAmount = itemSubtotal * (item.cgst_rate / 100);
        const itemSgstAmount = itemSubtotal * (item.sgst_rate / 100);
        const itemTotal = itemSubtotal + itemIgstAmount + itemCgstAmount + itemSgstAmount;

        totalSubtotal += itemSubtotal;
        totalTaxAmount += itemIgstAmount + itemCgstAmount + itemSgstAmount;
        totalAmount += itemTotal;

        if (item.description) {
          combinedDescription += `${index + 1}. ${item.description}\n`;
        }
      });

      const invoiceData = {
        invoice_number: invoiceFormData.invoice_number,
        invoice_type: 'regular',
        company_id: user.company_id,
        partner_company_id: invoiceFormData.partner_company_id,
        invoice_date: invoiceFormData.invoice_date,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: totalSubtotal,
        tax_amount: totalTaxAmount,
        total_amount: totalAmount,
        currency: 'INR',
        description: combinedDescription.trim(),
        notes: invoiceFormData.notes,
        created_by: user.id
      };

      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        setSnackbarMessage('Invoice has been successfully created.');
        setSnackbarOpen(true);
        setInvoiceFormDialogOpen(false);
        fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '인보이스 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('인보이스 저장 오류:', error);
      setError('An error occurred while saving the invoice.');
    }
  };

  const generateInvoiceForm = (invoice: Invoice) => {
    if (!currentCompany) {
      alert('Unable to load company information.');
      return;
    }

    const invoiceFormHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getInvoiceTitle(invoice.invoice_type)} - ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .company-info {
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 20px;
        }
        .tax-invoice-label {
            font-size: 32px;
            font-weight: bold;
            color: #d32f2f;
            margin: 20px 0;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .invoice-info {
            flex: 1;
        }
        .terms {
            flex: 1;
            margin-left: 20px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .section-content {
            font-size: 12px;
            line-height: 1.4;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }
        .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .total-amount {
            font-weight: bold;
            font-size: 14px;
            margin-top: 20px;
        }
        .bank-details {
            margin-top: 30px;
        }
        .footer {
            margin-top: 40px;
            text-align: right;
        }
        .signature {
            margin-top: 50px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #000;
            width: 200px;
            margin: 10px auto;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-name">${currentCompany.name}</div>
            <div class="company-info">
                ${currentCompany.address}<br>
                GSTIN: ${currentCompany.gst1 || 'N/A'}<br>
                CIN: ${currentCompany.coi || 'N/A'}<br>
                Email: ${currentCompany.email || 'acc@msventures.in'}<br>
                Website: ${currentCompany.website || 'www.msventures.in | www.wilmat.in | www.hotellotus.in'}
            </div>
            <div class="tax-invoice-label">${getInvoiceTitle(invoice.invoice_type)}</div>
        </div>

        <div class="invoice-details">
            <div class="invoice-info">
                <div class="section">
                    <div class="section-title">${getInvoiceNumberLabel(invoiceFormData.invoice_type)}</div>
                    <div class="section-content">${invoice.invoice_number}</div>
                </div>
                <div class="section">
                    <div class="section-title">DATE OF ISSUE</div>
                    <div class="section-content">${new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</div>
                </div>
            </div>
            <div class="terms">
                <div class="section-title">Terms & Condition</div>
                <div class="section-content">
                    Payment due within 30 days<br>
                    Late payment may incur additional charges
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Supplier</div>
            <div class="section-content">
                ${currentCompany.name}<br>
                ${currentCompany.address}<br>
                GSTIN: ${currentCompany.gst1 || 'N/A'}<br>
                PAN: ${currentCompany.pan || 'N/A'}
            </div>
        </div>

        <div class="section">
            <div class="section-title">Customer (Billing)</div>
            <div class="section-content">
                Company name: ${invoice.partnerCompany?.name || 'N/A'}<br>
                Address: ${invoice.partnerCompany?.address || 'N/A'}<br>
                GST NO: ${invoice.partnerCompany?.gst1 || 'N/A'}
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Description</th>
                    <th>HSN Code</th>
                    <th>IGST (%)</th>
                    <th>CGST (%)</th>
                    <th>SGST (%)</th>
                    <th>Qty (A)</th>
                    <th>Unit Price (INR) (B)</th>
                    <th>IGST (C)</th>
                    <th>CGST (D)</th>
                    <th>SGST (E)</th>
                    <th>Amount (INR) ((A)*(B))+(C)+(D)+(E)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>${invoice.description || 'Service/Product'}</td>
                    <td>998314</td>
                    <td>18%</td>
                    <td></td>
                    <td></td>
                    <td>1</td>
                    <td>${invoice.subtotal.toLocaleString()}</td>
                    <td>${(invoice.subtotal * 0.18).toLocaleString()}</td>
                    <td></td>
                    <td></td>
                    <td>${invoice.total_amount.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>9%</td>
                    <td>9%</td>
                    <td>1</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr><td>3</td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td>4</td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td>5</td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td>6</td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td>7</td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td>8</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td>9</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td>##</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            </tbody>
        </table>

        <div class="total-amount">
            Total Amount (A) (INR): ${invoice.total_amount.toLocaleString()}
        </div>

        <div class="bank-details">
            <div class="section-title">BANK DETAILS</div>
            <div class="section-content">
                BANK: ${currentCompany.bank_name || 'ICICI Bank, Bangalore MG Road'}<br>
                SWIFT CODE: ${currentCompany.swift_code || 'N/A'}<br>
                IFSC CODE: ${currentCompany.ifsc_code || 'ICIC0000002'}<br>
                AC NUMBER: ${currentCompany.account_number || '000205032720'}<br>
                AC HOLDER: ${currentCompany.account_holder || currentCompany.name}
            </div>
        </div>

        <div class="footer">
            <div>For ${currentCompany.name}</div>
        </div>

        <div class="signature">
            <div class="signature-line"></div>
            <div>Authorised Signatory</div>
        </div>
    </div>
</body>
</html>`;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(invoiceFormHTML);
      newWindow.document.close();
    }
  };

  // 정렬 핸들러
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 같은 필드를 클릭한 경우 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭한 경우 해당 필드로 오름차순 설정
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUpward sx={{ fontSize: 14, ml: 0.5 }} /> : 
      <ArrowDownward sx={{ fontSize: 14, ml: 0.5 }} />;
  };

  // 필터링된 인보이스 목록
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.description && invoice.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesType = filterType === 'all' || invoice.invoice_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // 정렬된 인보이스 목록
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any = '';
    let bValue: any = '';

    switch (sortField) {
      case 'invoice_number':
        aValue = a.invoice_number?.toLowerCase() || '';
        bValue = b.invoice_number?.toLowerCase() || '';
        break;
      case 'invoice_type':
        aValue = a.invoice_type || '';
        bValue = b.invoice_type || '';
        break;
      case 'customer':
        aValue = a.partnerCompany?.name?.toLowerCase() || '';
        bValue = b.partnerCompany?.name?.toLowerCase() || '';
        break;
      case 'amount':
        aValue = a.total_amount || 0;
        bValue = b.total_amount || 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'issue_date':
        aValue = new Date(a.invoice_date || 0);
        bValue = new Date(b.invoice_date || 0);
        break;
      case 'due_date':
        aValue = new Date(a.due_date || 0);
        bValue = new Date(b.due_date || 0);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const paginatedInvoices = sortedInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'info';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent';
      case 'paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'regular':
        return 'Regular Invoice';
      case 'e-invoice':
        return 'E-Invoice';
      case 'lotus':
        return 'Lotus Invoice';
      case 'proforma':
        return 'Proforma Invoice';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regular':
        return 'default';
      case 'e-invoice':
        return 'info';
      case 'lotus':
        return 'warning';
      case 'proforma':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Helper function to get the correct invoice title based on type
  const getInvoiceTitle = (type: string) => {
    switch (type) {
      case 'regular':
        return 'TAX INVOICE';
      case 'e-invoice':
        return 'E-INVOICE';
      case 'lotus':
        return 'LOTUS INVOICE';
      case 'proforma':
        return 'PROFORMA INVOICE';
      default:
        return 'TAX INVOICE';
    }
  };

  const getInvoiceNumberLabel = (type: string) => {
    switch (type) {
      case 'proforma':
        return 'PROFORMA INVOICE NO.';
      default:
        return 'INVOICE NO.';
    }
  };

  // Lotus Invoice 권한 확인
  const canUseLotusInvoice = () => {
    if (!currentUser?.company) return false;
    return currentUser.company.name.includes('Minsub Ventures Private Limited');
  };

  // Helper functions for service items
  const addServiceItem = () => {
    setInvoiceFormData(prev => ({
      ...prev,
      service_items: [
        ...prev.service_items,
        {
          description: '',
          hsn_code: '998314',
          igst_rate: 18,
          cgst_rate: 9,
          sgst_rate: 9,
          quantity: 1,
          unit_price: 0,
          subtotal: 0,
          igst_amount: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          total_amount: 0
        }
      ]
    }));
  };

  const removeServiceItem = (index: number) => {
    setInvoiceFormData(prev => ({
      ...prev,
      service_items: prev.service_items.filter((_, i) => i !== index)
    }));
  };

  const updateServiceItem = (index: number, field: string, value: any) => {
    setInvoiceFormData(prev => ({
      ...prev,
      service_items: prev.service_items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate totals
          const subtotal = updatedItem.quantity * updatedItem.unit_price;
          const igstAmount = subtotal * (updatedItem.igst_rate / 100);
          const cgstAmount = subtotal * (updatedItem.cgst_rate / 100);
          const sgstAmount = subtotal * (updatedItem.sgst_rate / 100);
          const totalAmount = subtotal + igstAmount + cgstAmount + sgstAmount;
          
          return {
            ...updatedItem,
            subtotal,
            igst_amount: igstAmount,
            cgst_amount: cgstAmount,
            sgst_amount: sgstAmount,
            total_amount: totalAmount
          };
        }
        return item;
      })
    }));
  };

  const calculateTotals = () => {
    let totalSubtotal = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;

    invoiceFormData.service_items.forEach(item => {
      totalSubtotal += item.subtotal;
      totalTaxAmount += item.igst_amount + item.cgst_amount + item.sgst_amount;
      totalAmount += item.total_amount;
    });

    return { totalSubtotal, totalTaxAmount, totalAmount };
  };

  // 빈 서비스 항목을 필터링하는 함수
  const filterNonEmptyItems = (items: any[]) => {
    return items.filter(item => 
      item.description && 
      item.description.trim() !== '' && 
      (item.unit_price > 0 || item.quantity > 0)
    );
  };

  // PDF 생성 및 다운로드 함수
  const generatePDF = async () => {
    try {
      // 서비스 항목을 10개씩 분할하는 함수
      const renderPagedTable = (items: any[]) => {
        const filteredItems = filterNonEmptyItems(items);
        const pages = [];
        for (let i = 0; i < filteredItems.length; i += 10) {
          const pageItems = filteredItems.slice(i, i + 10);
          const pageNumber = Math.floor(i / 10) + 1;
          
          pages.push(`
            <div class="page" style="page-break-after: always;">
              ${pageNumber > 1 ? `
                <div class="page-header" style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                  <div style="font-size: 12px; color: #666;">Page ${pageNumber} - Continued</div>
                </div>
              ` : ''}
              
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Description</th>
                    <th>HSN Code</th>
                    <th>IGST (%)</th>
                    <th>CGST (%)</th>
                    <th>SGST (%)</th>
                    <th>Qty</th>
                    <th>Unit Price (₹)</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageItems.map((item, index) => `
                    <tr>
                      <td>${i + index + 1}</td>
                      <td>${item.description}</td>
                      <td>${item.hsn_code}</td>
                      <td>${item.igst_rate}</td>
                      <td>${item.cgst_rate}</td>
                      <td>${item.sgst_rate}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.unit_price.toLocaleString()}</td>
                      <td>₹${item.subtotal.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `);
        }
        return pages.join('');
      };

      // 인보이스 양식을 HTML로 생성
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${getInvoiceTitle(invoiceFormData.invoice_type)} - ${invoiceFormData.invoice_number}</title>
          <style>
            @page {
              margin: 1cm 1cm 1cm 2cm; /* 위 1cm, 우측 1cm, 아래 1cm, 좌측 2cm */
              size: A4;
            }
            
            body { 
              font-family: sans-serif; 
              margin: 0;
              padding: 0;
              font-size: 11px;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 15px; 
            }
            
            .company-name { 
              font-size: 20px; 
              font-weight: bold; 
              text-transform: uppercase; 
              margin-bottom: 8px; 
            }
            
            .company-address { 
              font-size: 10px; 
              line-height: 1.3; 
              margin-bottom: 8px; 
            }
            
            .company-details { 
              font-size: 9px; 
              margin-bottom: 8px; 
            }
            
            .invoice-title { 
              font-size: 22px; 
              font-weight: bold; 
              color: #d32f2f; 
              margin: 15px 0; 
            }
            
            .invoice-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            
            .invoice-details, .terms { 
              width: 48%; 
              border: 1px solid #ddd; 
              padding: 10px; 
            }
            
            .section-title { 
              font-weight: bold; 
              margin-bottom: 8px; 
              font-size: 12px; 
            }
            
            .supplier-customer { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            
            .supplier, .customer { 
              width: 48%; 
              border: 1px solid #ddd; 
              padding: 10px; 
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
              font-size: 9px;
            }
            
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
            }
            
            th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
              font-size: 9px;
            }
            
            .totals { 
              border: 1px solid #ddd; 
              padding: 10px; 
              margin-bottom: 20px; 
            }
            
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 4px; 
            }
            
            .grand-total { 
              font-size: 14px; 
              font-weight: bold; 
              margin-top: 8px; 
            }
            
            .bank-details { 
              border: 1px solid #ddd; 
              padding: 10px; 
              margin-bottom: 20px; 
            }
            
            .notes { 
              margin-bottom: 20px; 
            }
            
            .signature-section { 
              display: flex; 
              justify-content: space-between; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
            }
            
            .signature, .stamp { 
              text-align: center; 
              flex: 1; 
            }
            
            .page { 
              page-break-inside: avoid; 
            }
            
            .page-header { 
              margin-bottom: 15px; 
              padding-bottom: 8px; 
              border-bottom: 1px solid #ddd; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${invoiceFormData.header_info.company_name || 'Company Name'}</div>
            <div class="company-address">${invoiceFormData.header_info.address || 'Address'}</div>
            <div class="company-details">
              GSTIN: ${invoiceFormData.header_info.gstin || 'N/A'} | CIN: ${invoiceFormData.header_info.cin || 'N/A'}<br>
              Email: ${invoiceFormData.header_info.email || 'N/A'} | Website: ${invoiceFormData.header_info.website || 'N/A'}
            </div>
            <div class="invoice-title">${getInvoiceTitle(invoiceFormData.invoice_type)}</div>
          </div>

          <div class="invoice-info">
            <div class="invoice-details">
              <div class="section-title">${getInvoiceNumberLabel(invoiceFormData.invoice_type)}</div>
              <div>${invoiceFormData.invoice_number}</div>
              <div class="section-title" style="margin-top: 10px;">DATE OF ISSUE</div>
              <div>${new Date(invoiceFormData.invoice_date).toLocaleDateString('ko-KR')}</div>
            </div>
            <div class="terms">
              <div class="section-title">Terms & Condition</div>
              <div style="white-space: pre-line; font-size: 9px;">${invoiceFormData.terms_conditions}</div>
            </div>
          </div>

          <div class="supplier-customer">
            <div class="supplier">
              <div class="section-title">Supplier</div>
              <div style="font-size: 9px; line-height: 1.3;">
                ${currentCompany?.name || 'Company Name'}<br>
                ${currentCompany?.address || 'Address'}<br>
                GSTIN: ${currentCompany?.gst1 || 'N/A'}<br>
                PAN: ${currentCompany?.pan || 'N/A'}
              </div>
            </div>
            <div class="customer">
              <div class="section-title">Customer (Billing)</div>
              <div style="font-size: 9px; line-height: 1.3;">
                Company name: ${invoiceFormData.customer_input_type === 'manual' 
                  ? invoiceFormData.manual_customer.name || 'N/A'
                  : companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.name || 'N/A'}<br>
                Address: ${invoiceFormData.customer_input_type === 'manual' 
                  ? invoiceFormData.manual_customer.address || 'N/A'
                  : companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.address || 'N/A'}<br>
                GST NO: ${invoiceFormData.customer_input_type === 'manual' 
                  ? invoiceFormData.manual_customer.gst || 'N/A'
                  : companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.gst1 || 'N/A'}
              </div>
            </div>
          </div>

          ${renderPagedTable(invoiceFormData.service_items)}

          <div class="totals">
            <div class="section-title">금액 계산</div>
            ${(() => {
              const { totalSubtotal, totalTaxAmount, totalAmount } = calculateTotals();
              return `
                <div class="total-row">
                  <span>소계:</span>
                  <span>₹${totalSubtotal.toLocaleString()}</span>
                </div>
                <div class="total-row">
                  <span>세금:</span>
                  <span>₹${totalTaxAmount.toLocaleString()}</span>
                </div>
                <div class="total-row grand-total">
                  <span>총액:</span>
                  <span>₹${totalAmount.toLocaleString()}</span>
                </div>
              `;
            })()}
          </div>

          <div class="bank-details">
            <div class="section-title">BANK DETAILS</div>
            <div style="font-size: 9px; line-height: 1.3;">
              BANK: ${currentCompany?.bank_name || 'ICICI Bank, Bangalore MG Road'}<br>
              SWIFT CODE: ${currentCompany?.swift_code || 'N/A'}<br>
              IFSC CODE: ${currentCompany?.ifsc_code || 'ICIC0000002'}<br>
              AC NUMBER: ${currentCompany?.account_number || '000205032720'}<br>
              AC HOLDER: ${currentCompany?.account_holder || currentCompany?.name}
            </div>
          </div>

          <div class="notes">
            <div class="section-title">비고</div>
            <div style="font-size: 9px; line-height: 1.3; border: 1px solid #ddd; padding: 6px; min-height: 30px;">
              ${invoiceFormData.notes}
            </div>
          </div>

          <div class="signature-section">
            <div class="signature">
              <div style="margin-bottom: 8px; font-weight: bold; font-size: 10px;">Authorized Signature</div>
              ${currentCompany?.signature_url ? `<img src="${currentCompany.signature_url}" alt="Signature" style="max-width: 120px; max-height: 60px; object-fit: contain;">` : '<div style="width: 120px; height: 60px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999;">Signature</div>'}
            </div>
            <div class="stamp">
              <div style="margin-bottom: 8px; font-weight: bold; font-size: 10px;">Company Stamp</div>
              ${currentCompany?.stamp_url ? `<img src="${currentCompany.stamp_url}" alt="Stamp" style="max-width: 120px; max-height: 60px; object-fit: contain;">` : '<div style="width: 120px; height: 60px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999;">Stamp</div>'}
            </div>
          </div>
        </body>
        </html>
      `;

      // PDF 생성 옵션
      const opt = {
        margin: 1,
        filename: `Invoice_${invoiceFormData.invoice_number}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      };

      // PDF 생성 및 다운로드
      await html2pdf().set(opt).from(invoiceHTML).save();
      
      setSnackbarMessage('PDF has been successfully generated.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('PDF 생성 중 오류:', error);
      setSnackbarMessage('An error occurred while generating PDF.');
      setSnackbarOpen(true);
    }
  };

  // 인쇄 함수
  const handlePrint = () => {
    try {
      // 서비스 항목을 10개씩 분할하는 함수
      const renderPagedTable = (items: any[]) => {
        const filteredItems = filterNonEmptyItems(items);
        const pages = [];
        for (let i = 0; i < filteredItems.length; i += 10) {
          const pageItems = filteredItems.slice(i, i + 10);
          const pageNumber = Math.floor(i / 10) + 1;
          
          pages.push(`
            <div class="page" style="page-break-after: always;">
              ${pageNumber > 1 ? `
                <div class="page-header" style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                  <div style="font-size: 12px; color: #666;">Page ${pageNumber} - Continued</div>
                </div>
              ` : ''}
              
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Description</th>
                    <th>HSN Code</th>
                    <th>IGST (%)</th>
                    <th>CGST (%)</th>
                    <th>SGST (%)</th>
                    <th>Qty</th>
                    <th>Unit Price (₹)</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageItems.map((item, index) => `
                    <tr>
                      <td>${i + index + 1}</td>
                      <td>${item.description}</td>
                      <td>${item.hsn_code}</td>
                      <td>${item.igst_rate}</td>
                      <td>${item.cgst_rate}</td>
                      <td>${item.sgst_rate}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.unit_price.toLocaleString()}</td>
                      <td>₹${item.subtotal.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `);
        }
        return pages.join('');
      };

      // 인보이스 양식을 HTML로 생성
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${getInvoiceTitle(invoiceFormData.invoice_type)} - ${invoiceFormData.invoice_number}</title>
          <style>
            @page {
              margin: 1cm 1cm 1cm 2cm; /* 위 1cm, 우측 1cm, 아래 1cm, 좌측 2cm */
              size: A4;
            }
            
            body { 
              font-family: sans-serif; 
              margin: 0;
              padding: 0;
              font-size: 11px;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 15px; 
            }
            
            .company-name { 
              font-size: 20px; 
              font-weight: bold; 
              text-transform: uppercase; 
              margin-bottom: 8px; 
            }
            
            .company-address { 
              font-size: 10px; 
              line-height: 1.3; 
              margin-bottom: 8px; 
            }
            
            .company-details { 
              font-size: 9px; 
              margin-bottom: 8px; 
            }
            
            .invoice-title { 
              font-size: 22px; 
              font-weight: bold; 
              color: #d32f2f; 
              margin: 15px 0; 
            }
            
            .invoice-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            
            .invoice-details, .terms { 
              width: 48%; 
              border: 1px solid #ddd; 
              padding: 10px; 
            }
            
            .section-title { 
              font-weight: bold; 
              margin-bottom: 8px; 
              font-size: 12px; 
            }
            
            .supplier-customer { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            
            .supplier, .customer { 
              width: 48%; 
              border: 1px solid #ddd; 
              padding: 10px; 
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
              font-size: 9px;
            }
            
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
            }
            
            th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
              font-size: 9px;
            }
            
            .totals { 
              border: 1px solid #ddd; 
              padding: 10px; 
              margin-bottom: 20px; 
            }
            
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 4px; 
            }
            
            .grand-total { 
              font-size: 14px; 
              font-weight: bold; 
              margin-top: 8px; 
            }
            
            .bank-details { 
              border: 1px solid #ddd; 
              padding: 10px; 
              margin-bottom: 20px; 
            }
            
            .notes { 
              margin-bottom: 20px; 
            }
            
            .signature-section { 
              display: flex; 
              justify-content: space-between; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
            }
            
            .signature, .stamp { 
              text-align: center; 
              flex: 1; 
            }
            
            .page { 
              page-break-inside: avoid; 
            }
            
            .page-header { 
              margin-bottom: 15px; 
              padding-bottom: 8px; 
              border-bottom: 1px solid #ddd; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${invoiceFormData.header_info.company_name || 'Company Name'}</div>
            <div class="company-address">${invoiceFormData.header_info.address || 'Address'}</div>
            <div class="company-details">
              GSTIN: ${invoiceFormData.header_info.gstin || 'N/A'} | CIN: ${invoiceFormData.header_info.cin || 'N/A'}<br>
              Email: ${invoiceFormData.header_info.email || 'N/A'} | Website: ${invoiceFormData.header_info.website || 'N/A'}
            </div>
            <div class="invoice-title">${getInvoiceTitle(invoiceFormData.invoice_type)}</div>
          </div>

          <div class="invoice-info">
            <div class="invoice-details">
              <div class="section-title">${getInvoiceNumberLabel(invoiceFormData.invoice_type)}</div>
              <div>${invoiceFormData.invoice_number}</div>
              <div class="section-title" style="margin-top: 10px;">DATE OF ISSUE</div>
              <div>${new Date(invoiceFormData.invoice_date).toLocaleDateString('ko-KR')}</div>
            </div>
            <div class="terms">
              <div class="section-title">Terms & Condition</div>
              <div style="white-space: pre-line; font-size: 9px;">${invoiceFormData.terms_conditions}</div>
            </div>
          </div>

          <div class="supplier-customer">
            <div class="supplier">
              <div class="section-title">Supplier</div>
              <div style="font-size: 9px; line-height: 1.3;">
                ${currentCompany?.name || 'Company Name'}<br>
                ${currentCompany?.address || 'Address'}<br>
                GSTIN: ${currentCompany?.gst1 || 'N/A'}<br>
                PAN: ${currentCompany?.pan || 'N/A'}
              </div>
            </div>
            <div class="customer">
              <div class="section-title">Customer (Billing)</div>
              <div style="font-size: 9px; line-height: 1.3;">
                Company name: ${invoiceFormData.customer_input_type === 'manual' 
                  ? invoiceFormData.manual_customer.name || 'N/A'
                  : companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.name || 'N/A'}<br>
                Address: ${invoiceFormData.customer_input_type === 'manual' 
                  ? invoiceFormData.manual_customer.address || 'N/A'
                  : companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.address || 'N/A'}<br>
                GST NO: ${invoiceFormData.customer_input_type === 'manual' 
                  ? invoiceFormData.manual_customer.gst || 'N/A'
                  : companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.gst1 || 'N/A'}
              </div>
            </div>
          </div>

          ${renderPagedTable(invoiceFormData.service_items)}

          <div class="totals">
            <div class="section-title">금액 계산</div>
            ${(() => {
              const { totalSubtotal, totalTaxAmount, totalAmount } = calculateTotals();
              return `
                <div class="total-row">
                  <span>소계:</span>
                  <span>₹${totalSubtotal.toLocaleString()}</span>
                </div>
                <div class="total-row">
                  <span>세금:</span>
                  <span>₹${totalTaxAmount.toLocaleString()}</span>
                </div>
                <div class="total-row grand-total">
                  <span>총액:</span>
                  <span>₹${totalAmount.toLocaleString()}</span>
                </div>
              `;
            })()}
          </div>

          <div class="bank-details">
            <div class="section-title">BANK DETAILS</div>
            <div style="font-size: 9px; line-height: 1.3;">
              BANK: ${currentCompany?.bank_name || 'ICICI Bank, Bangalore MG Road'}<br>
              SWIFT CODE: ${currentCompany?.swift_code || 'N/A'}<br>
              IFSC CODE: ${currentCompany?.ifsc_code || 'ICIC0000002'}<br>
              AC NUMBER: ${currentCompany?.account_number || '000205032720'}<br>
              AC HOLDER: ${currentCompany?.account_holder || currentCompany?.name}
            </div>
          </div>

          <div class="notes">
            <div class="section-title">비고</div>
            <div style="font-size: 9px; line-height: 1.3; border: 1px solid #ddd; padding: 6px; min-height: 30px;">
              ${invoiceFormData.notes}
            </div>
          </div>

          <div class="signature-section">
            <div class="signature">
              <div style="margin-bottom: 8px; font-weight: bold; font-size: 10px;">Authorized Signature</div>
              ${currentCompany?.signature_url ? `<img src="${currentCompany.signature_url}" alt="Signature" style="max-width: 120px; max-height: 60px; object-fit: contain;">` : '<div style="width: 120px; height: 60px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999;">Signature</div>'}
            </div>
            <div class="stamp">
              <div style="margin-bottom: 8px; font-weight: bold; font-size: 10px;">Company Stamp</div>
              ${currentCompany?.stamp_url ? `<img src="${currentCompany.stamp_url}" alt="Stamp" style="max-width: 120px; max-height: 60px; object-fit: contain;">` : '<div style="width: 120px; height: 60px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999;">Stamp</div>'}
            </div>
          </div>
        </body>
        </html>
      `;

      // 새 창에서 인쇄용 HTML 열기
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // 인쇄 다이얼로그 열기
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } catch (error) {
      console.error('인쇄 중 오류:', error);
      setSnackbarMessage('An error occurred while printing.');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    console.log('=== 로딩 상태 표시 ===');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, fontSize: '0.85rem' }}>
          Loading invoice list...
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem', color: '#666' }}>
          Token: {localStorage.getItem('token') ? 'Exists' : 'Not found'} | 
          User: {localStorage.getItem('user') ? 'Exists' : 'Not found'}
        </Typography>
      </Box>
    );
  }

  console.log('=== InvoicePage 렌더링 ===');
  console.log('invoices 길이:', invoices.length);
  console.log('companies 길이:', companies.length);
  console.log('error:', error);
  console.log('loading:', loading);

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReceiptIcon sx={{ fontSize: '1.5rem', color: '#1976d2' }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5 }}>
            Invoice Management
          </Typography>
        </Box>

      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="invoice management tabs">
          <Tab label="Invoice List" />
          <Tab label="Regular Invoice Creation" />
          <Tab label="E-Invoice Creation" />
          <Tab label="Proforma Invoice Creation" />
        </Tabs>
      </Box>

      {/* 탭 내용 */}
      {activeTab === 0 && (
        <>
          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }}>
              {error}
              <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'inherit' }}>
                  Debug Info: Token {localStorage.getItem('token') ? 'Exists' : 'Not found'} | 
                  User {localStorage.getItem('user') ? 'Exists' : 'Not found'}
                </Typography>
              </Box>
            </Alert>
          )}

          {/* 필터 및 검색 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search by invoice number or description..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '1rem', color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.75rem',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                }
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
              <Select
                value={filterStatus}
                label="상태"
                onChange={handleStatusFilterChange}
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
                <MenuItem value="draft" sx={{ fontSize: '0.75rem' }}>Draft</MenuItem>
                <MenuItem value="sent" sx={{ fontSize: '0.75rem' }}>Sent</MenuItem>
                <MenuItem value="paid" sx={{ fontSize: '0.75rem' }}>Paid</MenuItem>
                <MenuItem value="overdue" sx={{ fontSize: '0.75rem' }}>Overdue</MenuItem>
                <MenuItem value="cancelled" sx={{ fontSize: '0.75rem' }}>Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={handleTypeFilterChange}
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
                <MenuItem value="regular" sx={{ fontSize: '0.75rem' }}>Regular Invoice</MenuItem>
                <MenuItem value="e-invoice" sx={{ fontSize: '0.75rem' }}>E-Invoice</MenuItem>
                <MenuItem value="lotus" sx={{ fontSize: '0.75rem' }}>Lotus Invoice</MenuItem>
                <MenuItem value="proforma" sx={{ fontSize: '0.75rem' }}>Proforma Invoice</MenuItem>
              </Select>
            </FormControl>

            <IconButton 
              onClick={fetchInvoices} 
              sx={{ 
                ml: 'auto',
                p: 1,
                color: '#666',
                '&:hover': { 
                  color: '#1976d2', 
                  backgroundColor: 'rgba(25, 118, 210, 0.1)' 
                }
              }}
            >
              <RefreshIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* 인보이스 테이블 */}
      <Card sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '0.85rem', letterSpacing: 0.5, p: 2, pb: 0 }}>
            Invoice List
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', borderRadius: 0, border: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ border: 0, background: '#f7fafd' }}>
                  <TableCell 
                    sx={{ 
                      border: 0, 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      background: 'none', 
                      py: 0.7, 
                      color: '#222',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e9f4ff' }
                    }}
                    onClick={() => handleSort('invoice_number')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Invoice No.
                      {renderSortIcon('invoice_number')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      border: 0, 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      background: 'none', 
                      py: 0.7, 
                      color: '#222',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e9f4ff' }
                    }}
                    onClick={() => handleSort('invoice_type')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Type
                      {renderSortIcon('invoice_type')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      border: 0, 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      background: 'none', 
                      py: 0.7, 
                      color: '#222',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e9f4ff' }
                    }}
                    onClick={() => handleSort('customer')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Customer
                      {renderSortIcon('customer')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      border: 0, 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      background: 'none', 
                      py: 0.7, 
                      color: '#222',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e9f4ff' }
                    }}
                    onClick={() => handleSort('amount')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Amount
                      {renderSortIcon('amount')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      border: 0, 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      background: 'none', 
                      py: 0.7, 
                      color: '#222',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e9f4ff' }
                    }}
                    onClick={() => handleSort('status')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Status
                      {renderSortIcon('status')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      border: 0, 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      background: 'none', 
                      py: 0.7, 
                      color: '#222',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e9f4ff' }
                    }}
                    onClick={() => handleSort('issue_date')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Issue Date
                      {renderSortIcon('issue_date')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      border: 0, 
                      fontWeight: 700, 
                      fontSize: '0.8rem', 
                      background: 'none', 
                      py: 0.7, 
                      color: '#222',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e9f4ff' }
                    }}
                    onClick={() => handleSort('due_date')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Due Date
                      {renderSortIcon('due_date')}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ border: 0, fontWeight: 700, fontSize: '0.8rem', background: 'none', py: 0.7, color: '#222' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    hover 
                    onClick={() => handleViewInvoice(invoice)}
                    sx={{ cursor: 'pointer', border: 0 }}
                  >
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{invoice.invoice_number}</TableCell>
                    <TableCell sx={{ border: 0, py: 0.7 }}>
                      <Chip
                        label={getTypeLabel(invoice.invoice_type)}
                        color={getTypeColor(invoice.invoice_type) as any}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>{invoice.partnerCompany?.name || '-'}</TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      {invoice.total_amount.toLocaleString()} {invoice.currency}
                    </TableCell>
                    <TableCell sx={{ border: 0, py: 0.7 }}>
                      <Chip
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      {new Date(invoice.invoice_date).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell sx={{ border: 0, fontSize: '0.75rem', py: 0.7, color: '#6b7a90' }}>
                      {new Date(invoice.due_date).toLocaleDateString('ko-KR')}
                    </TableCell>
                                         <TableCell sx={{ border: 0, py: 0.7 }}>
                       <Box sx={{ display: 'flex', gap: 1 }}>
                         <Tooltip title="Generate Form">
                           <IconButton
                             size="small"
                             onClick={(e) => { e.stopPropagation(); generateInvoiceForm(invoice); }}
                             sx={{ p: 0.5, color: '#666', '&:hover': { color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.1)' } }}
                           >
                             <ReceiptIcon fontSize="small" />
                           </IconButton>
                         </Tooltip>
                         <Tooltip title="View Details">
                           <IconButton
                             size="small"
                             onClick={(e) => { e.stopPropagation(); handleViewInvoice(invoice); }}
                             sx={{ p: 0.5, color: '#666', '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}
                           >
                             <ViewIcon fontSize="small" />
                           </IconButton>
                         </Tooltip>
                         {!!invoiceMenuPermission.can_update && (
                           <Tooltip title="Edit">
                             <IconButton
                               size="small"
                               onClick={(e) => { e.stopPropagation(); handleEditInvoice(invoice); }}
                               sx={{ p: 0.5, color: '#666', '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}
                             >
                               <EditIcon fontSize="small" />
                             </IconButton>
                           </Tooltip>
                         )}
                         {!!invoiceMenuPermission.can_delete && (
                           <Tooltip title="Delete">
                             <IconButton
                               size="small"
                               onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); }}
                               sx={{ p: 0.5, color: '#666', '&:hover': { color: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.1)' } }}
                             >
                               <DeleteIcon fontSize="small" />
                             </IconButton>
                           </Tooltip>
                         )}
                       </Box>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
                     {paginatedInvoices.length === 0 ? (
             <Box sx={{ p: 4, textAlign: 'center' }}>
               <Typography variant="h6" sx={{ fontSize: '0.85rem', color: '#666', mb: 1 }}>
                 No invoices found
               </Typography>
               <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#999' }}>
                 Create a new invoice to get started
               </Typography>
             </Box>
           ) : (
             <TablePagination
               rowsPerPageOptions={[5, 10, 25]}
               component="div"
               count={sortedInvoices.length}
               rowsPerPage={rowsPerPage}
               page={page}
               onPageChange={handleChangePage}
               onRowsPerPageChange={handleChangeRowsPerPage}
               labelRowsPerPage="Rows per page:"
               labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
               sx={{
                 '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                   fontSize: '0.75rem'
                 }
               }}
             />
           )}
        </CardContent>
      </Card>

      {/* 인보이스 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Invoice Type</InputLabel>
                  <Select
                    value={formData.invoice_type}
                    label="Invoice Type"
                    onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value as any })}
                    sx={{ 
                      '& .MuiSelect-select': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  >
                    <MenuItem value="regular" sx={{ fontSize: '0.75rem' }}>Regular Invoice</MenuItem>
                    <MenuItem value="e-invoice" sx={{ fontSize: '0.75rem' }}>E-Invoice</MenuItem>
                    <MenuItem value="proforma" sx={{ fontSize: '0.75rem' }}>Proforma Invoice</MenuItem>
                    <MenuItem 
                      value="lotus" 
                      sx={{ fontSize: '0.75rem' }}
                      disabled={!canUseLotusInvoice()}
                    >
                      Lotus Invoice {!canUseLotusInvoice() && '(Minsub Ventures Private Limited only)'}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Customer</InputLabel>
                  <Select
                    value={formData.partner_company_id.toString()}
                    label="Customer"
                    onChange={(e) => setFormData({ ...formData, partner_company_id: parseInt(e.target.value) })}
                    sx={{ 
                      '& .MuiSelect-select': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  >
                    {companies.map(company => (
                      <MenuItem key={company.company_id} value={company.company_id.toString()} sx={{ fontSize: '0.75rem' }}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

                             <Grid item xs={12} sm={6}>
                 <TextField
                   fullWidth
                   label="Currency"
                   value="INR"
                   InputProps={{ readOnly: true }}
                   sx={{ 
                     mb: 2, 
                     '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                     '& .MuiInputBase-input': { fontSize: '0.75rem' },
                     '& .MuiOutlinedInput-root': {
                       borderRadius: 2,
                       backgroundColor: '#f5f5f5',
                       '& fieldset': {
                         borderColor: '#e0e0e0',
                       },
                     }
                   }}
                 />
               </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Issue Date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due Date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Subtotal"
                  value={formData.subtotal}
                  onChange={(e) => {
                    const subtotal = parseFloat(e.target.value) || 0;
                    const taxAmount = formData.tax_amount;
                    setFormData({ 
                      ...formData, 
                      subtotal,
                      total_amount: subtotal + taxAmount
                    });
                  }}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tax"
                  value={formData.tax_amount}
                  onChange={(e) => {
                    const taxAmount = parseFloat(e.target.value) || 0;
                    const subtotal = formData.subtotal;
                    setFormData({ 
                      ...formData, 
                      tax_amount: taxAmount,
                      total_amount: subtotal + taxAmount
                    });
                  }}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Amount"
                  value={formData.total_amount}
                  InputProps={{ readOnly: true }}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f5f5f5',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  sx={{ 
                    mb: 2, 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                    '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ 
              fontSize: '0.75rem',
              textTransform: 'none',
              borderRadius: 2,
              py: 0.8,
              px: 2
            }}
          >
            Cancel
          </Button>
          {!!(invoiceMenuPermission.can_create || invoiceMenuPermission.can_update) && (
            <Button 
              onClick={handleSaveInvoice} 
              variant="contained" 
              sx={{ 
                fontSize: '0.75rem',
                textTransform: 'none',
                boxShadow: 'none',
                borderRadius: 2,
                py: 0.8,
                px: 2,
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#145ea8' }
              }}
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 인보이스 상세보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon sx={{ fontSize: '1.2rem', color: '#1976d2' }} />
          Invoice Details
        </DialogTitle>
        <DialogContent>
          {viewingInvoice && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>
                    {viewingInvoice.invoice_number}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={getTypeLabel(viewingInvoice.invoice_type)}
                      color={getTypeColor(viewingInvoice.invoice_type) as any}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    <Chip
                      label={getStatusLabel(viewingInvoice.status)}
                      color={getStatusColor(viewingInvoice.status) as any}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>
                    {viewingInvoice.total_amount.toLocaleString()} {viewingInvoice.currency}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                    Customer
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                    {viewingInvoice.partnerCompany?.name || '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                    Issue Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                    {new Date(viewingInvoice.invoice_date).toLocaleDateString('ko-KR')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                    Due Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                    {new Date(viewingInvoice.due_date).toLocaleDateString('ko-KR')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                    Created By
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                    {viewingInvoice.creator?.username || '-'}
                  </Typography>
                </Grid>

                {viewingInvoice.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                      {viewingInvoice.description}
                    </Typography>
                  </Grid>
                )}

                {viewingInvoice.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666' }}>
                      {viewingInvoice.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setViewDialogOpen(false)} 
            sx={{ fontSize: '0.75rem' }}
          >
            Close
          </Button>
          {viewingInvoice && (
            <Button 
              onClick={() => {
                setViewDialogOpen(false);
                handleEditInvoice(viewingInvoice);
              }} 
              variant="contained" 
              sx={{ fontSize: '0.75rem' }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 인보이스 양식 다이얼로그 */}
      <Dialog 
        open={invoiceFormDialogOpen} 
        onClose={() => setInvoiceFormDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1, textAlign: 'center' }}>
          {getInvoiceTitle(invoiceFormData.invoice_type)} - {invoiceFormData.invoice_type === 'proforma' ? 'Proforma' : 'Regular'} Invoice Creation
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
            {/* 헤더 섹션 - 편집 가능 */}
            <Box sx={{ textAlign: 'center', mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={invoiceFormData.header_info.company_name}
                onChange={(e) => setInvoiceFormData({
                  ...invoiceFormData,
                  header_info: { ...invoiceFormData.header_info, company_name: e.target.value }
                })}
                sx={{ 
                  mb: 1,
                  '& .MuiInputBase-input': { 
                    fontSize: '1.2rem', // 복구: 1rem → 1.2rem
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    textAlign: 'center'
                  } 
                }}
                placeholder="Company Name"
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                value={invoiceFormData.header_info.address}
                onChange={(e) => setInvoiceFormData({
                  ...invoiceFormData,
                  header_info: { ...invoiceFormData.header_info, address: e.target.value }
                })}
                sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                placeholder="Address"
              />
              <Grid container spacing={1} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    value={invoiceFormData.header_info.gstin}
                    onChange={(e) => setInvoiceFormData({
                      ...invoiceFormData,
                      header_info: { ...invoiceFormData.header_info, gstin: e.target.value }
                    })}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                    placeholder="GSTIN"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    value={invoiceFormData.header_info.cin}
                    onChange={(e) => setInvoiceFormData({
                      ...invoiceFormData,
                      header_info: { ...invoiceFormData.header_info, cin: e.target.value }
                    })}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                    placeholder="CIN"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={1} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    value={invoiceFormData.header_info.email}
                    onChange={(e) => setInvoiceFormData({
                      ...invoiceFormData,
                      header_info: { ...invoiceFormData.header_info, email: e.target.value }
                    })}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                    placeholder="Email"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    value={invoiceFormData.header_info.website}
                    onChange={(e) => setInvoiceFormData({
                      ...invoiceFormData,
                      header_info: { ...invoiceFormData.header_info, website: e.target.value }
                    })}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                    placeholder="Website"
                  />
                </Grid>
              </Grid>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f', mt: 2 }}>
                {getInvoiceTitle(invoiceFormData.invoice_type)}
              </Typography>
            </Box>

            {/* 인보이스 정보 섹션 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {getInvoiceNumberLabel(invoiceFormData.invoice_type)}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={invoiceFormData.invoice_number}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoice_number: e.target.value })}
                    disabled={invoiceFormData.invoice_type === 'proforma'}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                  />
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}>
                    DATE OF ISSUE
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={invoiceFormData.invoice_date}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoice_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Terms & Condition
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    value={invoiceFormData.terms_conditions}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, terms_conditions: e.target.value })}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                    placeholder="Payment terms and conditions..."
                  />
                </Box>
              </Grid>
            </Grid>

            {/* 공급자 및 고객 정보 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Supplier
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {currentCompany?.name || 'Company Name'}<br/>
                    {currentCompany?.address || 'Address'}<br/>
                    GSTIN: {currentCompany?.gst1 || 'N/A'}<br/>
                    PAN: {currentCompany?.pan || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Customer (Billing)
                  </Typography>
                  
                  {/* 고객 입력 방식 선택 */}
                  <Box sx={{ mb: 2 }}>
                    <FormControl component="fieldset">
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="radio"
                            id="existing-customer"
                            name="customer-type"
                            checked={invoiceFormData.customer_input_type === 'existing'}
                            onChange={() => setInvoiceFormData({ 
                              ...invoiceFormData, 
                              customer_input_type: 'existing',
                              manual_customer: { name: '', address: '', gst: '' }
                            })}
                          />
                          <Typography component="label" htmlFor="existing-customer" sx={{ ml: 1, fontSize: '0.7rem', cursor: 'pointer' }}>
                            기존 고객 선택
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="radio"
                            id="manual-customer"
                            name="customer-type"
                            checked={invoiceFormData.customer_input_type === 'manual'}
                            onChange={() => setInvoiceFormData({ 
                              ...invoiceFormData, 
                              customer_input_type: 'manual'
                            })}
                          />
                          <Typography component="label" htmlFor="manual-customer" sx={{ ml: 1, fontSize: '0.7rem', cursor: 'pointer' }}>
                            신규 고객 직접 입력
                          </Typography>
                        </Box>
                      </Box>
                    </FormControl>
                  </Box>

                  {/* 기존 고객 선택 */}
                  {invoiceFormData.customer_input_type === 'existing' && (
                    <>
                      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                        <InputLabel sx={{ fontSize: '0.65rem' }}>Select Customer</InputLabel>
                        <Select
                          value={invoiceFormData.partner_company_id.toString()}
                          label="Select Customer"
                          onChange={(e) => setInvoiceFormData({ ...invoiceFormData, partner_company_id: parseInt(e.target.value) })}
                          sx={{ '& .MuiSelect-select': { fontSize: '0.65rem' } }}
                        >
                          {companies.map(company => (
                            <MenuItem key={company.company_id} value={company.company_id.toString()} sx={{ fontSize: '0.65rem' }}>
                              {company.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                        Company name: {companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.name || 'N/A'}<br/>
                        Address: {companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.address || 'N/A'}<br/>
                        GST NO: {companies.find(c => c.company_id === invoiceFormData.partner_company_id)?.gst1 || 'N/A'}
                      </Typography>
                    </>
                  )}

                  {/* 신규 고객 직접 입력 */}
                  {invoiceFormData.customer_input_type === 'manual' && (
                    <>
                      <TextField
                        fullWidth
                        size="small"
                        label="Company Name"
                        value={invoiceFormData.manual_customer.name}
                        onChange={(e) => setInvoiceFormData({ 
                          ...invoiceFormData, 
                          manual_customer: { 
                            ...invoiceFormData.manual_customer, 
                            name: e.target.value 
                          }
                        })}
                        sx={{ mb: 1, '& .MuiInputLabel-root': { fontSize: '0.65rem' }, '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Address"
                        multiline
                        rows={2}
                        value={invoiceFormData.manual_customer.address}
                        onChange={(e) => setInvoiceFormData({ 
                          ...invoiceFormData, 
                          manual_customer: { 
                            ...invoiceFormData.manual_customer, 
                            address: e.target.value 
                          }
                        })}
                        sx={{ mb: 1, '& .MuiInputLabel-root': { fontSize: '0.65rem' }, '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="GST Number (Optional)"
                        value={invoiceFormData.manual_customer.gst}
                        onChange={(e) => setInvoiceFormData({ 
                          ...invoiceFormData, 
                          manual_customer: { 
                            ...invoiceFormData.manual_customer, 
                            gst: e.target.value 
                          }
                        })}
                        sx={{ mb: 1, '& .MuiInputLabel-root': { fontSize: '0.65rem' }, '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#666' }}>
                        Company name: {invoiceFormData.manual_customer.name || 'N/A'}<br/>
                        Address: {invoiceFormData.manual_customer.address || 'N/A'}<br/>
                        GST NO: {invoiceFormData.manual_customer.gst || 'N/A'}
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* 상품/서비스 테이블 */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Product/Service Information
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={addServiceItem}
                  sx={{ fontSize: '0.65rem' }}
                >
                  Add Service Item
                </Button>
              </Box>
              <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>No.</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>Description</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>HSN Code</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>IGST (%)</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>CGST (%)</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>SGST (%)</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>Qty</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>Unit Price (₹)</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>Amount (₹)</TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 'bold', py: 1 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceFormData.service_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={item.description}
                            onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                            placeholder="Service Description"
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={item.hsn_code}
                            onChange={(e) => updateServiceItem(index, 'hsn_code', e.target.value)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.igst_rate}
                            onChange={(e) => updateServiceItem(index, 'igst_rate', parseFloat(e.target.value) || 0)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.cgst_rate}
                            onChange={(e) => updateServiceItem(index, 'cgst_rate', parseFloat(e.target.value) || 0)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.sgst_rate}
                            onChange={(e) => updateServiceItem(index, 'sgst_rate', parseFloat(e.target.value) || 0)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateServiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateServiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1, fontWeight: 'bold' }}>
                          ₹{item.subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          {invoiceFormData.service_items.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => removeServiceItem(index)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>

            {/* 총액 계산 */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                금액 계산
              </Typography>
              {(() => {
                const { totalSubtotal, totalTaxAmount, totalAmount } = calculateTotals();
                return (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                        소계: ₹{totalSubtotal.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                        세금: ₹{totalTaxAmount.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                        총액: ₹{totalAmount.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })()}
            </Box>

            {/* 은행 정보 */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                BANK DETAILS
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.65rem', lineHeight: 1.4 }}>
                BANK: {currentCompany?.bank_name || 'ICICI Bank, Bangalore MG Road'}<br/>
                SWIFT CODE: {currentCompany?.swift_code || 'N/A'}<br/>
                IFSC CODE: {currentCompany?.ifsc_code || 'ICIC0000002'}<br/>
                AC NUMBER: {currentCompany?.account_number || '000205032720'}<br/>
                AC HOLDER: {currentCompany?.account_holder || currentCompany?.name}
              </Typography>
            </Box>

            {/* 비고 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                비고
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={invoiceFormData.notes}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem' } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={generatePDF}
              variant="outlined"
              startIcon={<PdfIcon />}
              sx={{ 
                fontSize: '0.65rem',
                textTransform: 'none',
                borderRadius: 2,
                py: 0.8,
                px: 2,
                borderColor: '#d32f2f',
                color: '#d32f2f',
                '&:hover': { 
                  borderColor: '#b71c1c',
                  backgroundColor: 'rgba(211, 47, 47, 0.04)'
                }
              }}
            >
              Save as PDF
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outlined"
              startIcon={<PrintIcon />}
              sx={{ 
                fontSize: '0.65rem',
                textTransform: 'none',
                borderRadius: 2,
                py: 0.8,
                px: 2,
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': { 
                  borderColor: '#145ea8',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Print
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={() => setInvoiceFormDialogOpen(false)} 
              sx={{ 
                fontSize: '0.65rem',
                textTransform: 'none',
                borderRadius: 2,
                py: 0.8,
                px: 2
              }}
            >
              Cancel
            </Button>
            {!!(invoiceMenuPermission.can_create || invoiceMenuPermission.can_update) && (
              <Button 
                onClick={handleSaveInvoiceForm} 
                variant="contained" 
                sx={{ 
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  borderRadius: 2,
                  py: 0.8,
                  px: 2,
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#145ea8' }
                }}
              >
                Save Invoice
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

          {/* 성공 메시지 Snackbar */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSnackbarOpen(false)} 
              severity="success" 
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}

      {/* Regular Invoice 인라인 생성 탭 */}
      {activeTab === 1 && (
        <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #e3eafc', boxShadow: '0 4px 24px rgba(25, 118, 210, 0.08)' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '0.95rem' }}>
              Regular Invoice Creation
            </Typography>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Invoice Type</InputLabel>
                    <Select
                      value={formData.invoice_type}
                      label="Invoice Type"
                      onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value as any })}
                      sx={{ 
                        '& .MuiSelect-select': { fontSize: '0.75rem' },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                        }
                      }}
                    >
                      <MenuItem value="regular" sx={{ fontSize: '0.75rem' }}>Regular Invoice</MenuItem>
                      <MenuItem value="e-invoice" sx={{ fontSize: '0.75rem' }}>E-Invoice</MenuItem>
                      <MenuItem value="proforma" sx={{ fontSize: '0.75rem' }}>Proforma Invoice</MenuItem>
                      <MenuItem value="lotus" sx={{ fontSize: '0.75rem' }} disabled={!canUseLotusInvoice()}>
                        Lotus Invoice {!canUseLotusInvoice() && '(Minsub Ventures Private Limited only)'}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Customer</InputLabel>
                    <Select
                      value={formData.partner_company_id.toString()}
                      label="Customer"
                      onChange={(e) => setFormData({ ...formData, partner_company_id: parseInt(e.target.value) })}
                      sx={{ 
                        '& .MuiSelect-select': { fontSize: '0.75rem' },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                        }
                      }}
                    >
                      {companies.map(company => (
                        <MenuItem key={company.company_id} value={company.company_id.toString()} sx={{ fontSize: '0.75rem' }}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Currency"
                    value="INR"
                    InputProps={{ readOnly: true }}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f5f5f5',
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Issue Date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Due Date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Subtotal"
                    value={formData.subtotal}
                    onChange={(e) => {
                      const subtotal = parseFloat(e.target.value) || 0;
                      const taxAmount = formData.tax_amount;
                      setFormData({ 
                        ...formData, 
                        subtotal,
                        total_amount: subtotal + taxAmount
                      });
                    }}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tax"
                    value={formData.tax_amount}
                    onChange={(e) => {
                      const taxAmount = parseFloat(e.target.value) || 0;
                      const subtotal = formData.subtotal;
                      setFormData({ 
                        ...formData, 
                        tax_amount: taxAmount,
                        total_amount: subtotal + taxAmount
                      });
                    }}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total Amount"
                    value={formData.total_amount}
                    InputProps={{ readOnly: true }}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f5f5f5',
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    sx={{ 
                      mb: 2, 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' }, 
                      '& .MuiInputBase-input': { fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2',
                        },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button 
                onClick={() => {
                  // 간단 초기화
                  setFormData({
                    invoice_number: '',
                    invoice_type: 'regular',
                    partner_company_id: currentUser?.company_id || 1,
                    invoice_date: new Date().toISOString().split('T')[0],
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    subtotal: 0,
                    tax_amount: 0,
                    total_amount: 0,
                    currency: 'INR',
                    description: '',
                    notes: ''
                  });
                }} 
                sx={{ 
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 0.8,
                  px: 2
                }}
              >
                Reset
              </Button>
              {!!(invoiceMenuPermission.can_create || invoiceMenuPermission.can_update) && (
                <Button 
                  onClick={handleSaveInvoice} 
                  variant="contained" 
                  sx={{ 
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    boxShadow: 'none',
                    borderRadius: 2,
                    py: 0.8,
                    px: 2,
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#145ea8' }
                  }}
                >
                  Save Invoice
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* E-Invoice 생성 탭 */}
      {activeTab === 2 && (
        <EInvoicePage />
      )}

      {/* Proforma Invoice 생성 탭 */}
      {activeTab === 3 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Proforma Invoice Creation
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Proforma 인보이스 생성 기능을 여기에 구현할 예정입니다.
          </Typography>
          {!!invoiceMenuPermission.can_create && (
            <Button
              variant="contained"
              startIcon={<ReceiptIcon />}
              onClick={handleCreateProformaInvoice}
              sx={{ 
                fontSize: '0.75rem', 
                textTransform: 'none', 
                boxShadow: 'none', 
                borderRadius: 2, 
                py: 0.8, 
                px: 2, 
                bgcolor: '#9c27b0', 
                '&:hover': { bgcolor: '#7b1fa2' } 
              }}
            >
              Create Proforma Invoice
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default InvoicePage; 