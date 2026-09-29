'use client';
import '../data-pages.css';
import { useEffect, useState } from 'react';
import { PlatformLogo } from './PlatformPicker';

const money = (n: any) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);

const formatDate = (x: any) => {
  if (!x) return '—';
  const d = new Date(x);
  const pad = (num: number) => String(num).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export function DataPage({ kind }: { kind: 'orders' | 'deposits' | 'transactions' | 'refunds' | 'services' }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const url =
    kind === 'orders'
      ? '/api/orders/history'
      : kind === 'deposits'
      ? '/api/deposits'
      : kind === 'transactions' || kind === 'refunds'
      ? '/api/transactions'
      : '/api/catalog';

  useEffect(() => {
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error('Không thể tải dữ liệu');
        return r.json();
      })
      .then((x) => setData(kind === 'refunds' ? (x.data || []).filter((t: any) => t.type === 'REFUND') : x.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url, kind]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pagination calculation
  const totalEntries = data.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div className="card table-card">
      <h2>
        {kind === 'orders'
          ? 'Lịch sử đơn hàng'
          : kind === 'deposits'
          ? 'Lịch sử nạp tiền'
          : kind === 'transactions'
          ? 'Biến động số dư'
          : kind === 'refunds'
          ? 'Lịch sử hoàn tiền'
          : 'Danh sách dịch vụ'}
      </h2>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : error ? (
        <p className="notice">{error}</p>
      ) : data.length === 0 ? (
        <div className="empty-state">
          {kind === 'orders'
            ? 'Bạn chưa có đơn hàng nào.'
            : kind === 'deposits'
            ? 'Bạn chưa có giao dịch nạp tiền nào.'
            : kind === 'refunds'
            ? 'Bạn chưa có giao dịch hoàn tiền nào.'
            : 'Chưa có dữ liệu.'}
        </div>
      ) : kind === 'orders' ? (
        <>
          <div className="table-controls">
            <span>Hiển thị</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>bản ghi</span>
          </div>

          <div className="table-scroll">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Thao tác</th>
                  <th>Mã đơn hàng</th>
                  <th>Service</th>
                  <th>Cảm xúc</th>
                  <th>Server</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Tổng tiền</th>
                  <th>Link order</th>
                  <th>Thời gian mua</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((x: any) => {
                  const orderCode = `NGANHANGSUB_${x.id}`;
                  const serverName = x.server?.name || 'Server 1';
                  const serviceName = x.service?.name || 'TikTok Service';
                  const unitPrice = x.quantity ? Number(x.price) / Number(x.quantity) : 0;
                  
                  return (
                    <tr key={x.id}>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn" title="Chi tiết">!</button>
                          <button className="action-btn" title="Hủy/Tạm dừng">∅</button>
                          <button className="action-btn" title="Hỗ trợ">⚡</button>
                        </div>
                      </td>
                      <td>
                        <div className="order-code-col">
                          <span className="code">{orderCode}</span>
                          <span className="copy-hint" onClick={() => handleCopy(orderCode, x.id)}>
                            {copiedId === x.id ? 'Đã copy!' : 'Nhấn để copy'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="service-title">
                          <PlatformLogo platform={x.service?.platform ? {
                            id: x.service.platform.id || x.service.platform.slug || x.service.platform.icon || 'platform',
                            name: x.service.platform.name || '',
                            slug: x.service.platform.slug || x.service.platform.icon,
                          } : null} />
                          <span>{serviceName}</span>
                          <span className="tag-green">✕</span>
                        </div>
                      </td>
                      <td>—</td>
                      <td>{serverName}</td>
                      <td>{unitPrice ? money(unitPrice) : '—'}</td>
                      <td>{money(x.quantity)}</td>
                      <td>{money(x.price)}</td>
                      <td>
                        <a href={x.link} target="_blank" rel="noopener noreferrer" className="order-link">
                          {x.link}
                        </a>
                      </td>
                      <td>{formatDate(x.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div>
              Hiển thị {totalEntries > 0 ? startIndex + 1 : 0} đến {endIndex} của {totalEntries} bản ghi
            </div>
            <div className="pagination">
              <button 
                className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Trang trước
              </button>
              <button 
                className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Thời gian</th>
                <th>Nội dung</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x: any) => (
                <tr key={x.id}>
                  <td>{x.id.slice(0, 12)}</td>
                  <td>{formatDate(x.createdAt)}</td>
                  <td>{x.description || x.paymentCode || x.name || '—'}</td>
                  <td className={Number(x.amount || x.price) >= 0 ? 'positive' : 'negative'}>
                    {x.amount === undefined && x.price === undefined ? '—' : money(x.amount ?? x.price) + 'đ'}
                  </td>
                  <td>{x.status || x.type || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StaticPage({ title, text }: { title: string; text: string }) {
  return (
    <div className="card empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
