"use client";
import "./transactions.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { statusLabel } from "@/lib/status-label";

type User = { id: string; username: string; email: string };
type Order = {
  id: string;
  userId: string;
  user: User;
  link: string;
  quantity: number;
  price: string | number;
  status: string;
  label?: string | null;
  reaction?: string | null;
  createdAt: string;
  service?: { name: string; platform?: { name: string } };
  server?: { name: string };
};

const dateTime = (value: string) => new Date(value).toLocaleString("vi-VN");
const currency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ";
const statusTabs = [
  ["ALL", "Tất cả"],
  ["PENDING", "Chờ xử lý"],
  ["PROCESSING", "Đang xử lý"],
  ["COMPLETED", "Hoàn thành"],
] as const;

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("ALL");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/transactions", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!result.success) throw new Error(result.error || "Không tải được đơn hàng");
        const latest: Order[] = result.data?.orders || [];
        setOrders(latest);
        setSelectedId((current) =>
          current && latest.some((order) => order.id === current)
            ? current
            : latest[0]?.id || "",
        );
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    ALL: orders.length,
    PENDING: orders.filter((order) => order.status === "PENDING").length,
    PROCESSING: orders.filter((order) => ["PROCESSING", "IN_PROGRESS"].includes(order.status)).length,
    COMPLETED: orders.filter((order) => order.status === "COMPLETED").length,
  }), [orders]);
  const filtered = useMemo(() => orders.filter((order) => {
    const matchesStatus = state === "ALL" ||
      (state === "PROCESSING" ? ["PROCESSING", "IN_PROGRESS"].includes(order.status) : order.status === state);
    const haystack = [
      order.id, order.user?.username, order.user?.email, order.link,
      order.service?.name, order.service?.platform?.name, order.server?.name,
    ].join(" ").toLowerCase();
    return matchesStatus && (!query || haystack.includes(query.toLowerCase()));
  }), [orders, query, state]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const shown = filtered.slice((page - 1) * size, page * size);
  const selected = orders.find((order) => order.id === selectedId) || null;
  const updateOrder = (updated: Order) => {
    setOrders((current) => current.map((order) => order.id === updated.id ? { ...order, ...updated } : order));
  };

  return (
    <div className="admin-body transactions-page">
      <header className="transactions-head">
        <div>
          <h2>Đơn hàng</h2>
          <p>Danh sách các đơn dịch vụ khách hàng đã mua</p>
        </div>
        <label>
          ⌕
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm mã đơn, khách hàng, dịch vụ..." />
        </label>
      </header>

      <div className="transaction-stats">
        <Stat tone="blue" icon="▤" title="Tổng đơn hàng" value={counts.ALL} />
        <Stat tone="orange" icon="◷" title="Chờ xử lý" value={counts.PENDING} />
        <Stat tone="purple" icon="↻" title="Đang xử lý" value={counts.PROCESSING} />
        <Stat tone="green" icon="✓" title="Hoàn thành" value={counts.COMPLETED} />
      </div>

      <div className={"transactions-shell " + (selected ? "has-detail" : "")}>
        <section className="transactions-card">
          <div className="transaction-tabs">
            {statusTabs.map(([key, label]) => (
              <button className={state === key ? "active" : ""} key={key} onClick={() => { setState(key); setPage(1); }}>
                {label} <b>{counts[key]}</b>
              </button>
            ))}
          </div>
          <div className="transaction-table-wrap">
            <table className="transaction-table order-table">
              <thead>
                <tr>
                  <th>#</th><th>Thời gian</th><th>Khách hàng</th><th>Dịch vụ</th>
                  <th>Liên kết</th><th>Số lượng</th><th>Thành tiền</th><th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((order, index) => (
                  <tr key={order.id} className={selected?.id === order.id ? "selected" : ""} onClick={() => setSelectedId(order.id)}>
                    <td><b>#{String((page - 1) * size + index + 1).padStart(4, "0")}</b></td>
                    <td>{dateTime(order.createdAt)}</td>
                    <td><div className="tx-user"><i>{order.user?.username?.[0]?.toUpperCase() || "U"}</i><span><b>{order.user?.username}</b><small>{order.user?.email}</small></span></div></td>
                    <td><b>{order.service?.name || "Dịch vụ"}</b><small className="order-platform">{order.service?.platform?.name}</small></td>
                    <td className="tx-content"><a href={order.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{order.link}</a></td>
                    <td>{Number(order.quantity).toLocaleString("vi-VN")}</td>
                    <td><strong className="order-price">{currency(Number(order.price))}</strong></td>
                    <td><span className={"tx-status " + order.status.toLowerCase()}>{statusLabel(order.status)}</span></td>
                    <td><button onClick={(event) => { event.stopPropagation(); setSelectedId(order.id); }}>Xem</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !shown.length && <div className="tx-empty">{error || "Chưa có đơn hàng phù hợp."}</div>}
            {loading && <div className="tx-empty">Đang tải đơn hàng...</div>}
          </div>
          <div className="tx-pagination">
            <span>Hiển thị {shown.length ? (page - 1) * size + 1 : 0} - {Math.min(page * size, filtered.length)} / {filtered.length} đơn hàng</span>
            <div>
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: Math.min(5, pages) }, (_, index) => index + 1).map((number) => (
                <button className={page === number ? "active" : ""} onClick={() => setPage(number)} key={number}>{number}</button>
              ))}
              <button disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
            </div>
            <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }}>
              <option value="10">10 / trang</option><option value="25">25 / trang</option><option value="50">50 / trang</option>
            </select>
          </div>
        </section>
        {selected && <OrderDetail order={selected} close={() => setSelectedId("")} onUpdated={updateOrder} />}
      </div>
    </div>
  );
}

