import express from 'express';
import { Company, User } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { authenticateJWT } from '../utils/jwtMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer 설정 for 파일 업로드
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/signatures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// 도장 이미지 업로드를 위한 multer 설정
const stampStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/stamps');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'stamp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadStamp = multer({
  storage: stampStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// 서명 이미지 업로드
router.post('/upload-signature', authenticateJWT, upload.single('signature'), async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { company_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: '서명 이미지를 업로드할 권한이 없습니다.' });
      }
      if (parseInt(company_id) !== currentUser.company_id) {
        return res.status(403).json({ message: '다른 회사의 서명 이미지를 업로드할 권한이 없습니다.' });
      }
    }

    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
    }

    // 기존 서명 이미지가 있다면 삭제
    if (company.signature_url) {
      const oldFilePath = path.join(__dirname, '../../uploads/signatures', path.basename(company.signature_url));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // 새로운 서명 이미지 URL 저장
    const signatureUrl = `/uploads/signatures/${req.file.filename}`;
    await company.update({ signature_url: signatureUrl });

    logger.info('Signature uploaded successfully:', { company_id, user: currentUser?.id });
    res.json({ 
      message: '서명 이미지가 업로드되었습니다.',
      signature_url: signatureUrl 
    });
  } catch (error) {
    logger.error('Error uploading signature:', error);
    res.status(500).json({ message: '서명 이미지 업로드에 실패했습니다.' });
  }
});

// 도장 이미지 업로드
router.post('/upload-stamp', authenticateJWT, uploadStamp.single('stamp'), async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { company_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: '도장 이미지를 업로드할 권한이 없습니다.' });
      }
      if (parseInt(company_id) !== currentUser.company_id) {
        return res.status(403).json({ message: '다른 회사의 도장 이미지를 업로드할 권한이 없습니다.' });
      }
    }

    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
    }

    // 기존 도장 이미지가 있다면 삭제
    if (company.stamp_url) {
      const oldFilePath = path.join(__dirname, '../../uploads/stamps', path.basename(company.stamp_url));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // 새로운 도장 이미지 URL 저장
    const stampUrl = `/uploads/stamps/${req.file.filename}`;
    await company.update({ stamp_url: stampUrl });

    logger.info('Stamp uploaded successfully:', { company_id, user: currentUser?.id });
    res.json({ 
      message: '도장 이미지가 업로드되었습니다.',
      stamp_url: stampUrl 
    });
  } catch (error) {
    logger.error('Error uploading stamp:', error);
    res.status(500).json({ message: '도장 이미지 업로드에 실패했습니다.' });
  }
});

// Get all companies with their GST numbers
router.get('/', authenticateJWT, async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { search } = req.query; // 검색 파라미터 추가
    logger.info(`Fetching companies for user: ${currentUser?.id}, role: ${currentUser?.role}, search: ${search}`);

    let whereCondition: any = { is_deleted: false };

    // 모든 회사 표시 (partner_type 필터링 제거)
    // whereCondition[Op.or] = [
    //   { partner_type: null },
    //   { partner_type: '' },
    //   { partner_type: 'customer' },
    //   { partner_type: 'both' }
    // ];

    // 권한에 따른 필터링
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      // root와 audit이 아닌 경우 등록된 회사만 조회 가능
      whereCondition.company_id = currentUser.company_id;
      logger.info(`Non-root/audit user - showing company_id: ${currentUser.company_id}`);
    }

    // 검색 조건 추가
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereCondition[Op.or] = [
        ...whereCondition[Op.or],
        { name: { [Op.like]: `%${searchTerm}%` } },
        { coi: { [Op.like]: `%${searchTerm}%` } },
        { address: { [Op.like]: `%${searchTerm}%` } },
        { pan: { [Op.like]: `%${searchTerm}%` } },
        { gst1: { [Op.like]: `%${searchTerm}%` } },
        { gst2: { [Op.like]: `%${searchTerm}%` } },
        { gst3: { [Op.like]: `%${searchTerm}%` } },
        { gst4: { [Op.like]: `%${searchTerm}%` } },
        { iec: { [Op.like]: `%${searchTerm}%` } },
        { msme: { [Op.like]: `%${searchTerm}%` } },
        { bank_name: { [Op.like]: `%${searchTerm}%` } },
        { account_holder: { [Op.like]: `%${searchTerm}%` } },
        { account_number: { [Op.like]: `%${searchTerm}%` } },
        { ifsc_code: { [Op.like]: `%${searchTerm}%` } }
      ];
      logger.info(`Search term applied: ${searchTerm}`);
    }

    const companies = await Company.findAll({
      where: whereCondition,
      order: [['create_date', 'DESC']]
    });

    // 각 회사별 사용자 수 계산
    const companiesWithUserCount = await Promise.all(
      companies.map(async (company) => {
        const userCount = await User.count({
          where: { company_id: company.company_id }
        });
        
        return {
          ...company.toJSON(),
          user_count: userCount
        };
      })
    );

    logger.info(`Found ${companies.length} companies for user ${currentUser?.id}`);
    res.json(companiesWithUserCount);
  } catch (error) {
    logger.error('Error fetching companies:', error);
    res.status(500).json({ message: '회사 목록을 불러오는데 실패했습니다.' });
  }
});

