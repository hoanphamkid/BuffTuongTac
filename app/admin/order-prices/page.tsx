'use client';

import './order-prices.css';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { statusLabel } from '@/lib/status-label';

type Order = {
  id: string;
  userId: string;
  user: { id: string; username: string; email?: string | null; balance: string | number };
  link: string;
  quantity: number;
  price: string | number;
  status: string;
  createdAt: string;
  service?: { name: string; platform?: { name: string } };
  server?: { name: string };
};

const money = (value: string | number) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
const dateTime = (value: string) => new Date(value).toLocaleString('vi-VN');

export default function OrderPricesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/order-prices', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Không tải được danh sách đơn hàng');
        return result;
      })
      .then((result) => {
        const next: Order[] = result.data || [];
        setOrders(next);
        setSelectedId((current) => current && next.some((order) => order.id === current) ? current : next[0]?.id || '');
        setError('');
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không tải được danh sách đơn hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const searchable = [order.id, order.user?.username, order.user?.email, order.service?.name, order.server?.name, order.link].join(' ').toLowerCase();
      const matchQuery = !needle || searchable.includes(needle);
      const matchStatus = status === 'ALL' || order.status === status;
      return matchQuery && matchStatus;
    });
  }, [orders, query, status]);

  const selected = orders.find((order) => order.id === selectedId) || null;
  const updateOrder = (updated: Order) => setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));

  return (
    <div className="admin-body order-prices-page">
      <div className="order-prices-intro">
        <div>
          <p className="order-prices-crumb">Quản lý　›　Điều chỉnh giá</p>
          <h2 className="admin-only-title">Điều chỉnh giá đơn hàng</h2>
          <p className="admin-only-sub">Cập nhật tổng tiền từng đơn và tự động đối soát phần chênh lệch vào số dư khách hàng.</p>
        </div>
        <button type="button" className="order-prices-refresh" onClick={load} disabled={loading}>{loading ? 'Đang tải...' : '↻ Làm mới'}</button>
      </div>

      <div className="order-prices-note">
        <span>i</span>
        <p><b>Lưu ý:</b> Giảm giá sẽ cộng phần chênh lệch vào số dư khách hàng. Tăng giá sẽ trừ thêm tiền và chỉ thực hiện khi số dư đủ.</p>
      </div>

      <div className="order-prices-toolbar">
        <label className="order-prices-search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã đơn, khách hàng, dịch vụ..." /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái">
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="IN_PROGRESS">Đang chạy</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="FAILED">Thất bại</option>
          <option value="CANCELED">Đã hủy</option>
        </select>
      </div>

      <div className={'order-prices-layout ' + (selected ? 'has-selection' : '')}>
        <section className="admin-card order-prices-table-card">
          <div className="order-prices-table-head"><div><h3>Danh sách đơn hàng</h3><span>{filtered.length} đơn hiển thị</span></div><span className="order-prices-count">Tối đa 500 đơn gần nhất</span></div>
          <div className="order-prices-table-wrap">
            <table className="admin-table order-prices-table">
              <thead><tr><th>MÃ ĐƠN</th><th>KHÁCH HÀNG</th><th>DỊCH VỤ</th><th>THỜI GIAN</th><th>GIÁ HIỆN TẠI</th><th>TRẠNG THÁI</th><th /></tr></thead>
              <tbody>
                {filtered.map((order) => <tr key={order.id} className={selected?.id === order.id ? 'selected' : ''} onClick={() => setSelectedId(order.id)}>
                  <td><b>#{order.id.slice(-8)}</b></td>
                  <td><b>{order.user?.username || '—'}</b><small>{order.user?.email || 'Chưa có email'}</small></td>
                  <td><b>{order.service?.name || 'Dịch vụ'}</b><small>{order.server?.name || '—'}</small></td>
                  <td>{dateTime(order.createdAt)}</td>
                  <td><strong className="order-prices-current">{money(order.price)}</strong></td>
                  <td><span className={'pill ' + (order.status === 'COMPLETED' ? 'green' : order.status === 'FAILED' || order.status === 'CANCELED' ? 'red' : 'blue')}>{statusLabel(order.status)}</span></td>
                  <td><button type="button" className="order-prices-edit" onClick={(event) => { event.stopPropagation(); setSelectedId(order.id); }}>Sửa giá</button></td>
                </tr>)}
              </tbody>
            </table>
            {loading && <div className="order-prices-empty">Đang tải đơn hàng...</div>}
            {!loading && error && <div className="order-prices-empty error">{error}</div>}
            {!loading && !error && !filtered.length && <div className="order-prices-empty">Không có đơn hàng phù hợp.</div>}
          </div>
        </section>
        {selected && <PriceEditor order={selected} onUpdated={updateOrder} onClose={() => setSelectedId('')} />}
      </div>
    </div>
  );
}

