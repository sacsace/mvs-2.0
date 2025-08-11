import { Router } from 'express';
import { authenticateJWT } from '../utils/jwtMiddleware';
import User from '../models/User';
import Company from '../models/Company';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import logger from '../utils/logger';

const router = Router();

// 대시보드 통계 데이터 조회
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    console.log('대시보드 통계 API 호출됨');
    console.log('사용자 정보:', req.user);

    const userId = req.user?.id;
    const userRole = req.user?.role;
    const companyId = req.user?.company_id;

    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    // 사용자 통계
    let userStats;
    if (userRole === 'root') {
      // root 사용자만 전체 사용자 통계 볼 수 있음
      const totalUsers = await User.count({ where: { is_deleted: false } });
      const adminUsers = await User.count({ 
        where: { 
          is_deleted: false,
          role: ['admin', 'root']
        }
      });
      
      userStats = {
        total: totalUsers,
        admin: adminUsers,
        regular: totalUsers - adminUsers
      };
    } else {
      // admin 및 일반 사용자는 자신 회사의 사용자만
      const totalUsers = await User.count({ 
        where: { 
          is_deleted: false,
          company_id: companyId
        }
      });
      const adminUsers = await User.count({ 
        where: { 
          is_deleted: false,
          company_id: companyId,
          role: ['admin', 'root']
        }
      });
      
      userStats = {
        total: totalUsers,
        admin: adminUsers,
        regular: totalUsers - adminUsers
      };
    }

    // 회사 통계
    let companyStats;
    if (userRole === 'root') {
      // root 사용자만 전체 회사 통계 볼 수 있음
      const totalCompanies = await Company.count({ where: { is_deleted: false } });
      const activeCompanies = await Company.count({ 
        where: { 
          is_deleted: false,
          // 추가 조건 (예: 최근 활동이 있는 회사)
        }
      });
      
      companyStats = {
        total: totalCompanies,
        active: activeCompanies
      };
    } else {
      // admin 및 일반 사용자는 자신의 회사 정보만
      companyStats = {
        total: 1,
        active: 1
      };
    }

    // 메뉴 통계
    const totalMenus = await Menu.count();
    const accessibleMenus = await MenuPermission.count({
      where: {
        user_id: userId,
        can_read: true
      }
    });

    const menuStats = {
      total: totalMenus,
      accessible: accessibleMenus
    };

    // 최근 활동 (간단한 목업 데이터)
    const recentActivities = [
      {
        id: 1,
        type: 'login',
        message: '새로운 사용자가 로그인했습니다',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
        user: req.user?.username || 'admin'
      },
      {
        id: 2,
        type: 'invoice',
        message: '새로운 송장이 생성되었습니다',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15분 전
        user: 'manager'
      },
      {
        id: 3,
        type: 'approval',
        message: '전자결재 요청이 승인되었습니다',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1시간 전
        user: 'director'
      },
      {
        id: 4,
        type: 'user',
        message: '새로운 사용자가 등록되었습니다',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
        user: 'admin'
      }
    ];

    const dashboardStats = {
      users: userStats,
      companies: companyStats,
      menus: menuStats,
      recentActivities,
      systemStatus: {
        status: 'healthy',
        uptime: process.uptime(),
        version: '2.0.0'
      }
    };

    logger.info('대시보드 통계 조회 완료', { userId, stats: dashboardStats });

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    logger.error('대시보드 통계 조회 중 오류:', error);
    res.status(500).json({ 
      success: false,
      error: '대시보드 통계 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 사용자 정보 조회 (현재 로그인한 사용자)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'userid', 'username', 'role', 'company_id', 'default_language'],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['company_id', 'name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('사용자 정보 조회 중 오류:', error);
    res.status(500).json({ 
      success: false,
      error: '사용자 정보 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 시스템 성능 정보 조회
router.get('/performance', authenticateJWT, async (req, res) => {
  try {
    const userRole = req.user?.role;
    
    // 관리자만 시스템 성능 정보 조회 가능
    if (userRole !== 'admin' && userRole !== 'root') {
      return res.status(403).json({ 
        error: '권한이 없습니다. 관리자만 접근 가능합니다.' 
      });
    }

    const performance = {
      cpu: {
        usage: Math.floor(Math.random() * 50) + 10, // 10-60% 랜덤
        cores: require('os').cpus().length
      },
      memory: {
        usage: Math.floor(Math.random() * 40) + 30, // 30-70% 랜덤
        total: Math.round(require('os').totalmem() / 1024 / 1024 / 1024), // GB
        free: Math.round(require('os').freemem() / 1024 / 1024 / 1024) // GB
      },
      disk: {
        usage: Math.floor(Math.random() * 30) + 50, // 50-80% 랜덤
      },
      uptime: process.uptime(),
      nodeVersion: process.version
    };

    res.json({
      success: true,
      data: performance
    });

  } catch (error) {
    logger.error('시스템 성능 정보 조회 중 오류:', error);
    res.status(500).json({ 
      success: false,
      error: '시스템 성능 정보 조회 중 오류가 발생했습니다.' 
    });
  }
});

export default router;