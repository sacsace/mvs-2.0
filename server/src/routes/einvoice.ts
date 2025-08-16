import { Router } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import logger from '../utils/logger';
import crypto from 'crypto';

const router = Router();

interface EInvoiceData {
  Version: string;
  TranDtls: {
    TaxSch: string;
    SupTyp: string;
    RegRev: string;
    EcmGstin?: string;
    IgstOnIntra?: string;
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
  ItemList: Array<{
    SlNo: string;
    PrdDesc: string;
    IsServc: string;
    HsnCd: string;
    Qty?: number;
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
    TotItemVal: number;
  }>;
  ValDtls: {
    AssVal: number;
    CgstVal?: number;
    SgstVal?: number;
    IgstVal?: number;
    TotInvVal: number;
  };
}

// IRN 생성을 위한 GST 포털 API 호출 (모의)
router.post('/generate-irn', authenticateJWT, async (req, res) => {
  try {
    const einvoiceData: EInvoiceData = req.body;
    
    // 입력 데이터 유효성 검사
    const validationErrors = validateEInvoiceData(einvoiceData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // GST 포털 API 호출을 위한 JSON 데이터 준비
    const gstPortalData = {
      ...einvoiceData,
      // 실제 환경에서는 추가 필드들이 필요할 수 있음
      AckNo: null, // GST 포털에서 반환
      AckDt: null, // GST 포털에서 반환
      Irn: null,   // GST 포털에서 반환
      SignedInvoice: null, // GST 포털에서 반환
      SignedQRCode: null   // GST 포털에서 반환
    };

    // 실제 프로덕션에서는 여기서 GST 포털 API를 호출
    // 현재는 모의 응답을 생성
    const mockIrnResponse = await generateMockIrnResponse(einvoiceData);
    
    logger.info('E-Invoice IRN generated successfully', {
      invoiceNo: einvoiceData.DocDtls.No,
      irn: mockIrnResponse.irn
    });

    res.json({
      success: true,
      data: mockIrnResponse
    });

  } catch (error) {
    logger.error('Error generating IRN:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating IRN'
    });
  }
});

// E-Invoice 저장
router.post('/save', authenticateJWT, async (req, res) => {
  try {
    const einvoiceData = req.body;
    const userId = (req as any).user.id;

    // 실제 환경에서는 데이터베이스에 저장
    // 현재는 로그만 남김
    logger.info('E-Invoice saved', {
      invoiceNo: einvoiceData.DocDtls.No,
      userId: userId,
      totalAmount: einvoiceData.ValDtls.TotInvVal
    });

    res.json({
      success: true,
      message: 'E-Invoice saved successfully',
      invoiceId: generateInvoiceId()
    });

  } catch (error) {
    logger.error('Error saving E-Invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while saving E-Invoice'
    });
  }
});

// GST 번호 유효성 검사
router.post('/validate-gstin', authenticateJWT, async (req, res) => {
  try {
    const { gstin } = req.body;
    
    if (!gstin) {
      return res.status(400).json({
        success: false,
        error: 'GSTIN is required'
      });
    }

    const isValid = validateGSTIN(gstin);
    
    if (isValid) {
      // 실제 환경에서는 GST 포털 API로 GSTIN 상세 정보 조회
      const mockGstinDetails = generateMockGstinDetails(gstin);
      
      res.json({
        success: true,
        valid: true,
        data: mockGstinDetails
      });
    } else {
      res.json({
        success: true,
        valid: false,
        message: 'Invalid GSTIN format'
      });
    }

  } catch (error) {
    logger.error('Error validating GSTIN:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while validating GSTIN'
    });
  }
});

// HSN 코드 검색
router.get('/hsn-search', authenticateJWT, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // 모의 HSN 코드 데이터
    const mockHsnData = generateMockHsnData(query);
    
    res.json({
      success: true,
      data: mockHsnData
    });

  } catch (error) {
    logger.error('Error searching HSN codes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while searching HSN codes'
    });
  }
});

