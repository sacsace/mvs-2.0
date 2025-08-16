import express, { Request, Response } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import Partner from '../models/Partner';
import logger from '../utils/logger';

const router = express.Router();

// 파트너사 목록 조회 (내 회사 관련만)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;

    if (!userCompanyId) {
      return res.status(400).json({ error: '회사 정보가 없습니다.' });
    }

    // 내 회사와 관련된 파트너사만 조회
    let whereClause: any = { 
      company_id: userCompanyId,
      is_deleted: false 
    };

    // root와 audit는 모든 파트너사를 볼 수 있음
    if (userRole === 'root' || userRole === 'audit') {
      whereClause = { 
        is_deleted: false 
      };
    }

    const partners = await Partner.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    logger.info(`User company ${userCompanyId} - Found ${partners.length} partners`);
    res.json(partners);
  } catch (error) {
    logger.error('Error fetching partners:', error);
    res.status(500).json({ error: '파트너사 목록을 불러오는데 실패했습니다.' });
  }
});

// 특정 파트너사 조회
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findOne({
      where: {
        partner_id: id,
        is_deleted: false
      }
    });

    if (!partner) {
      return res.status(404).json({ error: '파트너사를 찾을 수 없습니다.' });
    }

    res.json(partner);
  } catch (error) {
    logger.error('Error fetching partner:', error);
    res.status(500).json({ error: '파트너사 정보를 불러오는데 실패했습니다.' });
  }
});

// 파트너사 추가
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userCompanyId = req.user?.company_id;

    if (!userCompanyId) {
      return res.status(400).json({ error: '회사 정보가 없습니다.' });
    }

    const {
      name,
      partner_type,
      coi,
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
      address,
      website,
      email,
      phone,
      product_category,
      contact_person,
      contact_designation,
      contact_phone,
      contact_email,
      payment_terms,
      credit_limit
    } = req.body;

    // 필수 필드 검증
    if (!name || !partner_type) {
      return res.status(400).json({ error: '파트너사명과 파트너 타입은 필수입니다.' });
    }

    const newPartner = await Partner.create({
      company_id: userCompanyId, // 로그인한 사용자의 회사 ID 자동 설정
      name,
      partner_type,
      coi,
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
      address,
      website,
      email,
      phone,
      product_category,
      contact_person,
      contact_designation,
      contact_phone,
      contact_email,
      payment_terms,
      credit_limit: credit_limit || 0,
      is_active: true,
      is_deleted: false
    });

    logger.info(`New partner created for company ${userCompanyId}: ${newPartner.name}`);
    res.status(201).json(newPartner);
  } catch (error) {
    logger.error('Error creating partner:', error);
    res.status(500).json({ error: '파트너사 추가에 실패했습니다.' });
  }
});

// 파트너사 수정
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;
    const updateData = req.body;

    if (!userCompanyId) {
      return res.status(400).json({ error: '회사 정보가 없습니다.' });
    }

    // partner_id와 company_id는 수정 불가
    delete updateData.partner_id;
    delete updateData.company_id;
    delete updateData.create_date;

    // update_date 설정
    updateData.update_date = new Date();

    // 수정 권한 확인 (자기 회사 파트너만 수정 가능, root/audit는 예외)
    let whereClause: any = {
      partner_id: id,
      is_deleted: false
    };

    if (userRole !== 'root' && userRole !== 'audit') {
      whereClause.company_id = userCompanyId;
    }

    const [updatedRowsCount] = await Partner.update(updateData, {
      where: whereClause
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: '파트너사를 찾을 수 없거나 수정 권한이 없습니다.' });
    }

    // 수정된 파트너사 정보 반환
    const updatedPartner = await Partner.findByPk(id);
    
    logger.info(`Partner updated by company ${userCompanyId}: ${updatedPartner?.name}`);
    res.json(updatedPartner);
  } catch (error) {
    logger.error('Error updating partner:', error);
    res.status(500).json({ error: '파트너사 수정에 실패했습니다.' });
  }
});

// 파트너사 삭제 (소프트 삭제)
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;

    if (!userCompanyId) {
      return res.status(400).json({ error: '회사 정보가 없습니다.' });
    }

    // 삭제 권한 확인 (자기 회사 파트너만 삭제 가능, root/audit는 예외)
    let whereClause: any = {
      partner_id: id,
      is_deleted: false
    };

    if (userRole !== 'root' && userRole !== 'audit') {
      whereClause.company_id = userCompanyId;
    }

    const [updatedRowsCount] = await Partner.update(
      { 
        is_deleted: true,
        is_active: false,
        update_date: new Date()
      },
      {
        where: whereClause
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: '파트너사를 찾을 수 없거나 삭제 권한이 없습니다.' });
    }

    logger.info(`Partner soft deleted by company ${userCompanyId}: ID ${id}`);
    res.json({ message: '파트너사가 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error deleting partner:', error);
    res.status(500).json({ error: '파트너사 삭제에 실패했습니다.' });
  }
});

// 파트너사 활성화/비활성화
router.patch('/:id/toggle-status', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const [updatedRowsCount] = await Partner.update(
      { 
        is_active: is_active,
        update_date: new Date()
      },
      {
        where: {
          partner_id: id,
          is_deleted: false
        }
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: '파트너사를 찾을 수 없습니다.' });
    }

    logger.info(`Partner status toggled: ID ${id}, active: ${is_active}`);
    res.json({ message: '파트너사 상태가 변경되었습니다.' });
  } catch (error) {
    logger.error('Error toggling partner status:', error);
    res.status(500).json({ error: '파트너사 상태 변경에 실패했습니다.' });
  }
});

// 파트너 타입별 조회
router.get('/type/:type', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!['supplier', 'customer', 'both'].includes(type)) {
      return res.status(400).json({ error: '올바르지 않은 파트너 타입입니다.' });
    }

    const partners = await Partner.findAll({
      where: { 
        partner_type: type,
        is_deleted: false 
      },
      order: [['name', 'ASC']]
    });

    res.json(partners);
  } catch (error) {
    logger.error('Error fetching partners by type:', error);
    res.status(500).json({ error: '파트너사 목록을 불러오는데 실패했습니다.' });
  }
});

export default router;