'use client';
import Link from 'next/link';
type OrderSuccess={id:string;service:string;server:string;quantity:number;total:number};
export function OrderSuccessModal({ order, onClose }: { order: OrderSuccess | null; onClose: () => void }) {
  if (!order) return null;
  const money = new Intl.NumberFormat('vi-VN').format(order.total) + 'đ';
  return (
    <div className="payment-overlay" role="dialog" aria-modal="true" aria-label="Tạo đơn hàng thành công">
      <div className="success-modal order-success-modal">
        <button className="modal-close" aria-label="Đóng" onClick={onClose}>×</button>
        <div className="check">✓</div>
        <h2>Tạo đơn hàng thành công</h2>
        <p>Đơn đã được ghi nhận. Bạn có thể theo dõi trạng thái trong chi tiết đơn hàng.</p>
        <div className="success-amount"><small>Tổng thanh toán</small><strong>{money}</strong></div>
        <div className="success-row"><span>Mã đơn</span><b>#{order.id.slice(-8)}</b></div>
        <div className="success-row"><span>Dịch vụ</span><b>{order.service}</b></div>
        <div className="success-row"><span>Máy chủ</span><b>{order.server}</b></div>
        <div className="success-row"><span>Số lượng</span><b>{order.quantity.toLocaleString('vi-VN')}</b></div>
        <div className="order-modal-actions">
          <Link href={'/orders/' + encodeURIComponent(order.id)}>Xem đơn vừa đặt</Link>
          <button className="primary" onClick={onClose}>Tạo đơn mới</button>
          <Link href="/orders">Xem lịch sử đơn hàng</Link>
        </div>
      </div>
    </div>
  );
}
