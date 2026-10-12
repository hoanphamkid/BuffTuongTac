'use client';

import './user-detail.css';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
  passwordConfigured: boolean;
  _count: { orders: number; deposits: number; transactions: number };
  orders: Order[];
};

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

const dateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';

const accountOf = (user: UserDetail) => user.username?.trim() || user.email?.trim() || '—';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      fetch('/api/admin/users/' + id, { cache: 'no-store' })
        .then(async (response) => {
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || 'Không tải được thông tin người dùng.');
          return result;
        })
        .then((result) => {
          const nextUser = result.data as UserDetail;
          setUser(nextUser || null);
          setSelectedOrderId(nextUser?.orders?.[0]?.id || '');
        })
        .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không tải được thông tin người dùng.'))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const selectedOrder = useMemo(
    () => user?.orders.find((order) => order.id === selectedOrderId) || user?.orders[0] || null,
    [selectedOrderId, user],
  );

  async function copyOrderId() {
    if (!selectedOrder) return;
    try {
      await navigator.clipboard.writeText(selectedOrder.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return <div className="admin-body user-detail-page"><p className="user-detail-loading">Đang tải thông tin người dùng...</p></div>;
  }

  if (error || !user) {
    return (
      <div className="admin-body user-detail-page">
        <Link className="user-detail-back" href="/admin/users">← Quay lại người dùng</Link>
        <div className="user-detail-error">{error || 'Không tìm thấy tài khoản.'}</div>
      </div>
    );
  }

  const account = accountOf(user);

  return (
    <div className="admin-body user-detail-page">
      <div className="user-detail-topbar">
        <div>
          <p className="user-detail-crumb">Người dùng <span>›</span> Chi tiết tài khoản</p>
          <h2>Chi tiết người dùng</h2>
          <p className="user-detail-sub">Xem thông tin tài khoản và các đơn hàng đã tạo</p>
        </div>
        <Link className="user-detail-back" href="/admin/users">← Quay lại</Link>
      </div>

      <section className="user-detail-identity">
        <div className="user-detail-avatar">{account.slice(0, 2).toUpperCase()}</div>
        <div className="user-detail-identity-copy">
          <h1>{account} <span className="user-role-pill">{user.role}</span></h1>
          <p>{user.email || 'Chưa đăng ký email'}</p>
          <small>ID: {user.id} <span>·</span> Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</small>
        </div>
        <Link className="user-balance-link" href={'/admin/balance/' + user.id}>＋ Cộng/Trừ số dư</Link>
      </section>

      <div className="user-detail-layout">
        <section className="user-action-card" aria-labelledby="user-action-title">
          <div className="user-action-head">
            <h2 id="user-action-title">Thao tác</h2>
            <div className="user-action-buttons">
              <Link href={'/admin/balance/' + user.id} aria-label="Điều chỉnh số dư" title="Điều chỉnh số dư">↗</Link>
              <Link href="/admin/transactions" aria-label="Mở giao dịch" title="Mở giao dịch">Ø</Link>
              <button type="button" onClick={() => window.location.reload()} aria-label="Tải lại" title="Tải lại">ϟ</button>
            </div>
          </div>

          {selectedOrder ? (
            <div className="user-order-detail">
              <DetailRow label="Mã đơn hàng" value={selectedOrder.id} action={<button type="button" className="copy-order" onClick={copyOrderId}>{copied ? 'Đã copy' : 'Nhấn để copy'}</button>} />
              <DetailRow label="Dịch vụ" value={selectedOrder.service?.name || 'Dịch vụ'} accent={selectedOrder.service?.platform?.icon || '✓'} />
              <DetailRow label="Cảm xúc" value={selectedOrder.reaction || '—'} />
              <DetailRow label="Server" value={selectedOrder.server?.name || '—'} />
              <DetailRow label="Giá" value={money(selectedOrder.price)} />
              <DetailRow label="Số lượng" value={Number(selectedOrder.quantity).toLocaleString('vi-VN')} />
              <DetailRow label="Tổng tiền" value={money(selectedOrder.price)} />
              <DetailRow label="Link order" value={<a className="order-link" href={selectedOrder.link} target="_blank" rel="noreferrer">{selectedOrder.link}</a>} />
              <DetailRow label="Trạng thái" value={<span className={'order-status ' + statusTone(selectedOrder.status)}>{statusLabel(selectedOrder.status)}</span>} />
              <DetailRow label="Thời gian mua" value={dateTime(selectedOrder.createdAt)} last />
            </div>
          ) : (
            <div className="user-no-order"><strong>Chưa có đơn hàng</strong><span>Tài khoản này chưa phát sinh đơn hàng nào.</span></div>
          )}
        </section>

        <aside className="user-side-column">
          <section className="user-account-summary">
            <div className="user-summary-head"><span>TÀI KHOẢN</span><b>{user.role}</b></div>
            <h3>{account}</h3>
            <p>{user.email || 'Chưa đăng ký email'}</p>
            <SummaryRow label="Số dư hiện tại" value={money(user.balance)} positive />
            <SummaryRow label="Tổng đã nạp" value={money(user.totalDeposited)} />
            <SummaryRow label="Đơn hàng" value={String(user._count?.orders || 0)} />
            <SummaryRow label="Hoạt động lần cuối" value={dateTime(user.lastSeenAt)} last />
          </section>

          <section className="user-order-list">
            <div className="user-order-list-head"><span>ĐƠN HÀNG CỦA {account.toUpperCase()}</span><b>{user.orders.length}</b></div>
            {user.orders.map((order, index) => (
              <button
                type="button"
                key={order.id}
                className={'user-order-choice ' + (order.id === (selectedOrder?.id || '') ? 'selected' : '')}
                onClick={() => { setSelectedOrderId(order.id); setCopied(false); }}
              >
                <i>{String(index + 1).padStart(2, '0')}</i>
                <span><strong>{order.service?.name || 'Dịch vụ'}</strong><small>#{order.id.slice(-12)} · {dateTime(order.createdAt)}</small></span>
                <em className={statusTone(order.status)}>{statusLabel(order.status)}</em>
              </button>
            ))}
            {!user.orders.length && <p className="user-orders-empty">Chưa có đơn hàng.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value, accent, action, last = false }: { label: string; value: React.ReactNode; accent?: string; action?: React.ReactNode; last?: boolean }) {
  return (
    <div className={'user-detail-row ' + (last ? 'last' : '')}>
      <span>{label}</span>
      <div className="user-detail-value">
        {accent && <i className="service-accent">{accent}</i>}
        <strong>{value}</strong>
        {action}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, positive = false, last = false }: { label: string; value: string; positive?: boolean; last?: boolean }) {
  return <p className={'user-summary-row ' + (last ? 'last' : '')}><span>{label}</span><b className={positive ? 'positive' : ''}>{value}</b></p>;
}

function statusTone(status: string) {
  if (status === 'COMPLETED') return 'completed';
  if (['FAILED', 'CANCELED', 'REFUNDED'].includes(status)) return 'failed';
  if (['PROCESSING', 'IN_PROGRESS', 'PENDING'].includes(status)) return 'processing';
  return 'partial';
}
