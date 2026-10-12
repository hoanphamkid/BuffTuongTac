'use client';

import './user-detail.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { statusLabel } from '@/lib/status-label';

type Order = {
  id: string;
  link: string;
  quantity: number;
  price: number | string;
  status: string;
  label?: string | null;
  reaction?: string | null;
  providerOrderId?: string | null;
  createdAt: string;
  service?: { name: string; platform?: { name: string; icon?: string | null } } | null;
  server?: { name: string } | null;
};

type UserDetail = {
  id: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  balance: number | string;
  totalDeposited: number | string;
  role: string;
  createdAt: string;
  lastSeenAt?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  lastLoginUserAgent?: string | null;
  lastLoginLocation?: string | null;
  passwordConfigured: boolean;
  _count: { orders: number; deposits: number; transactions: number };
  orders: Order[];
};

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

const dateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa ghi nhận';

const accountOf = (user: UserDetail) => user.username?.trim() || user.email?.trim() || '—';

function deviceOf(userAgent: string | null | undefined) {
  if (!userAgent) return 'Chưa ghi nhận';
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'Apple iPhone/iPad';
  if (/Android/i.test(userAgent)) return 'Điện thoại Android';
  if (/Windows/i.test(userAgent)) return 'Máy tính Windows';
  if (/Macintosh|Mac OS/i.test(userAgent)) return 'Máy Mac';
  if (/Linux/i.test(userAgent)) return 'Máy tính Linux';
  return 'Thiết bị không xác định';
}

function browserOf(userAgent: string | null | undefined) {
  if (!userAgent) return 'Không xác định';
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/Chrome\//i.test(userAgent)) return 'Google Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Mozilla Firefox';
  if (/Safari\//i.test(userAgent)) return 'Safari';
  return 'Trình duyệt khác';
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    params.then(({ id }) => {
      fetch('/api/admin/users/' + id, { cache: 'no-store' })
        .then(async (response) => {
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || 'Không tải được thông tin người dùng.');
          return result;
        })
        .then((result) => setUser(result.data || null))
        .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không tải được thông tin người dùng.'))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function copyOrderId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(''), 1800);
    } catch {
      setCopiedId('');
    }
  }

  if (loading) return <div className="admin-body user-detail-page"><p className="detail-loading">Đang tải hồ sơ người dùng...</p></div>;
  if (error || !user) {
    return <div className="admin-body user-detail-page"><Link className="detail-back" href="/admin/users">← Quay lại người dùng</Link><div className="detail-error">{error || 'Không tìm thấy tài khoản.'}</div></div>;
  }

  const account = accountOf(user);
  const loginLocation = user.lastLoginLocation || user.lastLoginIp || 'Chưa ghi nhận';

  return (
    <div className="admin-body user-detail-page">
      <div className="detail-page-head">
        <div><span className="detail-eyebrow">ACCOUNT INTELLIGENCE / USER PROFILE</span><h2>Chi tiết người dùng</h2><p>Hồ sơ tài khoản, bảo mật truy cập và toàn bộ lịch sử đơn hàng.</p></div>
        <Link className="detail-back" href="/admin/users">← Danh sách người dùng</Link>
      </div>

      <section className="profile-banner">
        <div className="profile-avatar">{account.slice(0, 2).toUpperCase()}</div>
        <div className="profile-copy"><h1>{account}<span className="role-chip">{user.role}</span></h1><p>{user.email || 'Chưa đăng ký email'}</p><small>ID {user.id} · Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</small></div>
        <Link className="balance-cta" href={'/admin/balance/' + user.id}>＋ Cộng / Trừ số dư</Link>
      </section>

      <div className="profile-stat-grid">
        <StatCard label="Số dư hiện tại" value={money(user.balance)} tone="mint" />
        <StatCard label="Tổng đã nạp" value={money(user.totalDeposited)} tone="cyan" />
        <StatCard label="Tổng đơn hàng" value={String(user._count?.orders || 0)} tone="violet" />
        <StatCard label="Giao dịch số dư" value={String(user._count?.transactions || 0)} tone="amber" />
      </div>

      <div className="intel-grid">
        <section className="intel-card account-card">
          <CardHeading eyebrow="ACCOUNT & SECURITY" title="Tài khoản và mật khẩu" />
          <InfoRow label="Tên tài khoản" value={account} />
          <InfoRow label="Email" value={user.email || 'Chưa đăng ký email'} />
          <InfoRow label="Họ tên" value={user.fullName || account} />
          <InfoRow label="Vai trò" value={<span className="role-chip small">{user.role}</span>} />
          <div className="password-state"><span className={'state-dot ' + (user.passwordConfigured ? 'on' : '')} /><div><strong>{user.passwordConfigured ? 'Mật khẩu đã được thiết lập' : 'Chưa có mật khẩu'}</strong><small>Vì lý do bảo mật, hệ thống chỉ lưu mật khẩu đã mã hóa nên không thể xem mật khẩu gốc.</small></div></div>
        </section>

        <section className="intel-card access-card">
          <CardHeading eyebrow="ACCESS MONITOR" title="Thiết bị và nơi đăng nhập" />
          <div className="login-location"><span className="location-icon">⌖</span><div><small>Lần đăng nhập gần nhất</small><strong>{loginLocation}</strong></div></div>
          <InfoRow label="Thiết bị" value={deviceOf(user.lastLoginUserAgent)} />
          <InfoRow label="Trình duyệt" value={browserOf(user.lastLoginUserAgent)} />
          <InfoRow label="Địa chỉ IP" value={user.lastLoginIp || 'Chưa ghi nhận'} />
          <InfoRow label="Thời gian đăng nhập" value={dateTime(user.lastLoginAt)} />
          <InfoRow label="Hoạt động gần nhất" value={dateTime(user.lastSeenAt)} last />
        </section>
      </div>

      <section className="history-card">
        <div className="history-head"><div><span className="detail-eyebrow">ORDER ARCHIVE</span><h2>Lịch sử tất cả đơn hàng</h2><p>Hiển thị toàn bộ đơn trước đây của {account} theo thời gian mới nhất.</p></div><b>{user.orders.length} đơn</b></div>
        {user.orders.length ? <div className="history-list">{user.orders.map((order) => <OrderHistoryCard key={order.id} order={order} copied={copiedId === order.id} onCopy={copyOrderId} />)}</div> : <div className="history-empty">Tài khoản này chưa có đơn hàng nào.</div>}
      </section>
    </div>
  );
}

function CardHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="intel-heading"><span>{eyebrow}</span><h2>{title}</h2></div>;
}

function InfoRow({ label, value, last = false }: { label: string; value: React.ReactNode; last?: boolean }) {
  return <div className={'info-row ' + (last ? 'last' : '')}><span>{label}</span><strong>{value}</strong></div>;
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className={'profile-stat ' + tone}><span>{label}</span><strong>{value}</strong><small>ACCOUNT DATA</small></div>;
}

function OrderHistoryCard({ order, copied, onCopy }: { order: Order; copied: boolean; onCopy: (id: string) => void }) {
  return <article className="history-order">
    <div className="history-order-head"><div><span className="order-code">#{order.id.slice(-12)}</span><small>{new Date(order.createdAt).toLocaleString('vi-VN')}</small></div><span className={'history-status ' + statusTone(order.status)}>{statusLabel(order.status)}</span></div>
    <div className="history-order-grid">
      <HistoryValue label="Dịch vụ" value={<><span className="service-icon">{order.service?.platform?.icon || '◉'}</span>{order.service?.name || 'Dịch vụ'}</>} />
      <HistoryValue label="Server" value={order.server?.name || '—'} />
      <HistoryValue label="Số lượng" value={Number(order.quantity).toLocaleString('vi-VN')} />
      <HistoryValue label="Giá" value={new Intl.NumberFormat('vi-VN').format(Number(order.price) || 0) + 'đ'} />
      <HistoryValue label="Tổng tiền" value={new Intl.NumberFormat('vi-VN').format(Number(order.price) || 0) + 'đ'} highlight />
      <HistoryValue label="Cảm xúc" value={order.reaction || '—'} />
    </div>
    <div className="history-link-row"><span>Link order</span><a href={order.link} target="_blank" rel="noreferrer">{order.link}</a></div>
    <div className="history-order-foot"><span>Mã đơn: {order.id}</span><button type="button" onClick={() => onCopy(order.id)}>{copied ? '✓ Đã copy' : '⧉ Copy mã đơn'}</button></div>
  </article>;
}

function HistoryValue({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return <div className="history-value"><span>{label}</span><strong className={highlight ? 'highlight' : ''}>{value}</strong></div>;
}

function statusTone(status: string) {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'REFUNDED') return 'refunded';
  if (['FAILED', 'CANCELED'].includes(status)) return 'failed';
  if (['PROCESSING', 'IN_PROGRESS', 'PENDING'].includes(status)) return 'processing';
  return 'partial';
}
