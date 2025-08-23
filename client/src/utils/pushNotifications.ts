// 푸시 알림 관리 유틸리티

// VAPID 공개 키 캐시
let vapidPublicKey: string | null = null;

// 서버로부터 VAPID 공개 키 가져오기
async function getVapidPublicKey(): Promise<string | null> {
  if (vapidPublicKey) {
    return vapidPublicKey;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/push/vapid-key', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      vapidPublicKey = data.publicKey;
      return vapidPublicKey;
    } else {
      console.error('VAPID 공개 키 가져오기 실패:', response.status);
      return null;
    }
  } catch (error) {
    console.error('VAPID 공개 키 가져오기 오류:', error);
    return null;
  }
}

// URL-safe base64를 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Service Worker 등록
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker가 지원되지 않습니다.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker 등록 성공:', registration);

    // 이미 활성 상태면 반환
    if (registration.active) {
      return registration;
    }

    // installing 또는 waiting 상태의 워커 참조
    const sw = registration.installing || registration.waiting;
    if (sw) {
      await new Promise<void>((resolve) => {
        if ((sw as ServiceWorker).state === 'activated') {
          resolve();
          return;
        }
        (sw as ServiceWorker).addEventListener('statechange', () => {
          if ((sw as ServiceWorker).state === 'activated' || registration.active) {
            resolve();
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
}

// 알림 권한 요청
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// 푸시 구독 생성
export async function createPushSubscription(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    // 서버로부터 VAPID 공개 키 가져오기
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.error('VAPID 공개 키를 가져올 수 없습니다.');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    console.log('푸시 구독 생성 성공:', subscription);
    return subscription;
  } catch (error) {
    console.error('푸시 구독 생성 실패:', error);
    return null;
  }
}

// 서버에 푸시 구독 정보 전송
export async function sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });

    if (response.ok) {
      console.log('푸시 구독 정보 서버 전송 성공');
      return true;
    } else {
      console.error('푸시 구독 정보 서버 전송 실패:', response.status);
      return false;
    }
  } catch (error) {
    console.error('푸시 구독 정보 서버 전송 오류:', error);
    return false;
  }
}

// 푸시 알림 초기화 (권한 요청 + 구독 생성 + 서버 전송)
export async function initializePushNotifications(): Promise<boolean> {
  console.log('🚀 푸시 알림 초기화 시작...');
  
  try {
    // 환경 체크
    console.log('🔍 환경 체크:', {
      https: window.location.protocol === 'https:',
      serviceWorkerSupport: 'serviceWorker' in navigator,
      pushManagerSupport: 'PushManager' in window,
      notificationSupport: 'Notification' in window,
      browser: navigator.userAgent
    });

    // 1. 알림 권한 요청
    console.log('1️⃣ 알림 권한 요청 중...');
    const permission = await requestNotificationPermission();
    console.log('✅ 알림 권한 결과:', permission);
    
    if (permission !== 'granted') {
      console.warn('❌ 알림 권한이 거부되었습니다:', permission);
      return false;
    }

    // 2. Service Worker 등록
    console.log('2️⃣ Service Worker 등록 중...');
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('❌ Service Worker 등록 실패');
      return false;
    }
    console.log('✅ Service Worker 등록 성공:', registration);

    // 3. 기존 구독 확인
    console.log('3️⃣ 기존 구독 확인 중...');
    const existingSubscription = await registration.pushManager.getSubscription();
    
    let subscription: PushSubscription | null;
    if (existingSubscription) {
      console.log('✅ 기존 푸시 구독 발견:', {
        endpoint: existingSubscription.endpoint.substring(0, 50) + '...',
        keys: Object.keys(existingSubscription.toJSON().keys || {})
      });
      subscription = existingSubscription;
    } else {
      // 4. 새 푸시 구독 생성
      console.log('4️⃣ 새 푸시 구독 생성 중...');
      subscription = await createPushSubscription(registration);
      if (!subscription) {
        console.error('❌ 푸시 구독 생성 실패');
        return false;
      }
      console.log('✅ 새 푸시 구독 생성 성공:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        keys: Object.keys(subscription.toJSON().keys || {})
      });
    }

    // 5. 서버에 구독 정보 전송
    console.log('5️⃣ 서버에 구독 정보 전송 중...');
    const success = await sendSubscriptionToServer(subscription);
    if (success) {
      localStorage.setItem('pushNotificationsEnabled', 'true');
      console.log('🎉 푸시 알림 초기화 완료!');
      return true;
    } else {
      console.error('❌ 서버 전송 실패');
    }

    return false;
  } catch (error) {
    console.error('💥 푸시 알림 초기화 오류:', error);
    console.error('스택 트레이스:', error instanceof Error ? error.stack : 'No stack trace');
    return false;
  }
}

// 푸시 알림 구독 해제
export async function unsubscribePushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return true;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true;
    }

    // 서버에서 구독 제거
    const token = localStorage.getItem('token');
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });

    // 클라이언트에서 구독 해제
    await subscription.unsubscribe();
    localStorage.removeItem('pushNotificationsEnabled');
    console.log('푸시 알림 구독 해제 완료');
    return true;
  } catch (error) {
    console.error('푸시 알림 구독 해제 오류:', error);
    return false;
  }
}

// 푸시 알림 지원 여부 확인
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

// 현재 알림 권한 상태 확인
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// 테스트 알림 전송
export async function sendTestNotification(): Promise<void> {
  if (Notification.permission === 'granted') {
    new Notification('MVS 테스트 알림', {
      body: '푸시 알림이 정상적으로 작동합니다!',
      icon: '/MSV Logo.png',
      tag: 'test-notification'
    });
  }
}
