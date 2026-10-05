'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { MobileWallet } from './MobileWallet';
import { clearOrderDraft } from '@/lib/order-draft';

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, clearUser } = useCurrentUser();
  if (path === '/' || path === '/login' || path === '/register' || path.startsWith('/admin')) return <>{children}</>;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (user?.id) { try { clearOrderDraft(window.sessionStorage, user.id); } catch { /* Storage can be blocked. */ } }
    clearUser();
    router.push('/login');
  }

  return (
    <div className="shell customer-shell">
      <aside>
        <Link className="brand" href="/account">KID <span>Social</span></Link>
        <div className="user">
          <div className="avatar">{user?.username?.slice(0, 2).toUpperCase() || 'K'}</div>
          <div><b>{user?.username || 'Tài khoản'}</b><small>Số dư: {user?.balance || '0'}đ</small></div>
        </div>
        <nav>
          <label>DỊCH VỤ & ĐƠN HÀNG</label>
          {[
            ['Tạo đơn mới', '/'], ['Đơn hàng hàng loạt', '/mass-order'],
            ['Lịch sử đơn hàng', '/orders'], ['Danh sách dịch vụ', '/services'], ['Hỗ trợ', '/support'],
          ].map(([label, href]) => (
            <button key={href} className={path === href ? 'active' : ''} onClick={() => router.push(href)}>◈ {label}</button>
          ))}
          <label>TÀI KHOẢN</label>
          {[
            ['Tài khoản của tôi', '/account'], ['Nạp tiền', '/add-funds'], ['Lịch sử hoàn tiền', '/refunds'],
          ].map(([label, href]) => (
            <button key={href} className={path === href ? 'active' : ''} onClick={() => router.push(href)}>◈ {label}</button>
          ))}
          <button onClick={logout}>◈ Đăng xuất</button>
        </nav>
      </aside>
      <main className="customer-main">
        <MobileWallet />
        {path === '/add-funds' && <Link className="order-return-link" href="/">← Quay lại đơn đang nhập</Link>}
        {children}
      </main>
    </div>
  );
}
