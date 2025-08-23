const webpush = require('web-push');

// VAPID 키 생성
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID 키가 생성되었습니다:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('\n환경변수에 추가하세요:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=your-email@example.com`);

// 클라이언트 파일 업데이트를 위한 정보
console.log('\n클라이언트 pushNotifications.ts 파일에서 VAPID_PUBLIC_KEY를 업데이트하세요:');
console.log(`const VAPID_PUBLIC_KEY = '${vapidKeys.publicKey}';`);
