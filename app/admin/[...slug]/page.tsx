'use client';

import { use, useEffect, useMemo, useState } from 'react';

type Row = Record<string, any>;

const names: Record<string, string> = {
  orders: 'Đơn hàng',
  users: 'Người dùng',
  deposits: 'Nạp tiền',
  transactions: 'Giao dịch',
  refunds: 'Hoàn tiền',
  services: 'Dịch vụ',
  notifications: 'Thông báo',
  provider: 'Nhà cung cấp',
  settings: 'Cài đặt',
};

const descriptions: Record<string, string> = {
  refunds: 'Theo dõi và xử lý các yêu cầu hoàn tiền từ khách hàng.',
  notifications: 'Quản lý thông báo hệ thống và nội dung gửi đến người dùng.',
  provider: 'Kiểm tra trạng thái kết nối của các nhà cung cấp dịch vụ.',
  settings: 'Thiết lập các tham số vận hành của bảng điều khiển.',
};

const icon = (slug: string) =>
  slug === 'facebook' ? '●' : slug === 'tiktok' ? '♫' : slug === 'instagram' ? '▣' : slug === 'youtube' ? '▶' : '◆';

const money = (value: unknown) =>
  value === undefined || value === null || value === ''
    ? '—'
    : new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

const display = (value: unknown) => value === undefined || value === null || value === '' ? '—' : String(value);

export default function AdminSection({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);
  const resource = slug?.[0] || 'orders';
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = () => {
    if (!['orders', 'users', 'deposits', 'transactions'].includes(resource)) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/admin/' + resource, { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => setRows(result.data || []))
      .catch(() => setMessage('Không thể tải dữ liệu từ máy chủ.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [resource]);

  const title = names[resource] || 'Quản trị';
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [query, rows]);

  async function remove(user: Row) {
    if (!confirm(`Xóa tài khoản ${user.username || user.email || 'này'}?`)) return;
    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });
    const result = await response.json();
    setMessage(response.ok ? 'Đã xóa tài khoản.' : result.error || 'Không thể xóa tài khoản.');
    if (response.ok) load();
  }

  const isModule = ['refunds', 'notifications', 'provider', 'settings'].includes(resource);

  return (
    <div className={'admin-body generic-admin-page generic-' + resource}>
      <div className="generic-page-head">
        <div>
          <span className="generic-eyebrow">SYSTEM / {resource.toUpperCase()}</span>
          <h2 className="admin-only-title">{title}</h2>
          <p className="admin-only-sub">{descriptions[resource] || 'Dữ liệu thật được cập nhật theo thời gian thực.'}</p>
        </div>
        <button type="button" className="generic-refresh" onClick={load}>↻ Làm mới</button>
      </div>

      <div className="generic-stats">
        <div className="generic-stat"><span>ĐANG HIỂN THỊ</span><strong>{filtered.length}</strong><small>Record trong workspace</small></div>
        <div className="generic-stat"><span>TRẠNG THÁI</span><strong>{loading ? 'SYNC' : 'LIVE'}</strong><small>{loading ? 'Đang đồng bộ dữ liệu' : 'Đã sẵn sàng thao tác'}</small></div>
        <div className="generic-stat"><span>MODULE</span><strong>{isModule ? 'READY' : 'DATA'}</strong><small>Admin console v2.0</small></div>
      </div>

      {message && <div className="admin-notice">{message}</div>}

      <section className="admin-card generic-workspace">
        <div className="generic-toolbar">
          <div><h3>{isModule ? 'Khu vực quản trị' : 'Dữ liệu hệ thống'}</h3><p>{isModule ? 'Module này đã sẵn sàng để kết nối dữ liệu nghiệp vụ.' : `${filtered.length} bản ghi phù hợp với bộ lọc hiện tại.`}</p></div>
          <label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm trong dữ liệu..." /></label>
        </div>

        {isModule ? (
          <div className="generic-module-empty"><div className="generic-module-icon">{resource === 'settings' ? '⚙' : resource === 'provider' ? '◌' : resource === 'notifications' ? '!' : '↩'}</div><h3>{title} đang sẵn sàng</h3><p>Giao diện module đã được chuẩn hóa. Khi API nghiệp vụ có dữ liệu, bảng và bộ lọc sẽ hiển thị tại đây.</p><button type="button" onClick={load}>Kiểm tra lại kết nối</button></div>
        ) : (
          <div className="generic-table-wrap">
            <table className="admin-table generic-table">
              <thead><tr><th>ID</th><th>USER</th>{resource === 'orders' && <th>NỀN TẢNG</th>}<th>NỘI DUNG</th><th>SỐ TIỀN</th><th>TRẠNG THÁI</th><th>THỜI GIAN</th>{resource === 'users' && <th>THAO TÁC</th>}</tr></thead>
              <tbody>{filtered.map((row) => <tr key={row.id}>
                <td className="generic-id">{display(row.id).slice(0, 10)}</td>
                <td><b>{display(row.user?.username || row.user?.email || row.username)}</b></td>
                {resource === 'orders' && <td>{icon(row.service?.platform?.slug || '')} {display(row.service?.platform?.name).replace(/^\S+\s/, '')}</td>}
                <td>{display(row.service?.name || row.description || row.paymentCode || row.type || 'Người dùng')}</td>
                <td><b>{row.amount !== undefined ? money(row.amount) : row.price !== undefined ? money(row.price) : '—'}</b></td>
                <td><span className="pill blue">{display(row.status || row.role)}</span></td>
                <td>{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—'}</td>
                {resource === 'users' && <td><button className="generic-delete" onClick={() => remove(row)}>Xóa</button></td>}
              </tr>)}</tbody>
            </table>
            {loading && <p className="generic-empty">Đang tải dữ liệu...</p>}
            {!loading && !filtered.length && <p className="generic-empty">Chưa có dữ liệu phù hợp.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
