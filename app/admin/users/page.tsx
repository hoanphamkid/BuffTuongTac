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
    !query || `${accountOf(user)} ${user.email || ''}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function remove(user: UserRow) {
    const account = accountOf(user);
    if (!confirm(`Xóa tài khoản ${account}?`)) return;

    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });

    if (response.ok) load();
    else alert((await response.json()).error);
  }

  return (
    <div className="admin-body users-page">
      <h2 className="admin-only-title">Người dùng</h2>
      <p className="admin-only-sub">Dữ liệu tất cả người dùng trên hệ thống</p>

      <div className="admin-stats">
        <Card t="TỔNG NGƯỜI DÙNG" v={rows.length} />
        <Card t="TỔNG SỐ DƯ" v={rows.reduce((sum, user) => sum + Number(user.balance || 0), 0)} />
        <Card t="TỔNG ĐÃ NẠP" v={rows.reduce((sum, user) => sum + Number(user.totalDeposited || 0), 0)} />
      </div>

      <div className="admin-card users-table-card">
        <div className="users-toolbar">
          <input
            placeholder="Tìm tài khoản, email..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button>Lọc</button>
        </div>

        <table className="admin-table users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>TÀI KHOẢN</th>
              <th>EMAIL / TÀI KHOẢN</th>
              <th>SỐ DƯ</th>
              <th>VAI TRÒ</th>
              <th>HOẠT ĐỘNG LẦN CUỐI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {list.map((user) => {
              const account = accountOf(user);

              return (
                <tr key={user.id}>
                  <td>{user.id.slice(0, 10)}</td>
                  <td><b>{account}</b></td>
                  <td>{emailOf(user)}</td>
                  <td>{money(user.balance)}</td>
                  <td><span className="pill blue">{user.role}</span></td>
                  <td>
                    <span className={'presence ' + (online(user.lastSeenAt) ? 'online' : '')}>
                      <i />
                      {seen(user.lastSeenAt)}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button className="more-user" onClick={() => setOpen(open === user.id ? '' : user.id)}>
                      •••
                    </button>
                    {open === user.id && (
                      <div className="user-menu">
                        <button onClick={() => alert(`${account}${user.email?.trim() ? ` - ${user.email.trim()}` : ''}`)}>
                          ◎　Xem chi tiết
                        </button>
                        <button onClick={() => location.assign('/admin/balance/' + user.id)}>
                          ＋　Cộng/Trừ số dư
                        </button>
                        <button className="danger" onClick={() => remove(user)}>
                          ♜　Xóa người dùng
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ t, v }: { t: string; v: string | number }) {
  return (
    <div className="admin-card admin-stat">
      <small>{t}</small>
      <strong>{money(v)}</strong>
      <span>↗ Dữ liệu thực tế</span>
    </div>
  );
}
