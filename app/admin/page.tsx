'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import './dashboard.css';
import { statusLabel } from '@/lib/status-label';

type PeriodKey = 'total' | 'week' | 'month';

type PeriodStats = {
  users: number;
  orders: number;
  deposits: number;
  revenue: number;
  processing: number;
};

type TrendPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

type Summary = {
  periods: Record<PeriodKey, PeriodStats>;
  statusCounts: Record<string, number>;
  trend: TrendPoint[];
  recent: Array<{
    id: string;
    user: string;
    service: string;
    quantity: number;
    total: number;
    status: string;
    createdAt: string;
  }>;
  generatedAt: string;
};

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

const compactNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const periodInfo: Record<PeriodKey, { label: string; description: string }> = {
  total: { label: 'Tổng', description: 'Toàn bộ dữ liệu trên hệ thống' },
  week: { label: 'Tuần này', description: 'Từ thứ Hai đến hôm nay' },
  month: { label: 'Tháng này', description: 'Từ đầu tháng đến hôm nay' },
};

export default function AdminDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [period, setPeriod] = useState<PeriodKey>('total');
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    fetch('/api/admin/summary', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Không thể tải dữ liệu quản trị.');
        return result;
      })
      .then((result) => setData(result.data || null))
      .catch(() => setError('Không thể tải dữ liệu quản trị. Vui lòng thử lại.'));
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (error) {
    return (
      <div className="admin-body dashboard dashboard-empty">
        <div className="empty-state">
          <span>!</span>
          <h2>Không tải được dashboard</h2>
          <p>{error}</p>
          <button onClick={load}>Thử lại</button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="admin-body dashboard-loading">Đang tải dữ liệu quản trị...</div>;

  const selected = data.periods[period];
  const trend = period === 'week' ? data.trend.slice(-7) : period === 'month' ? data.trend : data.trend.slice(-14);
  const maxRevenue = Math.max(...trend.map((point) => point.revenue), 1);
  const maxOrders = Math.max(...trend.map((point) => point.orders), 1);
  const getStatusCount = (status: string) => Number(data.statusCounts[status] || 0);
  const completed = getStatusCount('COMPLETED');
  const running = getStatusCount('PROCESSING') + getStatusCount('IN_PROGRESS');
  const pending = getStatusCount('PENDING');
  const other = Math.max(data.periods.total.orders - completed - running - pending, 0);
  const statusTotal = Math.max(data.periods.total.orders, 0);
  const statusRows = [
    { label: 'Hoàn thành', value: completed, color: '#18c98a' },
    { label: 'Đang chạy', value: running, color: '#238cff' },
    { label: 'Chờ xử lý', value: pending, color: '#f1a122' },
    { label: 'Khác', value: other, color: '#a66bea' },
  ];
  let ringCursor = 0;
  const ringGradient = statusTotal
    ? statusRows
        .map((row) => {
          const start = ringCursor;
          ringCursor += (row.value / statusTotal) * 100;
          return `${row.color} ${start}% ${ringCursor}%`;
        })
        .join(', ')
    : '#dce6f0 0 100%';

  const updatedAt = new Date(data.generatedAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="admin-body dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">KID SOCIAL / CONTROL CENTER</span>
          <h2>Tổng quan hệ thống</h2>
          <p>Quản lý doanh thu, đơn hàng và người dùng trong một màn hình trực quan.</p>
          <div className="hero-actions">
            <Link href="/admin/deposits" className="hero-button primary">Quản lý nạp tiền</Link>
            <Link href="/admin/users" className="hero-button">Danh sách người dùng</Link>
          </div>
        </div>
        <div className="hero-insight">
          <span>DOANH THU · {periodInfo[period].label.toUpperCase()}</span>
          <strong>{money(selected.revenue)}</strong>
          <small>{selected.deposits.toLocaleString('vi-VN')} giao dịch nạp thành công</small>
          <i className="hero-glow" />
        </div>
      </section>

      <div className="dashboard-toolbar">
        <div>
          <span className="section-kicker">BÁO CÁO NHANH</span>
          <p>{periodInfo[period].description} · Cập nhật lúc {updatedAt}</p>
        </div>
        <div className="period-switcher" role="tablist" aria-label="Khoảng thời gian thống kê">
          {(Object.keys(periodInfo) as PeriodKey[]).map((key) => (
            <button
              key={key}
              className={period === key ? 'active' : ''}
              onClick={() => setPeriod(key)}
              role="tab"
              aria-selected={period === key}
            >
              {periodInfo[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-stats">
        <Stat href="/admin/deposits" icon="₫" title="Tổng nạp tiền" value={money(selected.revenue)} note={`${selected.deposits} giao dịch thành công`} color="green" />
        <Stat href="/admin/transactions" icon="↗" title="Đơn hàng" value={selected.orders.toLocaleString('vi-VN')} note="Đơn tạo trong giai đoạn" color="blue" />
        <Stat href="/admin/users" icon="♙" title="Người dùng mới" value={selected.users.toLocaleString('vi-VN')} note="Tài khoản đăng ký mới" color="purple" />
        <Stat href="/admin/transactions" icon="◷" title="Đang xử lý" value={selected.processing.toLocaleString('vi-VN')} note="Cần tiếp tục theo dõi" color="orange" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel chart-panel">
          <div className="panel-head chart-head">
            <div>
              <span className="section-kicker">HIỆU SUẤT</span>
              <h2>Dòng tiền & đơn hàng</h2>
              <p>Biến động trong {period === 'total' ? '30 ngày gần nhất' : periodInfo[period].label.toLowerCase()}</p>
            </div>
            <div className="chart-legend"><span className="revenue-dot" /> Nạp tiền <span className="orders-dot" /> Đơn hàng</div>
          </div>
          <div className="trend-chart">
            {trend.map((point, index) => (
              <div className="trend-column" key={point.date} title={`${point.label}: ${money(point.revenue)} · ${point.orders} đơn`}>
                <div className="trend-bars">
                  <i className="trend-revenue" style={{ height: `${Math.max(point.revenue ? (point.revenue / maxRevenue) * 100 : 0, point.revenue ? 8 : 2)}%` }} />
                  <b className="trend-orders" style={{ height: `${Math.max(point.orders ? (point.orders / maxOrders) * 100 : 0, point.orders ? 8 : 2)}%` }} />
                </div>
                <small>{index % (trend.length > 14 ? 4 : 2) === 0 ? point.label : ''}</small>
              </div>
            ))}
          </div>
          <div className="chart-footer"><span><b>{compactNumber(selected.revenue)}đ</b> nạp tiền</span><span><b>{selected.orders.toLocaleString('vi-VN')}</b> đơn hàng</span></div>
        </section>

        <section className="dashboard-panel status-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">ĐƠN HÀNG</span>
              <h2>Trạng thái hệ thống</h2>
            </div>
            <Link href="/admin/transactions">Chi tiết →</Link>
          </div>
          <div className="status-content">
            <div className="status-ring" style={{ background: `conic-gradient(${ringGradient})` }}>
              <div><strong>{statusTotal.toLocaleString('vi-VN')}</strong><small>Tổng đơn</small></div>
            </div>
            <div className="status-list">
              {statusRows.map((row) => (
                <span key={row.label}><i style={{ background: row.color }} /> {row.label}<b>{row.value.toLocaleString('vi-VN')}</b></span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="dashboard-bottom-grid">
        <div className="dashboard-panel recent-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">ACTIVITY FEED</span>
              <h2>Đơn hàng mới nhất</h2>
              <p>Dữ liệu lấy trực tiếp từ database</p>
            </div>
            <Link href="/admin/transactions">Xem tất cả →</Link>
          </div>
          <div className="table-scroll">
            <table className="admin-table dashboard-table">
              <thead><tr><th>MÃ ĐƠN</th><th>NGƯỜI DÙNG</th><th>DỊCH VỤ</th><th>SỐ LƯỢNG</th><th>TỔNG TIỀN</th><th>TRẠNG THÁI</th><th>THỜI GIAN</th></tr></thead>
              <tbody>
                {data.recent.map((order) => (
                  <tr key={order.id}>
                    <td><b>#{order.id.slice(-8)}</b></td>
                    <td>{order.user}</td>
                    <td>{order.service}</td>
                    <td>{order.quantity.toLocaleString('vi-VN')}</td>
                    <td><strong>{money(order.total)}</strong></td>
                    <td><span className={'pill ' + (order.status === 'COMPLETED' ? 'green' : 'blue')}>{statusLabel(order.status)}</span></td>
                    <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.recent.length && <div className="table-empty">Chưa có đơn hàng nào.</div>}
          </div>
        </div>

        <aside className="dashboard-panel quick-panel">
          <div className="panel-head"><div><span className="section-kicker">SHORTCUTS</span><h2>Lối tắt quản trị</h2></div></div>
          <Link href="/admin/deposits" className="quick-link"><i className="quick-green">₫</i><span><b>Duyệt nạp tiền</b><small>Xử lý các giao dịch đang chờ</small></span><em>→</em></Link>
          <Link href="/admin/users" className="quick-link"><i className="quick-purple">♙</i><span><b>Quản lý người dùng</b><small>Xem tài khoản và số dư</small></span><em>→</em></Link>
          <Link href="/admin/services" className="quick-link"><i className="quick-blue">◈</i><span><b>Danh sách dịch vụ</b><small>Cập nhật giá và máy chủ</small></span><em>→</em></Link>
          <div className="system-card"><i /> <span><b>Hệ thống đang hoạt động</b><small>Đồng bộ dữ liệu tự động mỗi 30 giây</small></span></div>
        </aside>
      </section>
    </div>
  );
}

function Stat({ href, icon, title, value, note, color }: { href: string; icon: string; title: string; value: string; note: string; color: string }) {
  return (
    <Link href={href} className={'dashboard-stat ' + color}>
      <i>{icon}</i>
      <div><span>{title}</span><strong>{value}</strong><small>{note}</small></div>
      <b className="stat-arrow">↗</b>
    </Link>
  );
}
