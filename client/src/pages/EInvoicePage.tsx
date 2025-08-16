import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

// E-Invoice JSON 스키마에 맞는 인터페이스 정의
interface EInvoiceData {
  Version: string;
  TranDtls: {
    TaxSch: string;
    SupTyp: string;
    RegRev: string;
    EcmGstin: string | null;
    IgstOnIntra: string | null;
  };
  DocDtls: {
    Typ: string;
    No: string;
    Dt: string;
  };
  SellerDtls: {
    Gstin: string;
    LglNm: string;
    TrdNm?: string;
    Addr1: string;
    Addr2?: string;
    Loc: string;
    Pin: number;
    Stcd: string;
    Ph?: string;
    Em?: string;
  };
  BuyerDtls: {
    Gstin?: string;
    LglNm: string;
    TrdNm?: string;
    Pos: string;
    Addr1: string;
    Addr2?: string;
    Loc: string;
    Pin: number;
    Stcd: string;
    Ph?: string;
    Em?: string;
  };
  DispDtls?: {
    Nm: string;
    Addr1: string;
    Addr2?: string;
    Loc: string;
    Pin: number;
    Stcd: string;
  };
  ShipDtls?: {
    Gstin?: string;
    LglNm: string;
    TrdNm?: string;
    Addr1: string;
    Addr2?: string;
    Loc: string;
    Pin: number;
    Stcd: string;
  };
  ItemList: Array<{
    SlNo: string;
    PrdDesc: string;
    IsServc: string;
    HsnCd: string;
    Barcde?: string;
    Qty?: number;
    FreeQty?: number;
    Unit?: string;
    UnitPrice: number;
    TotAmt: number;
    Discount?: number;
    PreTaxVal: number;
    AssAmt: number;
    GstRt: number;
    IgstAmt?: number;
    CgstAmt?: number;
    SgstAmt?: number;
    CesRt?: number;
    CesAmt?: number;
    CesNonAdvlAmt?: number;
    StateCesRt?: number;
    StateCesAmt?: number;
    StateCesNonAdvlAmt?: number;
    OthChrg?: number;
    TotItemVal: number;
    OrdLineRef?: string;
    OrgCntry?: string;
    PrdSlNo?: string;
    BchDtls?: {
      Nm: string;
      ExpDt?: string;
      WrDt?: string;
    };
    AttribDtls?: Array<{
      Nm: string;
      Val: string;
    }>;
  }>;
  ValDtls: {
    AssVal: number;
    CgstVal?: number;
    SgstVal?: number;
    IgstVal?: number;
    CesVal?: number;
    StCesVal?: number;
    Discount?: number;
    OthChrg?: number;
    RndOffAmt?: number;
    TotInvVal: number;
    TotInvValFc?: number;
  };
  PayDtls?: {
    Nm?: string;
    AccDet?: string;
    Mode?: string;
    FinInsBr?: string;
    PayTerm?: string;
    PayInstr?: string;
    CrTrn?: string;
    DirDr?: string;
    CrDay?: number;
    PaidAmt?: number;
    PaymtDue?: number;
  };
  RefDtls?: {
    InvRm?: string;
    DocPerdDtls?: {
      InvStDt: string;
      InvEndDt: string;
    };
    PrecDocDtls?: Array<{
      InvNo: string;
      InvDt: string;
      OthRefNo?: string;
    }>;
    ContrDtls?: Array<{
      RecAdvRefr?: string;
      RecAdvDt?: string;
      TendRefr?: string;
      ContrRefr?: string;
      ExtRefr?: string;
      ProjRefr?: string;
      PORefr?: string;
      PORefDt?: string;
    }>;
  };
  AddlDocDtls?: Array<{
    Url?: string;
    Docs?: string;
    Info?: string;
  }>;
  ExpDtls?: {
    ShipBNo?: string;
    ShipBDt?: string;
    Port?: string;
    RefClm?: string;
    ForCur?: string;
    CntCode?: string;
    ExpDuty?: number;
  };
  EwbDtls?: {
    TransId?: string;
    TransName?: string;
    TransMode?: string;
    Distance?: number;
    TransDocNo?: string;
    TransDocDt?: string;
    VehNo?: string;
    VehType?: string;
    TransAddr1?: string;
    TransAddr2?: string;
    TransLoc?: string;
    TransPin?: number;
    TransStcd?: string;
  };
}

interface Company {
  company_id: number;
  name: string;
  address?: string;
  gst1?: string;
  pan?: string;
  email?: string;
  phone?: string;
}

interface ItemFormData {
  SlNo: string;
  PrdDesc: string;
  IsServc: string;
  HsnCd: string;
  Qty: number;
  Unit: string;
  UnitPrice: number;
  GstRt: number;
  Discount: number;
}