function PriceEditor({ order, onUpdated, onClose }: { order: Order; onUpdated: (order: Order) => void; onClose: () => void }) {
  const [price, setPrice] = useState(String(order.price));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setPrice(String(order.price)); setSaving(false); setMessage(''); setError(''); }, [order.id]);

  const oldPrice = Number(order.price) || 0;
  const nextPrice = Number(price) || 0;
  const difference = nextPrice - oldPrice;
  const balance = Number(order.user?.balance) || 0;

  async function save() {
    if (!/^\d+$/.test(price.trim())) { setError('Nhập số tiền là số nguyên không âm.'); return; }
    if (Number(price) > Number.MAX_SAFE_INTEGER) { setError('Số tiền quá lớn.'); return; }
    if (difference > balance) { setError('Số dư khách hàng không đủ để tăng giá đơn.'); return; }
    if (difference === 0) { setMessage('Giá đơn chưa thay đổi.'); return; }
    const direction = difference > 0 ? `trừ thêm ${money(difference)}` : `cộng lại ${money(Math.abs(difference))}`;
    if (!window.confirm(`Xác nhận ${direction} cho tài khoản ${order.user.username}?`)) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/order-prices', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: order.id, price: price.trim() }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật giá đơn');
      onUpdated(result.data);
      setPrice(String(result.data.price));
      setMessage('Đã cập nhật giá và đối soát số dư khách hàng.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật giá đơn');
    } finally { setSaving(false); }
  }

  return <aside className="admin-card price-editor" aria-label="Chỉnh giá đơn hàng">
    <div className="price-editor-head"><div><p>Đang chỉnh sửa</p><h3>#{order.id.slice(-8)}</h3></div><button type="button" onClick={onClose} aria-label="Đóng">×</button></div>
    <div className="price-editor-user"><i>{order.user?.username?.[0]?.toUpperCase() || 'U'}</i><div><b>{order.user?.username || '—'}</b><span>Số dư hiện tại: <strong>{money(order.user?.balance || 0)}</strong></span></div><Link href={'/admin/users/' + order.user?.id}>Hồ sơ</Link></div>
    <div className="price-editor-summary"><Info label="Dịch vụ" value={order.service?.name || '—'} /><Info label="Số lượng" value={Number(order.quantity).toLocaleString('vi-VN')} /><Info label="Trạng thái" value={statusLabel(order.status)} /></div>
    <label className="price-input-label">Tổng tiền mới (VNĐ)<div className="price-input-wrap"><input inputMode="numeric" type="number" min="0" step="1" value={price} onChange={(event) => { setPrice(event.target.value); setError(''); setMessage(''); }} disabled={saving} /><span>đ</span></div></label>
    <div className={'price-impact ' + (difference > 0 ? 'debit' : difference < 0 ? 'credit' : '')}><span>{difference > 0 ? 'Khách hàng sẽ bị trừ thêm' : difference < 0 ? 'Khách hàng sẽ được cộng lại' : 'Chưa có thay đổi'}</span><b>{difference ? money(Math.abs(difference)) : '—'}</b></div>
    {error && <p className="price-editor-message error">{error}</p>}{message && <p className="price-editor-message success">{message}</p>}
    <button type="button" className="price-save" onClick={save} disabled={saving || order.status === 'REFUNDED'}>{saving ? 'Đang lưu...' : order.status === 'REFUNDED' ? 'Đơn đã hoàn tiền' : 'Lưu giá mới'}</button>
    <small className="price-editor-footnote">Thao tác sẽ tạo một giao dịch đối soát trong lịch sử số dư của khách hàng.</small>
  </aside>;
}

function Info({ label, value }: { label: string; value: string }) { return <p className="price-info"><span>{label}</span><b>{value}</b></p>; }
