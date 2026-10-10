'use client';

import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './notification-bell.module.css';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const pushPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

async function registerPushSubscription() {
  if (!pushPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window) || !window.isSecureContext) return false;

  const registration = await navigator.serviceWorker.register('/sw.js');
  const current = await registration.pushManager.getSubscription();
  const subscription = current || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(pushPublicKey) as BufferSource,
  });
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  });
  return response.ok;
}

export function NotificationBell() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [desktopReady, setDesktopReady] = useState(false);
  const knownIds = useRef(new Set<string>());
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(window.Notification.permission);
  }, []);

  useEffect(() => {
    if (!user || permission !== 'granted' || pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) return;
    registerPushSubscription().then(setDesktopReady).catch(() => setDesktopReady(false));
  }, [pathname, permission, user?.id]);

  useEffect(() => {
    if (!user || pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) return;

    knownIds.current = new Set();
    initialized.current = false;
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;

        const nextItems: NotificationItem[] = data.data || [];
        const newItems = initialized.current ? nextItems.filter((item) => !knownIds.current.has(item.id)) : [];
        nextItems.forEach((item) => knownIds.current.add(item.id));
        initialized.current = true;
        setItems(nextItems);
        setUnreadCount(Number(data.unreadCount) || 0);

        if (document.visibilityState === 'hidden' && permission === 'granted') {
          newItems.slice(0, 3).forEach((item) => {
            new window.Notification(item.title, { body: item.message, icon: '/kid-social-logo-dark.png' });
          });
        }
      } catch {
        // The bell is non-blocking; a temporary notification request failure should not affect the page.
      }
    };

    load();
    const timer = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pathname, permission, user?.id]);

  if (!user || pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) return null;

  async function markRead(id: string) {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function markAllRead() {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (!response.ok) return;
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  }

  async function enableDesktopNotifications() {
    if (!('Notification' in window)) return;
    const nextPermission = await window.Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission === 'granted') {
      registerPushSubscription().then(setDesktopReady).catch(() => setDesktopReady(false));
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.bell}
        aria-label={unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg className={styles.bellIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && <b>{unreadCount > 99 ? '99+' : unreadCount}</b>}
      </button>

      {open && (
        <section className={styles.panel} aria-label="Thông báo">
          <div className={styles.heading}>
            <div>
              <strong>Thông báo</strong>
              <small>{unreadCount ? `${unreadCount} chưa đọc` : 'Bạn đã xem hết'}</small>
            </div>
            {unreadCount > 0 && <button type="button" onClick={markAllRead}>Đọc tất cả</button>}
          </div>

          {permission === 'default' && (
            <button type="button" className={styles.enable} onClick={enableDesktopNotifications}>
              Bật thông báo trên máy
            </button>
          )}
          {permission === 'granted' && desktopReady && <p className={styles.ready}>✓ Đã bật thông báo trên máy này</p>}
          {permission === 'granted' && !desktopReady && !pushPublicKey && <p className={styles.permissionNote}>Thiếu khóa VAPID trên máy chủ, chưa thể bật push.</p>}
          {permission === 'denied' && <p className={styles.permissionNote}>Trình duyệt đang chặn thông báo. Hãy bật lại quyền trong cài đặt trang web.</p>}

          <div className={styles.list}>
            {items.length === 0 ? (
              <p className={styles.empty}>Chưa có thông báo mới.</p>
            ) : items.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`${styles.item} ${item.readAt ? '' : styles.unread}`}
                onClick={() => {
                  void markRead(item.id);
                  if (item.orderId) window.location.href = `/orders/${encodeURIComponent(item.orderId)}`;
                }}
              >
                <span className={styles.icon}>{item.type === 'ORDER_REFUNDED' ? '↶' : '✓'}</span>
                <span className={styles.copy}>
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <small>{formatDate(item.createdAt)}</small>
                </span>
                {!item.readAt && <i className={styles.dot} aria-label="Chưa đọc" />}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