function Stat({ tone, icon, title, value }: { tone: string; icon: string; title: string; value: number }) {
  return <div className={"tx-stat " + tone}><i>{icon}</i><div><span>{title}</span><strong>{value}</strong><small>Dữ liệu đơn hàng</small></div><em>⌁</em></div>;
}

function OrderDetail({ order, close, onUpdated }: { order: Order; close: () => void; onUpdated: (order: Order) => void }) {
  return (
    <div className="transaction-detail order-detail" role="region" aria-label="Chi tiết đơn hàng">
      <div className="tx-detail-head"><h3>Chi tiết đơn hàng</h3><button onClick={close} aria-label="Đóng">×</button></div>
      <div className="tx-detail-id">
        <h2>#{order.id.slice(-8)}</h2>
        <span className={"tx-status " + order.status.toLowerCase()}>{statusLabel(order.status)}</span>
        <p>Đặt lúc: {dateTime(order.createdAt)}</p>
      </div>
      <section>
        <h4>Thông tin khách hàng</h4>
        <div className="tx-profile">
          <i>{order.user?.username?.[0]?.toUpperCase() || "U"}</i>
          <div><b>{order.user?.username}</b><small>ID: {order.userId}</small><small>{order.user?.email}</small></div>
          <Link href={order.user?.id ? `/admin/balance/${order.user.id}` : "/admin/users"}>Xem hồ sơ</Link>
        </div>
      </section>
      <section className="order-detail-info">
        <h4>Thông tin đơn hàng</h4>
        <Info label="Nền tảng" value={order.service?.platform?.name || "—"} />
        <Info label="Dịch vụ" value={order.service?.name || "—"} />
        <Info label="Máy chủ" value={order.server?.name || "—"} />
        <Info label="Số lượng" value={Number(order.quantity).toLocaleString("vi-VN")} />
        <Info label="Thành tiền" value={currency(Number(order.price))} />
        {order.reaction && <Info label="Cảm xúc" value={order.reaction} />}
        <Info label="Trạng thái" value={statusLabel(order.status)} />
        <Info label="Liên kết" value={order.link} />
      </section>
      <section className="order-detail-editor">
        <h4>Nhãn và trạng thái</h4>
        <OrderEditor order={order} onUpdated={onUpdated} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <p className="tx-info"><span>{label}</span><b>{value}</b></p>;
}

function OrderEditor({ order, onUpdated }: { order: Order; onUpdated: (order: Order) => void }) {
  const [label, setLabel] = useState(order.label || "");
  const [status, setStatus] = useState(order.status);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setLabel(order.label || ""); setStatus(order.status); }, [order.id, order.label, order.status]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id, label, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật đơn hàng");
      onUpdated({ ...order, ...result.data });
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="order-label-editor">
      {editing ? <>
        <input value={label} maxLength={120} onChange={(event) => setLabel(event.target.value)} placeholder="Nhãn đơn hàng" />
        <select aria-label="Trạng thái đơn hàng" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="PENDING">Chờ xử lý</option><option value="PROCESSING">Đang xử lý</option><option value="COMPLETED">Hoàn thành</option>
          {status === "IN_PROGRESS" && <option value="IN_PROGRESS">Đang chạy</option>}
          {status === "PARTIAL" && <option value="PARTIAL">Hoàn thành một phần</option>}
          {status === "CANCELED" && <option value="CANCELED">Đã hủy</option>}
          {status === "FAILED" && <option value="FAILED">Thất bại</option>}
          {status === "REFUNDED" && <option value="REFUNDED">Đã hoàn tiền</option>}
        </select>
        <button onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
        <button onClick={() => { setLabel(order.label || ""); setStatus(order.status); setEditing(false); }}>Hủy</button>
      </> : <>
        <button
          type="button"
          className={"order-label " + order.status.toLowerCase()}
          onClick={() => setEditing(true)}
          title="Bấm để sửa nhãn và trạng thái"
        >
          {label || statusLabel(order.status)}
        </button>
      </>}
      {error && <small className="label-error">{error}</small>}
    </div>
  );
}
