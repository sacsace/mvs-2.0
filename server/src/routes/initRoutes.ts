import express from 'express';
import { initializeSystem } from '../controllers/initController';

const router = express.Router();

// 시스템 초기화
router.post('/system', initializeSystem);

export default router; 