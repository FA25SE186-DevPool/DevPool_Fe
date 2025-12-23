import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/styles/global.css'
import App from './App.tsx'
import { NotificationProvider, useNotification } from './context/NotificationContext'
import { startNotificationConnection, onReceiveNotification, onUnreadCountUpdated, getUnreadCount, offReceiveNotification, offUnreadCountUpdated } from './services/notificationHub'

function RealtimeBootstrap() {
  const { setUnread, pushItem } = useNotification();
  const handlersRef = useRef<{ onMsg?: (n:any)=>void; onCount?: (c:number)=>void }>({});
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Kiểm tra token từ localStorage
    const token = localStorage.getItem('accessToken');
    if (!token || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    // Delay longer to avoid conflicts and let app fully load first
    const initTimer = setTimeout(() => {
      // Start notification connection asynchronously (don't block app rendering)
      startNotificationConnection().then(async () => {
      try {
        const count = await getUnreadCount();
        if (typeof count === 'number') setUnread(count);
      } catch {}
      // Hủy đăng ký cũ (nếu có) để tránh nhân đôi handler khi StrictMode dev chạy 2 lần
      if (handlersRef.current.onMsg) {
        offReceiveNotification(handlersRef.current.onMsg);
      }
      if (handlersRef.current.onCount) {
        offUnreadCountUpdated(handlersRef.current.onCount);
      }
      // Đăng ký handler mới và lưu reference để có thể off đúng
      const onMsg = (n: any) => {
        // pushItem sẽ tự động tăng unread nếu notification chưa đọc
        pushItem(n);
        try {
          // Cập nhật localStorage và phát sự kiện cho Navbar legacy (nếu có)
          const key = 'notification_items';
          const prev = JSON.parse(localStorage.getItem(key) || '[]');
          const next = [n, ...prev].slice(0, 50);
          localStorage.setItem(key, JSON.stringify(next));
          window.dispatchEvent(new CustomEvent('notification_received', { detail: n }));
        } catch {}
      };
      const onCount = (count: number) => {
        if (typeof count === 'number') setUnread(count);
        try {
          localStorage.setItem('notification_unread', String(count));
          window.dispatchEvent(new CustomEvent('notification_unread_changed', { detail: { unread: count } }));
        } catch {}
      };
      handlersRef.current.onMsg = onMsg;
      handlersRef.current.onCount = onCount;
      onReceiveNotification(onMsg);
      onUnreadCountUpdated(onCount);
      }).catch(() => {
        // Silently ignore notification connection errors to not block app loading
      });
    }, 3000); // Delay 3 seconds to let app fully load

    // Cleanup: gỡ handler khi unmount để tránh trùng lặp
    return () => {
      clearTimeout(initTimer);
      if (handlersRef.current.onMsg) {
        offReceiveNotification(handlersRef.current.onMsg);
        handlersRef.current.onMsg = undefined;
      }
      if (handlersRef.current.onCount) {
        offUnreadCountUpdated(handlersRef.current.onCount);
        handlersRef.current.onCount = undefined;
      }
    };
  }, [setUnread, pushItem]);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <RealtimeBootstrap />
      <App />
    </NotificationProvider>
  </StrictMode>,
)
