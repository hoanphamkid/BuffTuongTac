'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { statusLabel } from '@/lib/status-label';

type Order = {
  id: string; link: string; quantity: number; price: number; status: string;
  label?: string | null; reaction?: string | null; createdAt: string; updatedAt: string;
  service: { name: string; platform: { name: string } }; server: { name: string };
};
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

export function CustomerOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setOrder(null);
    fetch('/api/orders/' + encodeURIComponent(orderId), { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.data) throw new Error(result.error || 'Không thể tải đơn hàng. Vui lòng thử lại.');
        return result.data as Order;
      })
      .then((data) => { if (!controller.signal.aborted) setOrder(data); })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không thể tải đơn hàng.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [orderId, reload]);

  return (
    <section className="card customer-order-detail">
      <Link className="customer-order-back" href="/orders">← Lịch sử đơn hàng</Link>
      <div className="customer-order-heading">
        <div><small>THEO DÕI ĐƠN HÀNG</small><h1>Chi tiết đơn hàng</h1></div>
        <button type="button" disabled={loading} onClick={() => setReload((value) => value + 1)}>{loading ? 'Đang tải...' : 'Làm mới'}</button>
      </div>
      {loading && <p role="status">Đang tải thông tin đơn hàng...</p>}
      {error && <p className="notice" role="alert">{error}</p>}
      {!loading && order && (
        <>
          <div className="customer-order-summary">
            <div><small>Mã đơn</small><strong>#{order.id.slice(-8)}</strong></div>
            <div><small>Số lượng</small><strong>{order.quantity.toLocaleString('vi-VN')}</strong></div>
            <div><small>Thành tiền</small><strong>{order.price === 0 ? 'Miễn phí' : money(order.price)}</strong></div>
            <div><small>Trạng thái</small><span className={'order-status status-' + order.status.toLowerCase()}>{statusLabel(order.status)}</span></div>
          </div>
          <dl className="customer-order-fields">
            <div><dt>Mã đơn đầy đủ</dt><dd>{order.id}</dd></div>
            <div><dt>Nền tảng</dt><dd>{order.service.platform.name}</dd></div>
            <div><dt>Dịch vụ</dt><dd>{order.service.name}</dd></div>
            <div><dt>Máy chủ</dt><dd>{order.server.name}</dd></div>
            <div><dt>Liên kết đã đặt</dt><dd>{/^https?:\/\//i.test(order.link) ? <a href={order.link} target="_blank" rel="noopener noreferrer">{order.link}</a> : order.link}</dd></div>
            {order.reaction && <div><dt>Cảm xúc</dt><dd>{order.reaction}</dd></div>}
            {order.label && <div><dt>Ghi chú</dt><dd>{order.label}</dd></div>}
            <div><dt>Thời gian đặt</dt><dd>{new Date(order.createdAt).toLocaleString('vi-VN')}</dd></div>
            <div><dt>Cập nhật lần cuối</dt><dd>{new Date(order.updatedAt).toLocaleString('vi-VN')}</dd></div>
          </dl>
          <div className="customer-order-actions"><Link href="/">Tạo đơn mới</Link><Link href="/#feedback">Viết đánh giá</Link><a href="https://zalo.me/0945459491" target="_blank" rel="noopener noreferrer">Liên hệ hỗ trợ</a></div>
        </>
      )}
    </section>
  );
}