// Create a new company
router.post('/', authenticateJWT, async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { name, coi, address, pan, gst1, gst2, gst3, gst4, iec, msme, bank_name, account_holder, account_number, ifsc_code, partner_type, website, email, phone, signature_url, login_period_start, login_period_end } = req.body;

    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      return res.status(403).json({ message: '회사를 생성할 권한이 없습니다.' });
    }

    logger.info('Creating new company:', { name, coi, user: currentUser?.id });

    const company = await Company.create({
      name,
      coi,
      address,
      pan,
      gst1,
      gst2,
      gst3,
      gst4,
      iec,
      msme,
      bank_name,
      account_holder,
      account_number,
      ifsc_code,
      partner_type,
      website,
      email,
      phone,
      signature_url,
      login_period_start,
      login_period_end
    });

    const createdCompany = await Company.findByPk(company.company_id);

    logger.info('Company created successfully:', { company_id: company.company_id });
    res.status(201).json(createdCompany);
  } catch (error) {
    logger.error('Error creating company:', error);
    res.status(500).json({ message: '회사 생성에 실패했습니다.' });
  }
});

// Update a company
router.put('/:id', authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { name, coi, address, pan, gst1, gst2, gst3, gst4, iec, msme, bank_name, account_holder, account_number, ifsc_code, partner_type, website, email, phone, signature_url, login_period_start, login_period_end } = req.body;

    logger.info('Updating company:', { company_id: id, user: currentUser?.id });

    const company = await Company.findByPk(id);
    if (!company) {
      logger.warn('Company not found:', { company_id: id });
      return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
    }

    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      // admin만 수정 가능, regular는 수정 불가
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: '회사 정보를 수정할 권한이 없습니다.' });
      }
      // admin은 자신의 회사만 수정 가능
      if (company.company_id !== currentUser.company_id) {
        return res.status(403).json({ message: '다른 회사 정보를 수정할 권한이 없습니다.' });
      }
    }

    // 로그인 기간 수정은 root만 가능
    if ((login_period_start !== undefined || login_period_end !== undefined) && currentUser?.role !== 'root') {
      return res.status(403).json({ message: '로그인 기간은 root 사용자만 수정할 수 있습니다.' });
    }

    await company.update({
      name,
      coi,
      address,
      pan,
      gst1,
      gst2,
      gst3,
      gst4,
      iec,
      msme,
      bank_name,
      account_holder,
      account_number,
      ifsc_code,
      partner_type,
      website,
      email,
      phone,
      signature_url,
      login_period_start,
      login_period_end,
      update_date: new Date()
    });

    const updatedCompany = await Company.findByPk(id);

    logger.info('Company updated successfully:', { company_id: id });
    res.json(updatedCompany);
  } catch (error) {
    logger.error('Error updating company:', error);
    res.status(500).json({ message: '회사 정보 수정에 실패했습니다.' });
  }
});

