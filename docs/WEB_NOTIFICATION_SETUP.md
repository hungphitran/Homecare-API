# Hướng dẫn cấu hình thông báo cho Web Client

## 1. Cài đặt Firebase SDK cho web

```bash
npm install firebase
```

## 2. Cấu hình Firebase trong web app

Tạo file `firebase-config.js`:

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export { messaging };
```

## 3. Tạo Service Worker

Tạo file `firebase-messaging-sw.js` trong thư mục `public/`:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png', // Đường dẫn đến icon của bạn
    badge: '/badge-72x72.png',
    tag: payload.data?.orderId || 'default',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Xem chi tiết'
      },
      {
        action: 'close',
        title: 'Đóng'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    // Điều hướng đến trang chi tiết đơn hàng
    const orderId = event.notification.data?.orderId;
    const url = orderId ? `/request/${orderId}` : '/';
    
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        // Kiểm tra xem có tab nào đang mở không
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Mở tab mới nếu không có tab nào phù hợp
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});
```

## 4. Tạo Notification Manager

Tạo file `notificationManager.js`:

```javascript
// notificationManager.js
import { messaging } from './firebase-config.js';
import { getToken, onMessage } from 'firebase/messaging';

class NotificationManager {
  constructor() {
    this.token = null;
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Trình duyệt không hỗ trợ thông báo');
      return false;
    }

    try {
      // Đăng ký service worker
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Yêu cầu quyền thông báo
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Người dùng từ chối quyền thông báo');
        return false;
      }

      // Lấy FCM token
      await this.getFCMToken();
      
      // Lắng nghe thông báo khi app đang mở
      this.setupForegroundMessageListener();
      
      return true;
    } catch (error) {
      console.error('Lỗi khởi tạo thông báo:', error);
      return false;
    }
  }

  async requestPermission() {
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }
    
    return Notification.permission;
  }

  async getFCMToken() {
    try {
      const vapidKey = 'YOUR_VAPID_KEY'; // Lấy từ Firebase Console
      
      this.token = await getToken(messaging, { 
        vapidKey: vapidKey 
      });
      
      if (this.token) {
        console.log('FCM Token:', this.token);
        await this.registerTokenWithServer();
      } else {
        console.warn('Không thể lấy FCM token');
      }
    } catch (error) {
      console.error('Lỗi khi lấy FCM token:', error);
    }
  }

  async registerTokenWithServer(phone = null, userId = null) {
    if (!this.token) return;

    try {
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Nếu có JWT
        },
        body: JSON.stringify({
          token: this.token,
          platform: 'web',
          phone: phone,
          userId: userId
        })
      });

      if (response.ok) {
        console.log('Token đã được đăng ký thành công');
      } else {
        console.error('Lỗi đăng ký token:', await response.text());
      }
    } catch (error) {
      console.error('Lỗi kết nối server:', error);
    }
  }

  setupForegroundMessageListener() {
    onMessage(messaging, (payload) => {
      console.log('Nhận thông báo khi app đang mở:', payload);
      
      // Hiển thị thông báo custom hoặc native
      this.showForegroundNotification(payload);
    });
  }

  showForegroundNotification(payload) {
    // Tùy chọn 1: Hiển thị thông báo native
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icon-192x192.png',
        tag: payload.data?.orderId || 'default',
        data: payload.data
      });

      notification.onclick = () => {
        // Điều hướng đến trang chi tiết
        if (payload.data?.orderId) {
          window.location.href = `/request/${payload.data.orderId}`;
        }
        notification.close();
      };
    }

    // Tùy chọn 2: Hiển thị toast/banner tùy chỉnh
    this.showCustomToast(payload);
  }

  showCustomToast(payload) {
    // Tạo element thông báo tùy chỉnh
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-header">
        <strong>${payload.notification.title}</strong>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
      <div class="toast-body">
        ${payload.notification.body}
      </div>
      <div class="toast-actions">
        <button class="btn-primary" onclick="window.location.href='/request/${payload.data?.orderId || ''}'">
          Xem chi tiết
        </button>
        <button class="btn-secondary" onclick="this.parentElement.parentElement.remove()">
          Đóng
        </button>
      </div>
    `;

    // Thêm styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 350px;
      font-family: Arial, sans-serif;
    `;

    document.body.appendChild(toast);

    // Tự động xóa sau 10 giây
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.remove();
      }
    }, 10000);
  }

  async subscribeToTopic(topic) {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          topic: topic
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Lỗi subscribe topic:', error);
      return false;
    }
  }

  async unsubscribeFromTopic(topic) {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          topic: topic
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Lỗi unsubscribe topic:', error);
      return false;
    }
  }
}

export default NotificationManager;
```

## 5. Sử dụng trong ứng dụng

```javascript
// app.js hoặc main.js
import NotificationManager from './notificationManager.js';

const notificationManager = new NotificationManager();

// Khởi tạo khi app load
document.addEventListener('DOMContentLoaded', async () => {
  const initialized = await notificationManager.init();
  
  if (initialized) {
    console.log('Thông báo đã được cấu hình');
    
    // Đăng ký token với số điện thoại người dùng (nếu đã đăng nhập)
    const userPhone = getUserPhone(); // Hàm lấy SĐT từ session/localStorage
    if (userPhone) {
      await notificationManager.registerTokenWithServer(userPhone);
    }
    
    // Subscribe vào topic chung (nếu cần)
    await notificationManager.subscribeToTopic('homecare-broadcast');
  }
});

function getUserPhone() {
  // Lấy số điện thoại từ localStorage, session, hoặc API
  return localStorage.getItem('userPhone') || null;
}
```

## 6. CSS cho Custom Toast

Thêm CSS để làm đẹp thông báo:

```css
/* styles.css */
.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 9999;
  max-width: 350px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-header {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toast-header strong {
  color: #212529;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: #212529;
}

.toast-body {
  padding: 16px;
  color: #495057;
  font-size: 14px;
  line-height: 1.4;
}

.toast-actions {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-primary, .btn-secondary {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}
```

## 7. Lấy VAPID Key và Web Push certificates

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project của bạn
3. Vào **Project Settings** > **Cloud Messaging**
4. Trong tab **Web configuration**, tạo **Web Push certificates**
5. Copy **Key pair** (VAPID key) để sử dụng trong code

## 8. Kiểm tra và Debug

- Mở Developer Tools > Application > Service Workers để xem SW đã đăng ký chưa
- Vào Console để xem log FCM token
- Test bằng cách gọi API `/api/notifications/test` với phone number
- Kiểm tra Network tab khi gọi `/api/notifications/register`

## Lưu ý quan trọng

1. **HTTPS required**: Web Push chỉ hoạt động trên HTTPS (trừ localhost)
2. **User interaction**: Phải có tương tác của user mới có thể request permission
3. **Token refresh**: FCM token có thể thay đổi, cần handle event `onTokenRefresh`
4. **Cross-origin**: Service Worker phải cùng origin với web app
5. **Browser support**: Không phải tất cả trình duyệt đều hỗ trợ đầy đủ

## Troubleshooting

- **"Registration token not registered"**: Token đã expire, cần refresh
- **"Permission denied"**: User chưa cấp quyền thông báo
- **"Service worker registration failed"**: Kiểm tra đường dẫn SW file
- **"Firebase not initialized"**: Kiểm tra cấu hình Firebase ở server
