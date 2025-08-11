import { Router } from 'express';
import User from '../models/User';
import logger from '../utils/logger';

const router = Router();

// 헬스체크 엔드포인트
router.get('/health', (req, res) => {
  try {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      message: 'Server is running successfully',
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      message: 'Server is running',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 시스템 초기화 상태 확인
router.get('/status', async (req, res) => {
  try {
    const userCount = await User.count({ where: { is_deleted: false } });
    const isInitialized = userCount > 0;
    
    res.json({
      success: true,
      initialized: isInitialized,
      userCount,
      message: isInitialized 
        ? '시스템이 이미 초기화되었습니다.' 
        : '시스템 초기화가 필요합니다. initializeSystemData.ts 스크립트를 실행하세요.'
    });
  } catch (error) {
    logger.error('시스템 상태 확인 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '시스템 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 존재 여부 확인 (기존 호환성 유지)
router.get('/has-user', async (req, res) => {
  try {
    const userCount = await User.count({ where: { is_deleted: false } });
    res.json({
      success: true,
      hasUser: userCount > 0,
      userCount
    });
  } catch (error) {
    logger.error('사용자 존재 여부 확인 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 존재 여부 확인 중 오류가 발생했습니다.'
    });
  }
});

export default router;