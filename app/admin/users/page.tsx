'use client';

import './users.css';
import { useEffect, useState } from 'react';

type UserRow = {
  id: string;
  username?: string | null;
  email?: string | null;
  balance?: string | number | null;
  totalDeposited?: string | number | null;
  role: string;
  lastSeenAt?: string | null;
};

const money = (value: string | number | null | undefined) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

const online = (value: string | null | undefined) =>
  Boolean(value) && Date.now() - new Date(value as string).getTime() < 30000;

const seen = (value: string | null | undefined) => {
  if (!value) return 'Chưa hoạt động';
  return online(value) ? 'Đang hoạt động' : new Date(value).toLocaleString('vi-VN');
};

// Email is optional now, so the account shown in the admin table must not rely on it.
const accountOf = (user: UserRow) => user.username?.trim() || user.email?.trim() || '—';

const emailOf = (user: UserRow) => {
  const email = user.email?.trim();
  return email || accountOf(user);
};

export default function AdminUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'inactive'>('all');

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

  async function remove(user: UserRow) {
    const account = accountOf(user);
    if (!confirm(`Xóa tài khoản ${account}?\n\nThao tác này không thể hoàn tác.`)) return;

    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });

    if (response.ok) {
      setOpen('');
      load();
    } else {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Không thể xóa tài khoản.');
    }
  }

  return (
    <div className="admin-body users-page">
      <section className="users-console-hero">
        <div><span className="users-page-kicker">OPERATIONS / USER DIRECTORY</span><h2>Quản lý người dùng</h2><p>Theo dõi tài khoản, số dư, nạp tiền và hoạt động truy cập trong một màn hình.</p></div>
        <div className="users-hero-actions"><span><i /> Hệ thống đang hoạt động</span><button type="button" onClick={load}>↻ Đồng bộ dữ liệu</button></div>
      </section>

      <section className="users-metric-grid">
        <Metric icon="◎" label="Tổng người dùng" value={String(rows.length)} note={`${onlineCount} đang hoạt động`} tone="blue" />
        <Metric icon="₫" label="Tổng số dư" value={money(totalBalance)} note="Số dư hiện tại" tone="green" />
        <Metric icon="↗" label="Tổng đã nạp" value={money(totalDeposited)} note="Tổng giao dịch thành công" tone="purple" />
        <Metric icon="◌" label="Đang online" value={String(onlineCount)} note="Trong 30 giây gần nhất" tone="orange" />
      </section>

      <section className="admin-card users-directory-card">
        <div className="users-directory-head"><div><span>ACCOUNT DIRECTORY</span><h3>Danh sách tài khoản</h3><p>Chọn một tài khoản để xem chi tiết hoặc điều chỉnh số dư.</p></div><b>{list.length} kết quả</b></div>
        <div className="users-directory-toolbar">
          <label className="users-search"><span>⌕</span><input placeholder="Tìm username hoặc email..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="users-status-filter"><button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>Tất cả <b>{rows.length}</b></button><button className={statusFilter === 'online' ? 'active' : ''} onClick={() => setStatusFilter('online')}>Online <b>{onlineCount}</b></button><button className={statusFilter === 'inactive' ? 'active' : ''} onClick={() => setStatusFilter('inactive')}>Không hoạt động <b>{Math.max(0, rows.length - onlineCount)}</b></button></div>
          <button type="button" className="users-reset" onClick={() => { setQuery(''); setStatusFilter('all'); }}>Đặt lại</button>
        </div>

        <div className="users-table-scroll">
          <table className="admin-table users-table">
            <thead><tr><th>TÀI KHOẢN</th><th>ID</th><th>TỔNG ĐÃ NẠP</th><th>SỐ DƯ</th><th>VAI TRÒ</th><th>HOẠT ĐỘNG</th><th>THAO TÁC</th></tr></thead>
            <tbody>{list.map((user) => {
              const account = accountOf(user);
              return <tr key={user.id}>
                <td data-label="Tài khoản"><div className="user-identity"><i>{account.slice(0, 2).toUpperCase()}</i><span><b>{account}</b><small>{emailOf(user)}</small></span></div></td>
                <td data-label="ID"><span className="user-id">{user.id.slice(0, 12)}</span></td>
                <td data-label="Tổng đã nạp"><strong className="total-deposited-cell">{money(user.totalDeposited)}</strong></td>
                <td data-label="Số dư"><strong className="user-balance">{money(user.balance)}</strong></td>
                <td data-label="Vai trò"><span className="role-badge">{user.role}</span></td>
                <td data-label="Hoạt động"><span className={'presence ' + (online(user.lastSeenAt) ? 'online' : '')}><i />{seen(user.lastSeenAt)}</span></td>
                <td data-label="Thao tác" className="action-cell"><button className="more-user" onClick={() => setOpen(open === user.id ? '' : user.id)}>•••</button>{open === user.id && <div className="user-menu"><button onClick={() => location.assign('/admin/users/' + user.id)}>◎　Xem chi tiết</button><button onClick={() => location.assign('/admin/balance/' + user.id)}>＋　Cộng/Trừ số dư</button><button className="danger" onClick={() => remove(user)}>♜　Xóa người dùng</button></div>}</td>
              </tr>;
            })}</tbody>
          </table>
          {!list.length && <div className="users-empty">Không tìm thấy tài khoản phù hợp với bộ lọc.</div>}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) {
  return <div className={'users-metric ' + tone}><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>● {note}</small></div></div>;
}
