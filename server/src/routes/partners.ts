import express, { Request, Response } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import Company from '../models/Company';
import logger from '../utils/logger';

const router = express.Router();

// 파트너사 목록 조회 (로그인한 회사의 파트너사만, 본사 제외)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;

    if (!userCompanyId) {
      return res.status(400).json({ error: '회사 정보가 없습니다.' });
    }

    // 파트너사는 partner_company_id가 로그인한 회사 ID인 회사들 (본사 제외)
    let whereClause: any = { 
      partner_company_id: userCompanyId,
      company_id: { [require('sequelize').Op.ne]: userCompanyId } // 본사 제외
    };

    // root와 audit는 모든 파트너사를 볼 수 있음 (본사 제외)
    if (userRole === 'root' || userRole === 'audit') {
      whereClause = { 
        company_id: { [require('sequelize').Op.ne]: userCompanyId } // 본사 제외
      };
    }

    const partners = await Company.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json(partners);
  } catch (error) {
    logger.error('Error fetching partners:', error);
    res.status(500).json({ error: '파트너사 목록을 불러오는데 실패했습니다.' });
  }
});

// 특정 파트너사 조회
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;
    const { id } = req.params;

    const partner = await Company.findByPk(id);

    if (!partner) {
      return res.status(404).json({ error: '파트너사를 찾을 수 없습니다.' });
    }

    // 권한 검사
    if (userRole !== 'root' && userRole !== 'audit') {
      if (partner.partner_company_id !== userCompanyId) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }

    res.json(partner);
  } catch (error) {
    logger.error('Error fetching partner:', error);
    res.status(500).json({ error: '파트너사를 불러오는데 실패했습니다.' });
  }
});

    // 파트너사 추가
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;

    // 권한 검사
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '파트너사를 추가할 권한이 없습니다.' });
    }

    const {
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
      product_category
    } = req.body;

    // 필수 필드 검증
    if (!name || !coi || !address) {
      return res.status(400).json({ error: '회사명, COI, 주소는 필수 입력 항목입니다.' });
    }

    // 파트너사 생성 (partner_company_id는 로그인한 회사 ID)
    const partner = await Company.create({
      name,
      coi,
      address,
      pan: pan || null,
      gst1: gst1 || null,
      gst2: gst2 || null,
      gst3: gst3 || null,
      gst4: gst4 || null,
      iec: iec || null,
      msme: msme || null,
      bank_name: bank_name || null,
      account_holder: account_holder || null,
      account_number: account_number || null,
      ifsc_code: ifsc_code || null,
      partner_company_id: userCompanyId,
      partner_type: partner_type || null,
      product_category: product_category || null
    });

    res.status(201).json(partner);
  } catch (error) {
    logger.error('Error creating partner:', error);
    res.status(500).json({ error: '파트너사 추가에 실패했습니다.' });
  }
});

// 파트너사 수정
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;
    const { id } = req.params;

    // 권한 검사
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '파트너사를 수정할 권한이 없습니다.' });
    }

    const partner = await Company.findByPk(id);
    if (!partner) {
      return res.status(404).json({ error: '파트너사를 찾을 수 없습니다.' });
    }

    // 권한 검사 (admin과 regular는 자사의 협력 업체만 수정 가능)
    if (userRole !== 'root' && userRole !== 'audit') {
      if (partner.partner_company_id !== userCompanyId) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }

    const {
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
      product_category
    } = req.body;

    // 필수 필드 검증
    if (!name || !coi || !address) {
      return res.status(400).json({ error: '회사명, COI, 주소는 필수 입력 항목입니다.' });
    }

    // 파트너사 업데이트
    await partner.update({
      name,
      coi,
      address,
      pan: pan || null,
      gst1: gst1 || null,
      gst2: gst2 || null,
      gst3: gst3 || null,
      gst4: gst4 || null,
      iec: iec || null,
      msme: msme || null,
      bank_name: bank_name || null,
      account_holder: account_holder || null,
      account_number: account_number || null,
      ifsc_code: ifsc_code || null,
      partner_type: partner_type || null,
      product_category: product_category || null
    });

    res.json(partner);
  } catch (error) {
    logger.error('Error updating partner:', error);
    res.status(500).json({ error: '파트너사 수정에 실패했습니다.' });
  }
});

// 파트너사 삭제
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;
    const { id } = req.params;

    // 권한 검사
    if (userRole !== 'root' && userRole !== 'admin' && userRole !== 'audit') {
      return res.status(403).json({ error: '파트너사를 삭제할 권한이 없습니다.' });
    }

    const partner = await Company.findByPk(id);
    if (!partner) {
      return res.status(404).json({ error: '파트너사를 찾을 수 없습니다.' });
    }

    // 권한 검사 (admin과 regular는 자사의 파트너사만 삭제 가능)
    if (userRole !== 'root' && userRole !== 'audit') {
      if (partner.partner_company_id !== userCompanyId) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }

    // 파트너사 삭제
    await partner.destroy();

    res.json({ message: '파트너사가 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error deleting partner:', error);
    res.status(500).json({ error: '파트너사 삭제에 실패했습니다.' });
  }
});

export default router; 