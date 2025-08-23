import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Science as TestIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import {
  initializePushNotifications,
  unsubscribePushNotifications,
  isPushNotificationSupported,
  getNotificationPermission,
  sendTestNotification
} from '../utils/pushNotifications';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);
    
    const enabledFlag = localStorage.getItem('pushNotificationsEnabled') === 'true';
    setIsEnabled(enabledFlag);

    // 디버그 정보 수집
    const debug = [
      `🌐 브라우저 지원: ${isPushNotificationSupported() ? '✅ 지원됨' : '❌ 지원되지 않음'}`,
      `🔧 Service Worker: ${'serviceWorker' in navigator ? '✅ 지원됨' : '❌ 지원되지 않음'}`,
      `📢 Push Manager: ${'PushManager' in window ? '✅ 지원됨' : '❌ 지원되지 않음'}`,
      `🔔 Notification API: ${'Notification' in window ? '✅ 지원됨' : '❌ 지원되지 않음'}`,
      `🔐 현재 권한: ${currentPermission} ${currentPermission === 'granted' ? '✅' : currentPermission === 'denied' ? '❌' : '⏳'}`,
      `💾 로컬 저장소: ${enabledFlag ? '✅ 활성화됨' : '❌ 비활성화됨'}`,
      `🔒 HTTPS: ${window.location.protocol === 'https:' ? '✅ 보안 연결' : '❌ 비보안 연결'}`,
      `🌍 브라우저: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : '기타'}`
    ].join('\n');
    
    setDebugInfo(debug);

    // 서버에서 구독 상태 확인
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.isSubscribed);
      }
    } catch (error) {
      console.error('구독 상태 확인 오류:', error);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (enabled) {
        // 알림 활성화
        const success = await initializePushNotifications();
        if (success) {
          setIsEnabled(true);
          setIsSubscribed(true);
          setMessage({ text: '푸시 알림이 활성화되었습니다.', type: 'success' });
        } else {
          setMessage({ text: '푸시 알림 활성화에 실패했습니다.', type: 'error' });
        }
      } else {
        // 알림 비활성화
        const success = await unsubscribePushNotifications();
        if (success) {
          setIsEnabled(false);
          setIsSubscribed(false);
          setMessage({ text: '푸시 알림이 비활성화되었습니다.', type: 'info' });
        } else {
          setMessage({ text: '푸시 알림 비활성화에 실패했습니다.', type: 'error' });
        }
      }
    } catch (error) {
      console.error('알림 설정 오류:', error);
      setMessage({ text: '알림 설정 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsLoading(false);
      checkNotificationStatus();
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setMessage({ text: '테스트 알림이 전송되었습니다.', type: 'success' });
      } else {
        setMessage({ text: '테스트 알림 전송에 실패했습니다.', type: 'error' });
      }
    } catch (error) {
      console.error('테스트 알림 오류:', error);
      setMessage({ text: '테스트 알림 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { icon: <CheckIcon color="success" />, text: '허용됨', color: 'success' as const };
      case 'denied':
        return { icon: <CancelIcon color="error" />, text: '거부됨', color: 'error' as const };
      default:
        return { icon: <NotificationsIcon color="warning" />, text: '대기중', color: 'warning' as const };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isPushNotificationSupported()) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            이 브라우저는 푸시 알림을 지원하지 않습니다.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon sx={{ mr: 1 }} />
            <Typography variant="h6">푸시 알림 설정</Typography>
          </Box>
          {onClose && (
            <Button size="small" variant="outlined" onClick={onClose}>
              닫기
            </Button>
          )}
        </Box>

        <Stack spacing={2}>
          {/* 브라우저 권한 상태 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              브라우저 권한 상태:
            </Typography>
            <Chip
              icon={permissionStatus.icon}
              label={permissionStatus.text}
              color={permissionStatus.color}
              size="small"
            />
          </Box>

          {/* 구독 상태 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              구독 상태:
            </Typography>
            <Chip
              icon={isSubscribed ? <CheckIcon /> : <CancelIcon />}
              label={isSubscribed ? '구독중' : '미구독'}
              color={isSubscribed ? 'success' : 'default'}
              size="small"
            />
          </Box>

          {/* 알림 활성화/비활성화 스위치 */}
          <FormControlLabel
            control={
              <Switch
                checked={isEnabled && permission === 'granted'}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                disabled={isLoading || permission === 'denied'}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isEnabled ? <NotificationsIcon sx={{ mr: 1 }} /> : <NotificationsOffIcon sx={{ mr: 1 }} />}
                <Typography>
                  결제 요청 알림 받기
                </Typography>
              </Box>
            }
          />

          {/* 테스트 알림 버튼 */}
          {isEnabled && isSubscribed && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TestIcon />}
                onClick={handleTestNotification}
                disabled={isLoading}
              >
                테스트 알림
              </Button>
            </Box>
          )}

          {/* 메시지 표시 */}
          {message && (
            <Alert severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {/* 디버그 정보 */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              🔍 푸시 알림 진단 정보
            </Typography>
            <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
              {debugInfo}
            </Typography>
          </Box>

          {/* 권한이 거부된 경우 안내 */}
          {permission === 'denied' && (
            <Alert severity="warning">
              ❌ 알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.
              <br />
              <Typography variant="caption" color="text.secondary">
                <strong>Chrome:</strong> 주소창 왼쪽 자물쇠 아이콘 → 알림 → 허용<br />
                <strong>Firefox:</strong> 주소창 왼쪽 방패 아이콘 → 알림 → 허용<br />
                <strong>Safari:</strong> Safari → 환경설정 → 웹사이트 → 알림
              </Typography>
            </Alert>
          )}

          {/* HTTPS가 아닌 경우 경고 */}
          {window.location.protocol !== 'https:' && (
            <Alert severity="error">
              ⚠️ 푸시 알림은 HTTPS 환경에서만 작동합니다. 현재 HTTP 연결을 사용 중입니다.
            </Alert>
          )}

          {/* 브라우저 지원하지 않는 경우 */}
          {!isPushNotificationSupported() && (
            <Alert severity="error">
              ❌ 현재 브라우저는 푸시 알림을 지원하지 않습니다. Chrome, Firefox, Edge 등의 최신 브라우저를 사용해주세요.
            </Alert>
          )}

          {/* 도움말 */}
          <Alert severity="info">
            새로운 결제 요청이 있을 때 브라우저 알림을 받으실 수 있습니다.
            알림을 클릭하면 해당 요청으로 바로 이동합니다.
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
