// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// 푸시 알림 수신 처리
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '새 알림', body: event.data.text() };
    }
  }

  const options = {
    title: data.title || '새 결제 요청',
    body: data.body || '새로운 결제 요청이 도착했습니다.',
    icon: '/MSV Logo.png',
    badge: '/MSV Logo.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/approval?type=received',
      approvalId: data.approvalId
    },
    actions: [
      {
        action: 'open',
        title: '확인하기',
        icon: '/MSV Logo.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ],
    requireInteraction: true,
    tag: 'approval-notification'
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data.url || '/approval?type=received';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 이미 열린 창이 있는지 확인
      for (const client of clientList) {
        if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: urlToOpen,
            approvalId: event.notification.data.approvalId
          });
          return;
        }
      }
      
      // 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  if (event.tag === 'approval-sync') {
    console.log('Background sync for approvals');
    // 필요시 백그라운드에서 데이터 동기화
  }
});
