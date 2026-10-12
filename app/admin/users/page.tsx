'use client';

import './users.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type UserRow = {
  id: string;
  username?: string | null;
  email?: string | null;
  balance?: string | number | null;
  totalDeposited?: string | number | null;
  role: string;
  lastSeenAt?: string | null;
  _count?: { orders?: number };
};

const money = (value: string | number | null | undefined) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

const online = (value: string | null | undefined) =>
  Boolean(value) && Date.now() - new Date(value as string).getTime() < 30000;

const seen = (value: string | null | undefined) => {
  if (!value) return 'Chưa hoạt động';
  return online(value) ? 'Đang hoạt động' : new Date(value).toLocaleString('vi-VN');
};

const accountOf = (user: UserRow) => user.username?.trim() || user.email?.trim() || '—';
const emailOf = (user: UserRow) => user.email?.trim() || 'Chưa đăng ký email';

export default function AdminUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'inactive'>('all');
  const [copiedId, setCopiedId] = useState('');

  const load = () =>
    fetch('/api/admin/users', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setRows(data.data || []));

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const list = rows.filter((user) =>
    (!query || `${accountOf(user)} ${user.email || ''}`.toLowerCase().includes(query.toLowerCase())) &&
    (statusFilter === 'all' || (statusFilter === 'online' ? online(user.lastSeenAt) : !online(user.lastSeenAt))),
  );

  const totalBalance = rows.reduce((sum, user) => sum + Number(user.balance || 0), 0);
  const totalDeposited = rows.reduce((sum, user) => sum + Number(user.totalDeposited || 0), 0);
  const onlineCount = rows.filter((user) => online(user.lastSeenAt)).length;

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(''), 1800);
    } catch {
      setCopiedId('');
    }
  }

  async function remove(user: UserRow) {
    const account = accountOf(user);
    if (!confirm(`Xóa tài khoản ${account}?\n\nThao tác này không thể hoàn tác.`)) return;

    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });

    if (response.ok) {
      load();
    } else {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Không thể xóa tài khoản.');
    }
  }

  return (
    <div className="admin-body users-page">
      <section className="users-console-hero">
        <div>
          <span className="users-page-kicker">OPERATIONS / USER DIRECTORY</span>
          <h2>Quản lý người dùng</h2>
          <p>Theo dõi tài khoản, số dư, nạp tiền và hoạt động truy cập trong một màn hình.</p>
        </div>
        <div className="users-hero-actions"><span><i /> Hệ thống đang hoạt động</span><button type="button" onClick={load}>↻ Đồng bộ dữ liệu</button></div>
      </section>

      <section className="users-metric-grid">
        <Metric icon="◎" label="Tổng người dùng" value={String(rows.length)} note={`${onlineCount} đang hoạt động`} tone="blue" />
        <Metric icon="₫" label="Tổng số dư" value={money(totalBalance)} note="Số dư hiện tại" tone="green" />
        <Metric icon="↗" label="Tổng đã nạp" value={money(totalDeposited)} note="Tổng giao dịch thành công" tone="purple" />
        <Metric icon="◌" label="Đang online" value={String(onlineCount)} note="Trong 30 giây gần nhất" tone="orange" />
      </section>

      <section className="users-directory-card">
        <div className="users-directory-head">
          <div><span>ACCOUNT DIRECTORY</span><h3>Danh sách người dùng</h3><p>Mỗi tài khoản được hiển thị thành một hộp thao tác riêng.</p></div>
          <b>{list.length} kết quả</b>
        </div>

        <div className="users-directory-toolbar">
          <label className="users-search"><span>⌕</span><input placeholder="Tìm username hoặc email..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="users-status-filter">
            <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>Tất cả <b>{rows.length}</b></button>
            <button className={statusFilter === 'online' ? 'active' : ''} onClick={() => setStatusFilter('online')}>Online <b>{onlineCount}</b></button>
            <button className={statusFilter === 'inactive' ? 'active' : ''} onClick={() => setStatusFilter('inactive')}>Không hoạt động <b>{Math.max(0, rows.length - onlineCount)}</b></button>
          </div>
          <button type="button" className="users-reset" onClick={() => { setQuery(''); setStatusFilter('all'); }}>Đặt lại</button>
        </div>

        <div className="users-card-grid">
          {list.map((user) => {
            const account = accountOf(user);
            return (
              <article className="user-account-tile" key={user.id}>
                <div className="user-tile-head">
                  <h4>Thao tác</h4>
                  <div className="user-tile-actions">
                    <Link href={'/admin/balance/' + user.id} aria-label="Điều chỉnh số dư" title="Điều chỉnh số dư">±</Link>
                    <Link href={'/admin/users/' + user.id} aria-label="Xem chi tiết" title="Xem chi tiết">◉</Link>
                    <button type="button" onClick={() => copyId(user.id)} aria-label="Sao chép mã người dùng" title="Sao chép mã người dùng">{copiedId === user.id ? '✓' : '⧉'}</button>
                  </div>
                </div>

                <div className="user-tile-identity">
                  <i>{account.slice(0, 2).toUpperCase()}</i>
                  <div><strong>{account}</strong><small>{emailOf(user)}</small></div>
                  <span className="role-badge">{user.role}</span>
                </div>

                <div className="user-tile-rows">
                  <TileRow label="Mã người dùng" value={user.id} action={<button type="button" onClick={() => copyId(user.id)}>{copiedId === user.id ? 'Đã copy' : 'Nhấn để copy'}</button>} />
                  <TileRow label="Số dư" value={money(user.balance)} />
                  <TileRow label="Tổng đã nạp" value={money(user.totalDeposited)} />
                  <TileRow label="Đơn hàng" value={String(user._count?.orders || 0)} />
                  <TileRow label="Hoạt động" value={<span className={'tile-presence ' + (online(user.lastSeenAt) ? 'online' : '')}><i />{seen(user.lastSeenAt)}</span>} last />
                </div>

                <div className="user-tile-footer">
                  <Link href={'/admin/users/' + user.id}>Xem chi tiết <span>→</span></Link>
                  <button type="button" onClick={() => remove(user)}>Xóa tài khoản</button>
                </div>
              </article>
            );
          })}
        </div>
        {!list.length && <div className="users-empty">Không tìm thấy tài khoản phù hợp với bộ lọc.</div>}
      </section>
    </div>
  );
}

function Metric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) {
  return <div className={'users-metric ' + tone}><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>● {note}</small></div></div>;
}

function TileRow({ label, value, action, last = false }: { label: string; value: React.ReactNode; action?: React.ReactNode; last?: boolean }) {
  return <div className={'user-tile-row ' + (last ? 'last' : '')}><span>{label}</span><div><strong>{value}</strong>{action}</div></div>;
}
