'use client';
import '../data-pages.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlatformLogo } from './PlatformPicker';
import { statusLabel } from '@/lib/status-label';

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
  const totalServices = kind === 'services' ? data.reduce((sum, platform) => sum + (platform.services?.length || 0), 0) : 0;
  const totalServers = kind === 'services' ? data.reduce((sum, platform) => sum + (platform.services || []).reduce((serviceSum: number, service: any) => serviceSum + (service.servers?.length || 0), 0), 0) : 0;

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
                  <th>Trạng thái</th>
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
                      <td data-label="Thao tác">
                        <div className="action-btns">
                          <Link className="action-btn" href={'/orders/' + encodeURIComponent(x.id)} title="Chi tiết" aria-label={'Xem chi tiết đơn ' + x.id}>↗</Link>
                          <button className="action-btn" title="Hủy/Tạm dừng">∅</button>
                          <button className="action-btn" title="Hỗ trợ">⚡</button>
                        </div>
                      </td>
                      <td data-label="Mã đơn hàng">
                        <div className="order-code-col">
                          <span className="code">{orderCode}</span>
                          <span className="copy-hint" onClick={() => handleCopy(orderCode, x.id)}>
                            {copiedId === x.id ? 'Đã copy!' : 'Nhấn để copy'}
                          </span>
                        </div>
                      </td>
                      <td data-label="Dịch vụ">
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
                      <td data-label="Cảm xúc">—</td>
                      <td data-label="Server">{serverName}</td>
                      <td data-label="Giá">{unitPrice ? money(unitPrice) : '—'}</td>
                      <td data-label="Số lượng">{money(x.quantity)}</td>
                      <td data-label="Tổng tiền">{money(x.price)}</td>
                      <td data-label="Link order">
                        <a href={x.link} target="_blank" rel="noopener noreferrer" className="order-link">
                          {x.link}
                        </a>
                      </td>
                      <td data-label="Trạng thái"><span className={'order-status status-' + String(x.status || 'PENDING').toLowerCase()}>{statusLabel(x.status || 'PENDING')}</span></td>
                      <td data-label="Thời gian mua">{formatDate(x.createdAt)}</td>
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
      ) : kind === 'services' ? (
        <div className="services-overview">
          <div className="services-summary">
            <div>
              <span className="services-summary-kicker">DANH MỤC DỊCH VỤ</span>
              <p><strong>{data.length}</strong> nền tảng <span>·</span> <strong>{totalServices}</strong> dịch vụ <span>·</span> <strong>{totalServers}</strong> server</p>
            </div>
            <span className="services-live"><i /> Đang hoạt động</span>
          </div>
          <div className="services-grid">
            {data.map((platform: any) => {
              const services = platform.services || [];
              const serverCount = services.reduce((sum: number, service: any) => sum + (service.servers?.length || 0), 0);
              const platformName = String(platform.name || platform.slug || 'Nền tảng').replace(/^\S+\s+/, '');
              return (
                <article className={'service-platform-card service-platform-' + (platform.slug || 'default')} key={platform.id || platform.slug}>
                  <div className="service-platform-head">
                    <PlatformLogo platform={{ id: platform.id || platform.slug || 'platform', name: platform.name || '', slug: platform.slug }} />
                    <div className="service-platform-copy">
                      <span className="service-platform-kicker">NỀN TẢNG</span>
                      <h3>{platformName}</h3>
                      <p>{services.length} dịch vụ <span>·</span> {serverCount} server</p>
                    </div>
                    <span className="service-platform-mark" aria-hidden="true">↗</span>
                  </div>
                  <div className="service-platform-list">
                    {services.length ? services.map((service: any) => {
                      const servers = service.servers || [];
                      return (
                        <div className="service-item" key={service.id || service.slug}>
                          <div className="service-item-title"><i /> <b>{service.name}</b></div>
                          <div className="service-item-meta"><span>{servers.length} server</span><span>{servers.length ? `Từ ${money(Math.min(...servers.map((server: any) => Number(server.pricePer1000) || 0)))}đ / 1.000` : 'Đang cập nhật'}</span></div>
                          {servers.length > 0 && <div className="service-server-list">{servers.map((server: any) => <span key={server.id}>{server.name || 'Server'} <b>{money(server.pricePer1000)}đ</b></span>)}</div>}
                        </div>
                      );
                    }) : <div className="services-empty-inline">Chưa có dịch vụ đang hoạt động.</div>}
                  </div>
                  <div className="service-platform-footer"><span><i /> Sẵn sàng phục vụ</span><span className="service-platform-cta">Xem dịch vụ <b>→</b></span></div>
                </article>
              );
            })}
          </div>
        </div>
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
