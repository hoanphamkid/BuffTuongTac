'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type NavItem = { label: string; href: string; icon: string };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [{ label: 'Tổng quan', href: '/admin', icon: '⌂' }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Người dùng', href: '/admin/users', icon: '♙' },
      { label: 'Nạp tiền', href: '/admin/deposits', icon: '₫' },
      { label: 'Giao dịch', href: '/admin/transactions', icon: '↔' },
      { label: 'Hoàn tiền', href: '/admin/refunds', icon: '↶' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Dịch vụ & giá', href: '/admin/services', icon: '◈' },
      { label: 'KEY dùng thử', href: '/admin/trial-keys', icon: '⚿' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Thông báo', href: '/admin/notifications', icon: '♧' },
      { label: 'Nhà cung cấp', href: '/admin/provider', icon: '◫' },
      { label: 'Cài đặt', href: '/admin/settings', icon: '⚙' },
    ],
  },
];

const pageTitles: Array<[string, string]> = [
  ['/admin/users/', 'Chi tiết người dùng'],
  ['/admin/balance/', 'Điều chỉnh số dư'],
  ['/admin/order-prices', 'Dịch vụ & giá'],
  ['/admin/services', 'Dịch vụ & giá'],
  ['/admin/transactions', 'Giao dịch'],
  ['/admin/deposits', 'Nạp tiền'],
  ['/admin/users', 'Người dùng'],
  ['/admin/trial-keys', 'KEY dùng thử'],
  ['/admin/refunds', 'Hoàn tiền'],
  ['/admin/notifications', 'Thông báo'],
  ['/admin/provider', 'Nhà cung cấp'],
  ['/admin/settings', 'Cài đặt'],
];

export function AdminLayout({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin: { username: string; email: string };
}) {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => setMenuOpen(false), [path]);

  const isActive = (href: string) =>
    href === '/admin' ? path === href : path === href || path.startsWith(`${href}/`);

  const title = path === '/admin'
    ? 'Tổng quan'
    : pageTitles.find(([prefix]) => path === prefix || path.startsWith(prefix))?.[1] || 'Quản trị hệ thống';

  const refreshPage = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.location.reload();
  };

  const initials = (admin.username || 'AD').slice(0, 2).toUpperCase();

  return (
    <div className={'admin ' + (menuOpen ? 'admin-menu-open' : '')}>
      <button
        className="admin-menu-toggle"
        aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((value) => !value)}
      >
        {menuOpen ? '×' : '☰'}
      </button>
      {menuOpen && <button className="admin-menu-backdrop" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}

      <aside className="admin-side">
        <div className="admin-brand">
          <b>K</b>
          <div><strong>KID Social</strong><small>ADMIN CONSOLE · v2.0</small></div>
        </div>

        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          {navGroups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <h5>{group.label}</h5>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? 'active' : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  <i>{item.icon}</i><span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-profile">
          <i>{initials}</i>
          <div><b>{admin.username}</b><span>{admin.email}</span></div>
          <em>ADMIN</em>
        </div>
        <button className="admin-back" onClick={() => router.push('/')}><i>↩</i><span>Trang người dùng</span></button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div className="admin-header-copy">
            <span>ADMIN CONSOLE / KID SOCIAL</span>
            <h1>{title}</h1>
            <p>Vận hành hệ thống · dữ liệu cập nhật theo thời gian thực</p>
          </div>
          <div className="admin-header-actions">
            <span className="admin-live"><i /> LIVE</span>
            <button type="button" className={'admin-refresh ' + (refreshing ? 'is-refreshing' : '')} onClick={refreshPage} disabled={refreshing} aria-label="Làm mới dữ liệu">
              ↻ <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
            <button className="bell" aria-label="Thông báo">♧</button>
            <span className="admin-header-avatar">{initials}</span>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
