import express, { Request, Response } from 'express';
import webpush from 'web-push';
import { authenticateJWT } from '../utils/jwtMiddleware';
import PushSubscription from '../models/PushSubscription';
import User from '../models/User';
import logger from '../utils/logger';

const router = express.Router();

// VAPID 키 설정 (환경변수 필수)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@mvs.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  logger.error('VAPID 키가 환경변수에 설정되지 않았습니다. VAPID_PUBLIC_KEY와 VAPID_PRIVATE_KEY를 설정해주세요.');
  throw new Error('VAPID 키가 설정되지 않았습니다.');
}

webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// 푸시 구독 등록
router.post('/subscribe', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { subscription } = req.body;
    const currentUser = req.user;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 구독 정보입니다.' 
      });
    }

    // 기존 구독 비활성화
    await PushSubscription.update(
      { is_active: false },
      { where: { user_id: currentUser.id } }
    );

    // 새 구독 저장
    const newSubscription = await PushSubscription.create({
      user_id: currentUser.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      is_active: true
    });

    logger.info(`푸시 구독 등록 성공 - 사용자: ${currentUser.username}, ID: ${newSubscription.id}`);

    res.json({ 
      success: true, 
      message: '푸시 알림 구독이 등록되었습니다.',
      subscriptionId: newSubscription.id
    });
  } catch (error) {
    logger.error('푸시 구독 등록 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '푸시 구독 등록 중 오류가 발생했습니다.' 
    });
  }
});

// 푸시 구독 해제
router.post('/unsubscribe', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { endpoint } = req.body;
    const currentUser = req.user;

    await PushSubscription.update(
      { is_active: false },
      { 
        where: { 
          user_id: currentUser.id,
          endpoint: endpoint
        } 
      }
    );

    logger.info(`푸시 구독 해제 성공 - 사용자: ${currentUser.username}`);

    res.json({ 
      success: true, 
      message: '푸시 알림 구독이 해제되었습니다.' 
    });
  } catch (error) {
    logger.error('푸시 구독 해제 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '푸시 구독 해제 중 오류가 발생했습니다.' 
    });
  }
});

// 푸시 알림 전송 (내부 사용)
export async function sendPushNotification(
  userId: number, 
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> {
  try {
    // 사용자의 활성 구독 조회
    const subscriptions = await PushSubscription.findAll({
      where: {
        user_id: userId,
        is_active: true
      }
    });

    if (subscriptions.length === 0) {
      logger.warn(`푸시 구독이 없는 사용자: ${userId}`);
      return false;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/MSV Logo.png',
      badge: '/MSV Logo.png',
      data: data || {}
    });

    // 모든 활성 구독에 알림 전송
    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        logger.info(`푸시 알림 전송 성공 - 사용자: ${userId}, 구독: ${sub.id}`);
        return true;
      } catch (error: any) {
        logger.error(`푸시 알림 전송 실패 - 구독: ${sub.id}`, error);
        
        // 만료된 구독 비활성화
        if (error.statusCode === 410) {
          await PushSubscription.update(
            { is_active: false },
            { where: { id: sub.id } }
          );
          logger.info(`만료된 푸시 구독 비활성화: ${sub.id}`);
        }
        
        return false;
      }
    });

    const results = await Promise.all(promises);
    return results.some(result => result);
  } catch (error) {
    logger.error('푸시 알림 전송 오류:', error);
    return false;
  }
}

// 테스트 알림 전송
router.post('/test', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    
    const success = await sendPushNotification(
      currentUser.id,
      'MVS 테스트 알림',
      '푸시 알림이 정상적으로 작동합니다!',
      { url: '/dashboard' }
    );

    if (success) {
      res.json({ 
        success: true, 
        message: '테스트 알림이 전송되었습니다.' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: '활성 구독이 없어 테스트 알림을 전송할 수 없습니다.' 
      });
    }
  } catch (error) {
    logger.error('테스트 알림 전송 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '테스트 알림 전송 중 오류가 발생했습니다.' 
    });
  }
});

// 사용자의 푸시 구독 상태 조회
router.get('/status', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const currentUser = req.user;
    
    const activeSubscriptions = await PushSubscription.count({
      where: {
        user_id: currentUser.id,
        is_active: true
      }
    });

    res.json({ 
      success: true, 
      isSubscribed: activeSubscriptions > 0,
      subscriptionCount: activeSubscriptions
    });
  } catch (error) {
    logger.error('푸시 구독 상태 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '푸시 구독 상태 조회 중 오류가 발생했습니다.' 
    });
  }
});

// VAPID 공개 키 제공
router.get('/vapid-key', authenticateJWT, async (req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      publicKey: VAPID_PUBLIC_KEY
    });
  } catch (error) {
    logger.error('VAPID 공개 키 제공 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: 'VAPID 공개 키를 가져올 수 없습니다.' 
    });
  }
});

export default router;
