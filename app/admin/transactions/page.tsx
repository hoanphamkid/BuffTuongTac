"use client";
import "./transactions.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { statusLabel } from "@/lib/status-label";
import { REFUND_REASONS } from "@/lib/orders/refund-reasons";
import "./refund.css";

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
      {Number(order.price) > 0 && (
        <section className="order-refund-section">
          <h4>Hoàn tiền đơn hàng</h4>
          <RefundControl order={order} onUpdated={onUpdated} />
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <p className="tx-info"><span>{label}</span><b>{value}</b></p>;
}

function OrderEditor({ order, onUpdated }: { order: Order; onUpdated: (order: Order) => void }) {
  const [label, setLabel] = useState(order.label || "");
  const [status, setStatus] = useState(order.status);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setLabel(order.label || ""); setStatus(order.status); setOpen(false); }, [order.id, order.label, order.status]);

  async function chooseStatus(nextStatus: string) {
    if (saving || nextStatus === status) {
      setOpen(false);
      return;
    }
    const nextLabel = statusLabel(nextStatus);
    setStatus(nextStatus);
    setLabel(nextLabel);
    setOpen(false);
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id, label: nextLabel, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật đơn hàng");
      onUpdated({ ...order, ...result.data });
    } catch (reason) {
      setStatus(order.status);
      setLabel(order.label || "");
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="order-label-editor">
      <button
        type="button"
        className={"order-label " + status.toLowerCase()}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        disabled={saving || status === "REFUNDED"}
        title="Chọn trạng thái đơn hàng"
      >
        {saving ? "Đang lưu..." : label || statusLabel(status)} <span aria-hidden="true">▾</span>
      </button>
      {open && status !== "REFUNDED" && (
        <div className="order-status-menu" role="listbox" aria-label="Trạng thái đơn hàng">
          {[
            ["PENDING", "Chờ xử lý"],
            ["PROCESSING", "Đang xử lý"],
            ["COMPLETED", "Hoàn thành"],
          ].map(([value, text]) => (
            <button
              type="button"
              role="option"
              aria-selected={status === value}
              className={status === value ? "selected" : ""}
              key={value}
              onClick={() => chooseStatus(value)}
            >
              <span className={"order-status-dot " + value.toLowerCase()} />
              {text}
            </button>
          ))}
        </div>
      )}
      {error && <small className="label-error">{error}</small>}
    </div>
  );
}

function RefundControl({ order, onUpdated }: { order: Order; onUpdated: (order: Order) => void }) {
  const [reasonCode, setReasonCode] = useState<string>(REFUND_REASONS[0].value);
  const [reasonDetail, setReasonDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setReasonCode(REFUND_REASONS[0].value);
    setReasonDetail("");
    setSaving(false);
    setError("");
    setMessage("");
  }, [order.id]);

  if (order.status === "REFUNDED") {
    return <div className="order-refund-complete">✓ Đơn hàng đã được hoàn tiền vào số dư khách hàng. {message}</div>;
  }

  async function refund() {
    if (saving) return;
    if (reasonCode === "OTHER" && !reasonDetail.trim()) {
      setError("Vui lòng nhập lý do hoàn tiền.");
      return;
    }
    const selectedReason = REFUND_REASONS.find((item) => item.value === reasonCode)?.label || "";
    const reasonText = reasonCode === "OTHER" ? `${selectedReason}: ${reasonDetail.trim()}` : selectedReason;
    if (!window.confirm(`Hoàn ${currency(Number(order.price))} vào số dư của ${order.user.username}?\n\nLý do: ${reasonText}`)) return;

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "refund", orderId: order.id, reasonCode, reasonDetail }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể hoàn tiền đơn hàng");
      onUpdated({ ...order, ...result.data });
      setMessage("Đã hoàn tiền thành công.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể hoàn tiền đơn hàng");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="order-refund-panel">
      <p>Số tiền sẽ được cộng lại vào số dư khách hàng và gửi thông báo kèm lý do.</p>
      <label htmlFor="refund-reason">Lý do hoàn tiền</label>
      <select id="refund-reason" value={reasonCode} onChange={(event) => { setReasonCode(event.target.value); setError(""); }} disabled={saving}>
        {REFUND_REASONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      {reasonCode === "OTHER" && (
        <textarea value={reasonDetail} onChange={(event) => { setReasonDetail(event.target.value); setError(""); }} placeholder="Nhập lý do cụ thể..." maxLength={160} disabled={saving} />
      )}
      {error && <small className="order-refund-error">{error}</small>}
      <button type="button" className="order-refund-button" onClick={refund} disabled={saving}>
        {saving ? "Đang hoàn tiền..." : `Hoàn ${currency(Number(order.price))} vào số dư`}
      </button>
    </div>
  );
}
