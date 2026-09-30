"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "./dashboard.css";
import { statusLabel } from "@/lib/status-label";
const money = (n: any) =>
  new Intl.NumberFormat("vi-VN").format(Number(n) || 0) + "đ";
export default function AdminDashboard() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/summary")
      .then((r) => r.json())
      .then((x) => setD(x.data || null));
  }, []);
  if (!d) return <div className="admin-body">Đang tải dữ liệu quản trị...</div>;
  const done = d.recent.filter((x: any) => x.status === "COMPLETED").length,
    running = d.recent.filter((x: any) =>
      ["PROCESSING", "IN_PROGRESS"].includes(x.status),
    ).length;
  return (
    <div className="admin-body dashboard">
      <div className="dashboard-top">
        <div>
          <h2 className="admin-only-title">Tổng quan</h2>
          <p className="admin-only-sub">
            Theo dõi hoạt động của hệ thống theo thời gian thực
          </p>
        </div>
        <span className="system-ok">●　Hệ thống hoạt động tốt</span>
      </div>
      <div className="dashboard-stats">
        <Stat
          href="/admin/transactions"
          icon="🛒"
          title="Tổng đơn hàng"
          value={d.orders}
          color="blue"
        />
        <Stat
          href="/admin/deposits"
          icon="$"
          title="Doanh thu"
          value={money(d.revenue)}
          color="green"
        />
        <Stat
          href="/admin/users"
          icon="♙"
          title="Tổng người dùng"
          value={d.users}
          color="orange"
        />
        <Stat
          href="/admin/transactions"
          icon="▣"
          title="Đang xử lý"
          value={d.processing}
          color="purple"
        />
      </div>
      <div className="dashboard-grid">
        <Link href="/admin/transactions" className="dashboard-panel chart-panel">
          <h2>▣　Doanh thu & Đơn hàng</h2>
          <div className="fake-chart">
            {[35, 52, 42, 70, 48, 88, 62, 96, 75, 100, 68, 84].map((h, i) => (
              <i style={{ height: `${h}%` }} key={i} />
            ))}
          </div>
          <div className="chart-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </Link>
        <Link href="/admin/transactions" className="dashboard-panel status-panel">
          <h2>◉　Trạng thái đơn hàng</h2>
          <div className="donut">
            <b>
              {d.orders}
              <small>Tổng đơn</small>
            </b>
          </div>
          <div className="status-list">
            <span>
              ● Hoàn thành <b>{done}</b>
            </span>
            <span>
              ● Đang chạy <b>{running}</b>
            </span>
            <span>
              ● Chờ xử lý <b>{d.orders - done - running}</b>
            </span>
          </div>
        </Link>
      </div>
      <div className="dashboard-panel recent-panel">
        <div className="panel-head">
          <div>
            <h2>Đơn hàng mới nhất</h2>
            <p>Dữ liệu lấy trực tiếp từ database</p>
          </div>
          <Link href="/admin/transactions">Xem tất cả →</Link>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>MÃ ĐƠN</th>
                <th>USER</th>
                <th>DỊCH VỤ</th>
                <th>SỐ LƯỢNG</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>THỜI GIAN</th>
              </tr>
            </thead>
            <tbody>
              {d.recent.map((o: any) => (
                <tr key={o.id}>
                  <td>#{o.id.slice(-8)}</td>
                  <td>{o.user}</td>
                  <td>{o.service}</td>
                  <td>{o.quantity.toLocaleString("vi-VN")}</td>
                  <td>
                    <b>{money(o.total)}</b>
                  </td>
                  <td>
                    <span className="pill blue">{statusLabel(o.status)}</span>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Stat({
  href,
  icon,
  title,
  value,
  color,
}: {
  href: string;
  icon: string;
  title: string;
  value: any;
  color: string;
}) {
  return (
    <Link href={href} className={"dashboard-stat " + color}>
      <i>{icon}</i>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>↗ Xem chi tiết</small>
      </div>
    </Link>
  );
}