// E-Invoice 데이터 유효성 검사
function validateEInvoiceData(data: EInvoiceData): string[] {
  const errors: string[] = [];

  // Document Details 검사
  if (!data.DocDtls.No) errors.push('Invoice number is required');
  if (!data.DocDtls.Dt) errors.push('Invoice date is required');

  // Seller Details 검사
  if (!data.SellerDtls.Gstin) errors.push('Seller GSTIN is required');
  if (!validateGSTIN(data.SellerDtls.Gstin)) errors.push('Invalid Seller GSTIN format');
  if (!data.SellerDtls.LglNm) errors.push('Seller legal name is required');
  if (!data.SellerDtls.Addr1) errors.push('Seller address is required');
  if (!data.SellerDtls.Loc) errors.push('Seller location is required');
  if (!data.SellerDtls.Pin || data.SellerDtls.Pin < 100000 || data.SellerDtls.Pin > 999999) {
    errors.push('Valid Seller PIN code is required');
  }
  if (!data.SellerDtls.Stcd) errors.push('Seller state code is required');

  // Buyer Details 검사
  if (!data.BuyerDtls.LglNm) errors.push('Buyer legal name is required');
  if (!data.BuyerDtls.Addr1) errors.push('Buyer address is required');
  if (!data.BuyerDtls.Loc) errors.push('Buyer location is required');
  if (!data.BuyerDtls.Pin || data.BuyerDtls.Pin < 100000 || data.BuyerDtls.Pin > 999999) {
    errors.push('Valid Buyer PIN code is required');
  }
  if (!data.BuyerDtls.Stcd) errors.push('Buyer state code is required');
  if (!data.BuyerDtls.Pos) errors.push('Place of supply is required');

  // Buyer GSTIN 검사 (B2B인 경우)
  if (data.TranDtls.SupTyp === 'B2B' && data.BuyerDtls.Gstin) {
    if (!validateGSTIN(data.BuyerDtls.Gstin)) {
      errors.push('Invalid Buyer GSTIN format');
    }
  }

  // Item List 검사
  if (!data.ItemList || data.ItemList.length === 0) {
    errors.push('At least one item is required');
  } else {
    data.ItemList.forEach((item, index) => {
      if (!item.PrdDesc) errors.push(`Item ${index + 1}: Product description is required`);
      if (!item.HsnCd) errors.push(`Item ${index + 1}: HSN code is required`);
      if (!item.UnitPrice || item.UnitPrice <= 0) errors.push(`Item ${index + 1}: Valid unit price is required`);
      if (!item.GstRt && item.GstRt !== 0) errors.push(`Item ${index + 1}: GST rate is required`);
    });
  }

  return errors;
}

// GSTIN 유효성 검사
function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  
  // GSTIN 형식: 15자리, 첫 2자리는 주 코드, 다음 10자리는 PAN, 다음 1자리는 entity code, 다음 1자리는 check digit, 마지막 1자리는 default Z
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][Z][0-9A-Z]$/;
  return gstinPattern.test(gstin);
}

// 모의 IRN 응답 생성
async function generateMockIrnResponse(data: EInvoiceData) {
  // 실제 환경에서는 GST 포털에서 반환되는 데이터
  const irn = generateIRN(data);
  const ackNo = generateAckNo();
  const ackDt = new Date().toISOString();
  
  return {
    irn: irn,
    ackNo: ackNo,
    ackDt: ackDt,
    signedInvoice: generateSignedInvoice(data),
    signedQRCode: generateQRCode(data, irn),
    status: 'ACT', // Active
    ewbNo: null, // E-Way Bill Number (if applicable)
    ewbDt: null, // E-Way Bill Date (if applicable)
    ewbValidTill: null // E-Way Bill Valid Till (if applicable)
  };
}

// IRN 생성 (SHA-256 해시 기반)
function generateIRN(data: EInvoiceData): string {
  const concatenatedString = 
    data.SellerDtls.Gstin + 
    data.DocDtls.No + 
    data.DocDtls.Dt + 
    data.ValDtls.TotInvVal.toFixed(2);
  
  return crypto
    .createHash('sha256')
    .update(concatenatedString)
    .digest('hex')
    .toUpperCase()
    .substring(0, 64);
}

// Acknowledgment Number 생성
function generateAckNo(): string {
  return Date.now().toString() + Math.random().toString().substring(2, 8);
}

// Signed Invoice 생성 (모의)
function generateSignedInvoice(data: EInvoiceData): string {
  // 실제로는 디지털 서명된 JSON
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

// QR Code 생성 (모의)
function generateQRCode(data: EInvoiceData, irn: string): string {
  const qrData = {
    irn: irn,
    ackNo: generateAckNo(),
    ackDt: new Date().toISOString(),
    totInvVal: data.ValDtls.TotInvVal
  };
  
  return Buffer.from(JSON.stringify(qrData)).toString('base64');
}

// 인보이스 ID 생성
function generateInvoiceId(): string {
  return 'EI' + Date.now().toString();
}

// 모의 GSTIN 상세 정보 생성
function generateMockGstinDetails(gstin: string) {
  const stateCode = gstin.substring(0, 2);
  const stateName = getStateName(stateCode);
  
  return {
    gstin: gstin,
    legalName: 'Sample Company Name',
    tradeName: 'Sample Trade Name',
    address: 'Sample Address',
    stateCode: stateCode,
    stateName: stateName,
    status: 'Active',
    registrationDate: '2020-01-01'
  };
}

// 모의 HSN 코드 데이터 생성
function generateMockHsnData(query: string) {
  const mockHsnCodes = [
    { code: '1001', description: 'Wheat and meslin' },
    { code: '1002', description: 'Rye' },
    { code: '1003', description: 'Barley' },
    { code: '1004', description: 'Oats' },
    { code: '1005', description: 'Maize (corn)' },
    { code: '8471', description: 'Automatic data processing machines' },
    { code: '8517', description: 'Telephone sets, including telephones for cellular networks' },
    { code: '9983', description: 'Services by way of extending deposits, loans or advances' }
  ];

  return mockHsnCodes.filter(hsn => 
    hsn.code.includes(query) || 
    hsn.description.toLowerCase().includes(query.toLowerCase())
  );
}

// 주 코드로 주 이름 반환
function getStateName(stateCode: string): string {
  const stateCodes: { [key: string]: string } = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '25': 'Daman and Diu',
    '26': 'Dadra and Nagar Haveli',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh (New)',
    '38': 'Ladakh'
  };
  
  return stateCodes[stateCode] || 'Unknown State';
}

export default router;