const EInvoicePage: React.FC = () => {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' });
  
  // E-Invoice 폼 데이터
  const [invoiceData, setInvoiceData] = useState<EInvoiceData>({
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      EcmGstin: null,
      IgstOnIntra: null
    },
    DocDtls: {
      Typ: "INV",
      No: "",
      Dt: new Date().toISOString().split('T')[0].split('-').reverse().join('/')
    },
    SellerDtls: {
      Gstin: "",
      LglNm: "",
      Addr1: "",
      Loc: "",
      Pin: 0,
      Stcd: ""
    },
    BuyerDtls: {
      LglNm: "",
      Pos: "",
      Addr1: "",
      Loc: "",
      Pin: 0,
      Stcd: ""
    },
    ItemList: [],
    ValDtls: {
      AssVal: 0,
      TotInvVal: 0
    }
  });

  const [currentItem, setCurrentItem] = useState<ItemFormData>({
    SlNo: "1",
    PrdDesc: "",
    IsServc: "N",
    HsnCd: "",
    Qty: 1,
    Unit: "NOS",
    UnitPrice: 0,
    GstRt: 18,
    Discount: 0
  });

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // State codes for India
  const stateCodes = [
    { code: "01", name: "Jammu and Kashmir" },
    { code: "02", name: "Himachal Pradesh" },
    { code: "03", name: "Punjab" },
    { code: "04", name: "Chandigarh" },
    { code: "05", name: "Uttarakhand" },
    { code: "06", name: "Haryana" },
    { code: "07", name: "Delhi" },
    { code: "08", name: "Rajasthan" },
    { code: "09", name: "Uttar Pradesh" },
    { code: "10", name: "Bihar" },
    { code: "11", name: "Sikkim" },
    { code: "12", name: "Arunachal Pradesh" },
    { code: "13", name: "Nagaland" },
    { code: "14", name: "Manipur" },
    { code: "15", name: "Mizoram" },
    { code: "16", name: "Tripura" },
    { code: "17", name: "Meghalaya" },
    { code: "18", name: "Assam" },
    { code: "19", name: "West Bengal" },
    { code: "20", name: "Jharkhand" },
    { code: "21", name: "Odisha" },
    { code: "22", name: "Chhattisgarh" },
    { code: "23", name: "Madhya Pradesh" },
    { code: "24", name: "Gujarat" },
    { code: "25", name: "Daman and Diu" },
    { code: "26", name: "Dadra and Nagar Haveli" },
    { code: "27", name: "Maharashtra" },
    { code: "28", name: "Andhra Pradesh" },
    { code: "29", name: "Karnataka" },
    { code: "30", name: "Goa" },
    { code: "31", name: "Lakshadweep" },
    { code: "32", name: "Kerala" },
    { code: "33", name: "Tamil Nadu" },
    { code: "34", name: "Puducherry" },
    { code: "35", name: "Andaman and Nicobar Islands" },
    { code: "36", name: "Telangana" },
    { code: "37", name: "Andhra Pradesh (New)" },
    { code: "38", name: "Ladakh" }
  ];

  const supplyTypes = [
    { value: "B2B", label: "Business to Business" },
    { value: "SEZWP", label: "SEZ with payment" },
    { value: "SEZWOP", label: "SEZ without payment" },
    { value: "EXPWP", label: "Export with payment" },
    { value: "EXPWOP", label: "Export without payment" },
    { value: "DEXP", label: "Deemed Export" }
  ];

  const units = [
    "NOS", "KGS", "LTR", "MTR", "SQM", "CUM", "TON", "BOX", "PCS", "SET", "PAI", "DZN", "GRS", "UNT"
  ];

  useEffect(() => {
    // 사용자 정보 로드
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(userData);
    
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('회사 정보 로드 오류:', error);
    }
  };

  const calculateItemValues = (item: ItemFormData) => {
    const totalAmount = item.Qty * item.UnitPrice;
    const discountAmount = (totalAmount * item.Discount) / 100;
    const preTaxValue = totalAmount - discountAmount;
    const gstAmount = (preTaxValue * item.GstRt) / 100;
    const totalItemValue = preTaxValue + gstAmount;

    return {
      TotAmt: totalAmount,
      Discount: discountAmount,
      PreTaxVal: preTaxValue,
      AssAmt: preTaxValue,
      CgstAmt: item.GstRt / 2,
      SgstAmt: item.GstRt / 2,
      TotItemVal: totalItemValue
    };
  };

  const addItem = () => {
    const calculatedValues = calculateItemValues(currentItem);
    
    const newItem = {
      SlNo: currentItem.SlNo,
      PrdDesc: currentItem.PrdDesc,
      IsServc: currentItem.IsServc,
      HsnCd: currentItem.HsnCd,
      Qty: currentItem.Qty,
      Unit: currentItem.Unit,
      UnitPrice: currentItem.UnitPrice,
      GstRt: currentItem.GstRt,
      ...calculatedValues
    };

    const updatedItemList = [...invoiceData.ItemList, newItem];
    
    // 총합 계산
    const totalAssVal = updatedItemList.reduce((sum, item) => sum + item.AssAmt, 0);
    const totalCgstVal = updatedItemList.reduce((sum, item) => sum + (item.CgstAmt || 0), 0);
    const totalSgstVal = updatedItemList.reduce((sum, item) => sum + (item.SgstAmt || 0), 0);
    const totalInvVal = updatedItemList.reduce((sum, item) => sum + item.TotItemVal, 0);

    setInvoiceData(prev => ({
      ...prev,
      ItemList: updatedItemList,
      ValDtls: {
        ...prev.ValDtls,
        AssVal: totalAssVal,
        CgstVal: totalCgstVal,
        SgstVal: totalSgstVal,
        TotInvVal: totalInvVal
      }
    }));

    // 다음 아이템 번호로 리셋
    setCurrentItem({
      ...currentItem,
      SlNo: String(Number(currentItem.SlNo) + 1),
      PrdDesc: "",
      HsnCd: "",
      Qty: 1,
      UnitPrice: 0,
      Discount: 0
    });

    setItemDialogOpen(false);
  };

  const removeItem = (index: number) => {
    const updatedItemList = invoiceData.ItemList.filter((_, i) => i !== index);
    
    // 총합 재계산
    const totalAssVal = updatedItemList.reduce((sum, item) => sum + item.AssAmt, 0);
    const totalCgstVal = updatedItemList.reduce((sum, item) => sum + (item.CgstAmt || 0), 0);
    const totalSgstVal = updatedItemList.reduce((sum, item) => sum + (item.SgstAmt || 0), 0);
    const totalInvVal = updatedItemList.reduce((sum, item) => sum + item.TotItemVal, 0);

    setInvoiceData(prev => ({
      ...prev,
      ItemList: updatedItemList,
      ValDtls: {
        ...prev.ValDtls,
        AssVal: totalAssVal,
        CgstVal: totalCgstVal,
        SgstVal: totalSgstVal,
        TotInvVal: totalInvVal
      }
    }));
  };

  const generateIRN = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // E-Invoice API 호출 (실제 환경에서는 GST 포털 API 연동)
      const response = await fetch('/api/e-invoice/generate-irn', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbar({
          open: true,
          message: `IRN 생성 성공: ${result.irn}`,
          severity: 'success'
        });
      } else {
        throw new Error('IRN 생성 실패');
      }
    } catch (error) {
      console.error('IRN 생성 오류:', error);
      setSnackbar({
        open: true,
        message: 'IRN 생성 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveInvoice = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/e-invoice/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...invoiceData,
          created_by: currentUser?.id
        })
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'E-Invoice가 저장되었습니다.',
          severity: 'success'
        });
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setSnackbar({
        open: true,
        message: '저장 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧾 E-Invoice - Regular Invoice Creation
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📋 Document Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={invoiceData.DocDtls.No}
                onChange={(e) => setInvoiceData(prev => ({
                  ...prev,
                  DocDtls: { ...prev.DocDtls, No: e.target.value }
                }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Invoice Date"
                type="date"
                value={invoiceData.DocDtls.Dt.split('/').reverse().join('-')}
                onChange={(e) => setInvoiceData(prev => ({
                  ...prev,
                  DocDtls: { ...prev.DocDtls, Dt: e.target.value.split('-').reverse().join('/') }
                }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Supply Type</InputLabel>
                <Select
                  value={invoiceData.TranDtls.SupTyp}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    TranDtls: { ...prev.TranDtls, SupTyp: e.target.value }
                  }))}
                >
                  {supplyTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Seller Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🏢 Seller Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="GSTIN"
                    value={invoiceData.SellerDtls.Gstin}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      SellerDtls: { ...prev.SellerDtls, Gstin: e.target.value }
                    }))}
                    placeholder="22AAAAA0000A1Z5"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Legal Name"
                    value={invoiceData.SellerDtls.LglNm}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      SellerDtls: { ...prev.SellerDtls, LglNm: e.target.value }
                    }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={invoiceData.SellerDtls.Addr1}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      SellerDtls: { ...prev.SellerDtls, Addr1: e.target.value }
                    }))}
                    multiline
                    rows={2}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={invoiceData.SellerDtls.Loc}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      SellerDtls: { ...prev.SellerDtls, Loc: e.target.value }
                    }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    type="number"
                    value={invoiceData.SellerDtls.Pin || ''}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      SellerDtls: { ...prev.SellerDtls, Pin: Number(e.target.value) }
                    }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>State Code</InputLabel>
                    <Select
                      value={invoiceData.SellerDtls.Stcd}
                      onChange={(e) => setInvoiceData(prev => ({
                        ...prev,
                        SellerDtls: { ...prev.SellerDtls, Stcd: e.target.value }
                      }))}
                    >
                      {stateCodes.map((state) => (
                        <MenuItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Buyer Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                👤 Buyer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="GSTIN (Optional for B2C)"
                    value={invoiceData.BuyerDtls.Gstin || ''}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      BuyerDtls: { ...prev.BuyerDtls, Gstin: e.target.value }
                    }))}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Legal Name"
                    value={invoiceData.BuyerDtls.LglNm}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      BuyerDtls: { ...prev.BuyerDtls, LglNm: e.target.value }
                    }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={invoiceData.BuyerDtls.Addr1}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      BuyerDtls: { ...prev.BuyerDtls, Addr1: e.target.value }
                    }))}
                    multiline
                    rows={2}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={invoiceData.BuyerDtls.Loc}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      BuyerDtls: { ...prev.BuyerDtls, Loc: e.target.value }
                    }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    type="number"
                    value={invoiceData.BuyerDtls.Pin || ''}
                    onChange={(e) => setInvoiceData(prev => ({
                      ...prev,
                      BuyerDtls: { ...prev.BuyerDtls, Pin: Number(e.target.value) }
                    }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>State Code</InputLabel>
                    <Select
                      value={invoiceData.BuyerDtls.Stcd}
                      onChange={(e) => setInvoiceData(prev => ({
                        ...prev,
                        BuyerDtls: { ...prev.BuyerDtls, Stcd: e.target.value }
                      }))}
                    >
                      {stateCodes.map((state) => (
                        <MenuItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Place of Supply</InputLabel>
                    <Select
                      value={invoiceData.BuyerDtls.Pos}
                      onChange={(e) => setInvoiceData(prev => ({
                        ...prev,
                        BuyerDtls: { ...prev.BuyerDtls, Pos: e.target.value }
                      }))}
                    >
                      {stateCodes.map((state) => (
                        <MenuItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Item List */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" color="primary">
              📦 Item Details
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setItemDialogOpen(true)}
            >
              Add Item
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Product Description</TableCell>
                  <TableCell>HSN Code</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>GST %</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData.ItemList.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.SlNo}</TableCell>
                    <TableCell>{item.PrdDesc}</TableCell>
                    <TableCell>{item.HsnCd}</TableCell>
                    <TableCell>{item.Qty}</TableCell>
                    <TableCell>{item.Unit}</TableCell>
                    <TableCell>₹{item.UnitPrice.toFixed(2)}</TableCell>
                    <TableCell>{item.GstRt}%</TableCell>
                    <TableCell>₹{item.TotItemVal.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => removeItem(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {invoiceData.ItemList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No items added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total Values */}
          {invoiceData.ItemList.length > 0 && (
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}></Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Invoice Summary</Typography>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Assessable Value:</Typography>
                      <Typography>₹{invoiceData.ValDtls.AssVal.toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>CGST:</Typography>
                      <Typography>₹{(invoiceData.ValDtls.CgstVal || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>SGST:</Typography>
                      <Typography>₹{(invoiceData.ValDtls.SgstVal || 0).toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6">₹{invoiceData.ValDtls.TotInvVal.toFixed(2)}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={saveInvoice}
          disabled={loading || invoiceData.ItemList.length === 0}
        >
          Save Invoice
        </Button>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={() => setPreviewDialogOpen(true)}
          disabled={invoiceData.ItemList.length === 0}
        >
          Preview JSON
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<QrCodeIcon />}
          onClick={generateIRN}
          disabled={loading || invoiceData.ItemList.length === 0}
        >
          Generate IRN
        </Button>
      </Box>

      {/* Add Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Description"
                value={currentItem.PrdDesc}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, PrdDesc: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="HSN Code"
                value={currentItem.HsnCd}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, HsnCd: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={currentItem.Qty}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, Qty: Number(e.target.value) }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={currentItem.Unit}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, Unit: e.target.value }))}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={currentItem.UnitPrice}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, UnitPrice: Number(e.target.value) }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GST Rate (%)"
                type="number"
                value={currentItem.GstRt}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, GstRt: Number(e.target.value) }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Discount (%)"
                type="number"
                value={currentItem.Discount}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, Discount: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Is Service</InputLabel>
                <Select
                  value={currentItem.IsServc}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, IsServc: e.target.value }))}
                >
                  <MenuItem value="Y">Yes</MenuItem>
                  <MenuItem value="N">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={addItem} 
            variant="contained"
            disabled={!currentItem.PrdDesc || !currentItem.HsnCd || currentItem.UnitPrice <= 0}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>E-Invoice JSON Preview</DialogTitle>
        <DialogContent>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px', 
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(invoiceData, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EInvoicePage;
