"use client";
import "./transactions.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { statusLabel } from "@/lib/status-label";

type User = { id: string; username: string; email: string };
type Order = {
  id: string;
  userId: string;
  link: string;
  quantity: number;
  price: string | number;
  status: string;
  createdAt: string;
  service?: { name: string; platform?: { name: string } };
  server?: { name: string };
};
type Row = {
  id: string;
  kind: "DEPOSIT" | "ORDER" | "REFUND" | "ADJUSTMENT";
  amount: number;
  method: string;
  content: string;
  status: string;
  createdAt: string;
  user: User;
  referenceId: string;
  deposit?: any;
  order?: Order;
};
const money = (n: unknown) =>
  (Number(n) >= 0 ? "+" : "-") +
  new Intl.NumberFormat("vi-VN").format(Math.abs(Number(n) || 0)) +
  "đ";
const dt = (v: string) => new Date(v).toLocaleString("vi-VN");
const kindName = {
  DEPOSIT: "Nạp tiền",
  ORDER: "Trừ tiền",
  REFUND: "Hoàn tiền",
  ADJUSTMENT: "Điều chỉnh",
};

export default function TransactionsPage() {
  const [payload, setPayload] = useState<any>({
      deposits: [],
      transactions: [],
      orders: [],
    }),
    [selectedId, setSelectedId] = useState(""),
    [type, setType] = useState("ALL"),
    [q, setQ] = useState(""),
    [method, setMethod] = useState("ALL"),
    [state, setState] = useState("ALL"),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [copied, setCopied] = useState("");
  useEffect(() => {
    fetch("/api/admin/transactions", { cache: "no-store" })
      .then((r) => r.json())
      .then((x) => {
        setPayload(x.data || { deposits: [], transactions: [], orders: [] });
        const first =
          x.data?.deposits?.[0]?.id || x.data?.transactions?.[0]?.id || "";
        setSelectedId(first);
      });
  }, []);
  const orders: Order[] = payload.orders || [];
  const rows: Row[] = useMemo(() => {
    const deposits = (payload.deposits || []).map((x: any) => ({
      id: x.id,
      kind: "DEPOSIT",
      amount: Number(x.amount),
      method: "VietQR",
      content: x.paymentCode,
      status: x.status,
      createdAt: x.createdAt,
      user: x.user,
      referenceId: x.id,
      deposit: x,
    }));
    const txs = (payload.transactions || []).map((x: any) => {
      const kind =
        x.type === "ORDER"
          ? "ORDER"
          : x.type === "REFUND"
            ? "REFUND"
            : "ADJUSTMENT";
      const order = orders.find((o) => o.id === x.referenceId);
      const signed =
        x.type === "ADMIN_DEBIT"
          ? -Math.abs(Number(x.amount))
          : Number(x.amount);
      return {
        id: x.id,
        kind,
        amount: signed,
        method: kind === "ADJUSTMENT" ? "Admin" : "Ví tài khoản",
        content: x.description,
        status: order?.status || "PAID",
        createdAt: x.createdAt,
        user: x.user,
        referenceId: x.referenceId,
        order,
      };
    });
    return [...deposits, ...txs].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    ) as Row[];
  }, [payload, orders]);
  const counts = useMemo(
    () => ({
      ALL: rows.length,
      DEPOSIT: rows.filter((x) => x.kind === "DEPOSIT").length,
      ORDER: rows.filter((x) => x.kind === "ORDER").length,
      REFUND: rows.filter((x) => x.kind === "REFUND").length,
      ADJUSTMENT: rows.filter((x) => x.kind === "ADJUSTMENT").length,
    }),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (x) =>
          (type === "ALL" || x.kind === type) &&
          (method === "ALL" || x.method === method) &&
          (state === "ALL" || x.status === state) &&
          (!q ||
            `${x.id} ${x.user?.username} ${x.user?.email} ${x.content}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [rows, type, method, state, q],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size)),
    shown = filtered.slice((page - 1) * size, page * size),
    selected = rows.find((x) => x.id === selectedId) || null;
  const userOrders = selected
    ? orders.filter((o) => o.userId === selected.user.id)
    : [];
  const copy = async (v: string) => {
    await navigator.clipboard.writeText(v);
    setCopied(v);
    setTimeout(() => setCopied(""), 1200);
  };
  const selectType = (v: string) => {
    setType(v);
    setPage(1);
  };
  return (
    <div className="admin-body transactions-page">
      <div className="transactions-head">
        <div>
          <h2>Giao dịch</h2>
          <p>
            Quản lý tất cả giao dịch nạp tiền, trừ tiền và liên kết với đơn hàng
          </p>
        </div>
        <label>
          ⌕
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm giao dịch..."
          />
        </label>
      </div>
      <div className="transaction-stats">
        <Stat tone="blue" icon="▤" title="Tổng giao dịch" value={counts.ALL} />
        <Stat tone="green" icon="↟" title="Nạp tiền" value={counts.DEPOSIT} />
        <Stat
          tone="red"
          icon="↡"
          title="Trừ tiền (đơn hàng)"
          value={counts.ORDER}
        />
        <Stat tone="purple" icon="↶" title="Hoàn tiền" value={counts.REFUND} />
      </div>
      <div className={"transactions-shell " + (selected ? "has-detail" : "")}>
        <section className="transactions-card">
          <div className="transaction-tabs">
            {[
              ["ALL", "Tất cả"],
              ["DEPOSIT", "Nạp tiền"],
              ["ORDER", "Trừ tiền"],
              ["REFUND", "Hoàn tiền"],
              ["ADJUSTMENT", "Điều chỉnh"],
            ].map(([key, label]) => (
              <button
                className={type === key ? "active" : ""}
                key={key}
                onClick={() => selectType(key)}
              >
                {label} <b>{(counts as any)[key]}</b>
              </button>
            ))}
          </div>
          <div className="transaction-filters">
            <label>
              ⌕
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo user, email, mã giao dịch, nội dung..."
              />
            </label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="ALL">Tất cả phương thức</option>
              <option>VietQR</option>
              <option>Ví tài khoản</option>
              <option>Admin</option>
            </select>
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Thời gian</th>
                  <th>Người dùng</th>
                  <th>Loại giao dịch</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((x, i) => (
                  <tr
                    className={selected?.id === x.id ? "selected" : ""}
                    key={x.id}
                    onClick={() => setSelectedId(x.id)}
                  >
                    <td>
                      <b>
                        #{String((page - 1) * size + i + 1).padStart(4, "0")}
                      </b>
                    </td>
                    <td>{dt(x.createdAt)}</td>
                    <td>
                      <div className="tx-user">
                        <i>{x.user?.username?.[0]?.toUpperCase() || "U"}</i>
                        <span>
                          <b>{x.user?.username}</b>
                          <small>{x.user?.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={"tx-kind " + x.kind.toLowerCase()}>
                        {kindName[x.kind]}
                      </span>
                    </td>
                    <td>
                      <strong
                        className={x.amount >= 0 ? "positive" : "negative"}
                      >
                        {money(x.amount)}
                      </strong>
                    </td>
                    <td>{x.method}</td>
                    <td className="tx-content">{x.content}</td>
                    <td>
                      <span className={"tx-status " + x.status.toLowerCase()}>
                        {statusLabel(x.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(x.id);
                        }}
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && (
              <div className="tx-empty">Không có giao dịch phù hợp.</div>
            )}
          </div>
          <div className="tx-pagination">
            <span>
              Hiển thị {shown.length ? (page - 1) * size + 1 : 0} -{" "}
              {Math.min(page * size, filtered.length)} / {filtered.length} giao
              dịch
            </span>
            <div>
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                ‹
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    className={page === n ? "active" : ""}
                    onClick={() => setPage(n)}
                    key={n}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
              >
                ›
              </button>
            </div>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="10">10 / trang</option>
              <option value="25">25 / trang</option>
              <option value="50">50 / trang</option>
            </select>
          </div>
        </section>
        {selected && (
          <TransactionDetail
            row={selected}
            orders={userOrders}
            close={() => setSelectedId("")}
            copy={copy}
            copied={copied}
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  tone,
  icon,
  title,
  value,
}: {
  tone: string;
  icon: string;
  title: string;
  value: number;
}) {
  return (
    <div className={"tx-stat " + tone}>
      <i>{icon}</i>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>↑ Dữ liệu thực tế</small>
      </div>
      <em>⌁</em>
    </div>
  );
}
function TransactionDetail({
  row,
  orders,
  close,
  copy,
  copied,
}: {
  row: Row;
  orders: Order[];
  close: () => void;
  copy: (v: string) => void;
  copied: string;
}) {
  return (
    <aside className="transaction-detail">
      <div className="tx-detail-head">
        <h3>Chi tiết giao dịch</h3>
        <button onClick={close}>×</button>
      </div>
      <div className="tx-detail-id">
        <h2>
          #{row.id.slice(-8)} <button onClick={() => copy(row.id)}>□</button>
        </h2>
        <span className={"tx-status " + row.status.toLowerCase()}>
          {statusLabel(row.status)}
        </span>
        <p>Thời gian: {dt(row.createdAt)}</p>
      </div>
      <section>
        <h4>Thông tin người dùng</h4>
        <div className="tx-profile">
          <i>{row.user.username[0].toUpperCase()}</i>
          <div>
            <b>{row.user.username}</b>
            <small>ID: {row.user.id.slice(0, 8)}</small>
            <small>{row.user.email}</small>
          </div>
          <Link href={`/admin/balance/${row.user.id}`}>Xem hồ sơ</Link>
        </div>
      </section>
      <section>
        <h4>Thông tin giao dịch</h4>
        <Info k="Loại giao dịch" v={kindName[row.kind]} />
        <Info
          k="Mã giao dịch"
          v={row.id.slice(-12)}
          copy={() => copy(row.id)}
        />
        <Info
          k="Số tiền"
          v={money(row.amount)}
          color={row.amount >= 0 ? "green" : "red"}
        />
        <Info k="Phương thức" v={row.method} />
        <Info k="Trạng thái" v={statusLabel(row.status)} />
        <Info k="Nội dung" v={row.content} />
        {copied && <small className="copied">Đã sao chép</small>}
      </section>
      {row.order && <OrderCard order={row.order} title="Đơn hàng liên quan" />}
      <section className="user-orders">
        <h4>
          Các đơn hàng người dùng đã tạo <b>{orders.length}</b>
        </h4>
        {orders.length ? (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <div className="no-orders">Người dùng chưa tạo đơn hàng nào</div>
        )}
      </section>
      <section className="tx-history">
        <h4>Lịch sử xử lý</h4>
        <p>
          <i />
          Tạo giao dịch <small>{dt(row.createdAt)}</small>
        </p>
        <p>
          <i />
          Ghi nhận vào số dư{" "}
          <small>{row.status === "PENDING" ? "Đang chờ..." : "Hoàn tất"}</small>
        </p>
      </section>
    </aside>
  );
}
function Info({
  k,
  v,
  color,
  copy,
}: {
  k: string;
  v: string;
  color?: string;
  copy?: () => void;
}) {
  return (
    <p className="tx-info">
      <span>{k}:</span>
      <b className={color}>
        {v} {copy && <button onClick={copy}>□</button>}
      </b>
    </p>
  );
}
function OrderCard({ order, title }: { order: Order; title?: string }) {
  return (
    <div className="related-order">
      {title && <h4>{title}</h4>}
      <div>
        <b>#{order.id.slice(-8)}</b>
        <span className={"order-state " + order.status.toLowerCase()}>
          {order.status}
        </span>
      </div>
      <p>
        {order.service?.platform?.name || "Nền tảng"} ·{" "}
        {order.service?.name || "Dịch vụ"}
      </p>
      <a href={order.link} target="_blank" rel="noreferrer">
        {order.link}
      </a>
      <small>
        Server: {order.server?.name || "—"} · SL:{" "}
        {Number(order.quantity).toLocaleString("vi-VN")} ·{" "}
        {new Intl.NumberFormat("vi-VN").format(Number(order.price))}đ
      </small>
      <small>{dt(order.createdAt)}</small>
    </div>
  );
}