// Get current user's company information
router.get('/current', authenticateJWT, async (req: any, res) => {
  try {
    const currentUser = req.user;
    logger.info(`Fetching current user's company: ${currentUser?.id}`);

    if (!currentUser?.company_id) {
      return res.status(400).json({ message: '사용자 정보에 회사 ID가 없습니다.' });
    }

    const company = await Company.findByPk(currentUser.company_id);
    if (!company) {
      logger.warn('Company not found for user:', { user_id: currentUser.id, company_id: currentUser.company_id });
      return res.status(404).json({ message: '회사 정보를 찾을 수 없습니다.' });
    }

    logger.info('Current user company fetched successfully:', { company_id: company.company_id });
    res.json(company);
  } catch (error) {
    logger.error('Error fetching current user company:', error);
    res.status(500).json({ message: '회사 정보를 불러오는데 실패했습니다.' });
  }
});

// Delete a company (soft delete)
router.delete('/:id', authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    logger.info('Deleting company:', { company_id: id, user: currentUser?.id });

    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      return res.status(403).json({ message: '회사를 삭제할 권한이 없습니다.' });
    }

    const company = await Company.findByPk(id);
    if (!company) {
      logger.warn('Company not found:', { company_id: id });
      return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
    }

    await company.update({ is_deleted: true });

    logger.info('Company deleted successfully:', { company_id: id });
    res.json({ message: '회사가 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error deleting company:', error);
    res.status(500).json({ message: '회사 삭제에 실패했습니다.' });
  }
});

// Remove signature image
router.delete('/:id/remove-signature', authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    logger.info('Removing signature for company:', { company_id: id, user: currentUser?.id });

    const company = await Company.findByPk(id);
    if (!company) {
      logger.warn('Company not found:', { company_id: id });
      return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
    }

    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: '서명 이미지를 삭제할 권한이 없습니다.' });
      }
      if (company.company_id !== currentUser.company_id) {
        return res.status(403).json({ message: '다른 회사의 서명 이미지를 삭제할 권한이 없습니다.' });
      }
    }

    // 기존 서명 파일 삭제
    if (company.signature_url) {
      const signaturePath = path.join(__dirname, '../../uploads/signatures', path.basename(company.signature_url));
      if (fs.existsSync(signaturePath)) {
        fs.unlinkSync(signaturePath);
        logger.info('Signature file deleted:', signaturePath);
      }
    }

    // 데이터베이스에서 서명 URL 제거
    await company.update({ 
      signature_url: null,
      update_date: new Date()
    });

    logger.info('Signature removed successfully:', { company_id: id });
    res.json({ message: '서명 이미지가 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error removing signature:', error);
    res.status(500).json({ message: '서명 이미지 삭제에 실패했습니다.' });
  }
});

// Remove stamp image
router.delete('/:id/remove-stamp', authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    logger.info('Removing stamp for company:', { company_id: id, user: currentUser?.id });

    const company = await Company.findByPk(id);
    if (!company) {
      logger.warn('Company not found:', { company_id: id });
      return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
    }

    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'audit') {
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: '도장 이미지를 삭제할 권한이 없습니다.' });
      }
      if (company.company_id !== currentUser.company_id) {
        return res.status(403).json({ message: '다른 회사의 도장 이미지를 삭제할 권한이 없습니다.' });
      }
    }

    // 기존 도장 파일 삭제
    if (company.stamp_url) {
      const stampPath = path.join(__dirname, '../../uploads/stamps', path.basename(company.stamp_url));
      if (fs.existsSync(stampPath)) {
        fs.unlinkSync(stampPath);
        logger.info('Stamp file deleted:', stampPath);
      }
    }

    // 데이터베이스에서 도장 URL 제거
    await company.update({ 
      stamp_url: null,
      update_date: new Date()
    });

    logger.info('Stamp removed successfully:', { company_id: id });
    res.json({ message: '도장 이미지가 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error removing stamp:', error);
    res.status(500).json({ message: '도장 이미지 삭제에 실패했습니다.' });
  }
});

export default router; 