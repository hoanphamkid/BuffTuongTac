"use client";
import "./deposits.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { statusLabel } from "@/lib/status-label";

type Deposit = {
  id: string;
  userId: string;
  amount: string | number;
  paymentCode: string;
  transactionId?: string | null;
  paymentMethod: string;
  status: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
  paidAt?: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    balance?: string | number;
  };
};
const money = (value: unknown) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "đ";
const date = (value: string) => new Date(value).toLocaleDateString("vi-VN");
const time = (value: string) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const labels = {
  all: "Tất cả",
  PAID: "Đã thanh toán",
  PENDING: "Chờ xử lý",
  FAILED: "Đã hủy",
} as const;

export default function AdminDeposits() {
  const [rows, setRows] = useState<Deposit[]>([]),
    [selectedId, setSelectedId] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState<keyof typeof labels>("all"),
    [method, setMethod] = useState("all"),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [payTab, setPayTab] = useState("vietqr"),
    [bank, setBank] = useState<any>({});
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/admin/deposits", { cache: "no-store" }),
        fetch("/api/payment-info", { cache: "no-store" }),
      ]);
      const data = await a.json();
      const bankData = await b.json();
      setRows(data.data || []);
      setBank(bankData.data || {});
      setSelectedId((current) => current || data.data?.[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const counts = useMemo(
    () => ({
      all: rows.length,
      PAID: rows.filter((x) => x.status === "PAID").length,
      PENDING: rows.filter((x) => x.status === "PENDING").length,
      FAILED: rows.filter((x) => x.status === "FAILED").length,
    }),
    [rows],
  );
  const totalPaid = useMemo(
    () =>
      rows
        .filter((x) => x.status === "PAID")
        .reduce((sum, x) => sum + Number(x.amount), 0),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter((x) => {
        const hay =
          `${x.user?.username || ""} ${x.user?.email || ""} ${x.paymentCode} ${x.amount}`.toLowerCase();
        return (
          (!query || hay.includes(query.toLowerCase())) &&
          (status === "all" || x.status === status) &&
          (method === "all" || x.paymentMethod === method)
        );
      }),
    [rows, query, status, method],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  const shown = filtered.slice((page - 1) * size, page * size);
  const selected = rows.find((x) => x.id === selectedId) || shown[0] || null;
  const qr = selected
    ? `https://img.vietqr.io/image/${bank.bankId || "MB"}-${bank.accountNumber || ""}-compact2.png?amount=${Number(selected.amount)}&addInfo=${encodeURIComponent(selected.paymentCode)}`
    : "";
  const chooseStatus = (value: keyof typeof labels) => {
    setStatus(value);
    setPage(1);
  };
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setNotice("Đã sao chép");
    setTimeout(() => setNotice(""), 1600);
  };
  const exportCsv = () => {
    const header = [
      "Mã giao dịch",
      "Người dùng",
      "Email",
      "Mã nạp",
      "Số tiền",
      "Phương thức",
      "Trạng thái",
      "Thời gian",
    ];
    const body = filtered.map((x) => [
      x.id,
      x.user?.username || "",
      x.user?.email || "",
      x.paymentCode,
      String(x.amount),
      x.paymentMethod,
      x.status,
      new Date(x.createdAt).toISOString(),
    ]);
    const csv = [header, ...body]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    a.download = "giao-dich-nap-tien.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const updateStatus = async (action: "paid" | "cancel") => {
    if (!selected || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/deposits", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: selected.id, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật");
      setNotice(
        action === "paid" ? "Đã xác nhận thanh toán" : "Đã hủy giao dịch",
      );
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-body deposits-page">
      <div className="deposit-page-head">
        <div>
          <h2>Nạp tiền</h2>
          <p>Quản lý và xử lý các giao dịch nạp tiền của người dùng</p>
        </div>
        <div className="deposit-head-tools">
          <label>
            ⌕
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm user, mã nạp, email..."
            />
          </label>
          <button onClick={load} title="Tải lại">
            ↻
          </button>
          <button
            onClick={() => {
              setQuery("");
              chooseStatus("all");
              setMethod("all");
            }}
          >
            Đặt lại
          </button>
        </div>
      </div>
      <div className="deposit-summary">
        <Summary
          icon="▣"
          tone="blue"
          title="Tổng giao dịch"
          value={counts.all}
          note="↑ Dữ liệu thực tế"
        />
        <Summary
          icon="✓"
          tone="green"
          title="Đã thanh toán"
          value={counts.PAID}
          note="↑ Giao dịch thành công"
        />
        <Summary
          icon="◷"
          tone="orange"
          title="Chờ xử lý"
          value={counts.PENDING}
          note="Đang chờ thanh toán"
        />
        <Summary
          icon="×"
          tone="red"
          title="Đã hủy"
          value={counts.FAILED}
          note="Giao dịch thất bại"
        />
        <div className="total-paid-card">
          <div className="coin-icon">▤</div>
          <div>
            <span>Tổng tiền đã nạp</span>
            <strong>{money(totalPaid)}</strong>
          </div>
          <select defaultValue="7">
            <option value="7">7 ngày</option>
            <option value="30">30 ngày</option>
          </select>
          <div className="mini-bars">
            {[35, 55, 25, 68, 48, 82, 62].map((h, i) => (
              <i key={i} style={{ height: h + "%" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="deposit-workspace">
        <section className="deposit-list-card">
          <div className="list-title">
            <h3>▣　Danh sách giao dịch nạp tiền</h3>
            <button onClick={exportCsv}>⇩ Xuất dữ liệu</button>
          </div>
          <div className="status-tabs">
            {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
              <button
                className={status === key ? "active" : ""}
                onClick={() => chooseStatus(key)}
                key={key}
              >
                <span className={"dot " + key.toLowerCase()} />
                {labels[key]} <b>{counts[key]}</b>
              </button>
            ))}
          </div>
          <div className="list-filters">
            <label>
              ⌕
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm user, email, mã nạp, số tiền..."
              />
            </label>
            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả phương thức</option>
              <option value="BANK_TRANSFER">VietQR - Ngân hàng</option>
            </select>
            <select
              value={status}
              onChange={(e) =>
                chooseStatus(e.target.value as keyof typeof labels)
              }
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="FAILED">Đã hủy</option>
            </select>
          </div>
          <div className="deposit-table-wrap">
            <table className="deposit-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người dùng</th>
                  <th>Mã nạp</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((x, index) => (
                  <tr
                    className={selected?.id === x.id ? "selected" : ""}
                    key={x.id}
                    onClick={() => setSelectedId(x.id)}
                  >
                    <td>{(page - 1) * size + index + 1}</td>
                    <td>
                      <div className="user-cell">
                        <i>
                          {(x.user?.username || "U").slice(0, 1).toUpperCase()}
                        </i>
                        <span>
                          <b>{x.user?.username || "—"}</b>
                          <small>{x.user?.email || "—"}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <b>{x.paymentCode}</b>
                    </td>
                    <td>
                      <strong>{money(x.amount)}</strong>
                    </td>
                    <td>
                      <span className="method-badge">▣</span> VietQR
                    </td>
                    <td>
                      <Status value={x.status} />
                    </td>
                    <td>
                      {time(x.createdAt)}
                      <small>{date(x.createdAt)}</small>
                    </td>
                    <td>
                      <button
                        className="view-button"
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
            {!loading && !shown.length && (
              <div className="empty-deposits">Không có giao dịch phù hợp.</div>
            )}
            {loading && (
              <div className="empty-deposits">Đang tải dữ liệu...</div>
            )}
          </div>
          <div className="deposit-pagination">
            <span>
              Hiển thị {shown.length ? (page - 1) * size + 1 : 0} -{" "}
              {Math.min(page * size, filtered.length)} / {filtered.length} giao
              dịch
            </span>
            <div>
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                ‹
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(
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
        <Detail
          deposit={selected}
          bank={bank}
          qr={qr}
          payTab={payTab}
          setPayTab={setPayTab}
          copy={copy}
          busy={busy}
          updateStatus={updateStatus}
          reload={load}
        />
      </div>
      {notice && <div className="deposit-toast">{notice}</div>}
    </div>
  );
}

function Summary({
  icon,
  tone,
  title,
  value,
  note,
}: {
  icon: string;
  tone: string;
  title: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className={"summary-card " + tone}>
      <i>{icon}</i>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <em>⌁</em>
    </div>
  );
}
function Status({ value }: { value: Deposit["status"] }) {
  return (
    <span className={"deposit-status " + value.toLowerCase()}>
      {statusLabel(value)}
    </span>
  );
}
function Detail({
  deposit,
  bank,
  qr,
  payTab,
  setPayTab,
  copy,
  busy,
  updateStatus,
  reload,
}: {
  deposit: Deposit | null;
  bank: any;
  qr: string;
  payTab: string;
  setPayTab: (x: string) => void;
  copy: (x: string) => void;
  busy: boolean;
  updateStatus: (x: "paid" | "cancel") => void;
  reload: () => void;
}) {
  if (!deposit)
    return (
      <aside className="deposit-detail empty">
        <b>Chọn một giao dịch để xem chi tiết</b>
      </aside>
    );
  return (
    <aside className="deposit-detail">
      <div className="detail-hero">
        <div>
          <h3>▣　Chi tiết giao dịch</h3>
          <h2>
            #{deposit.paymentCode}{" "}
            <button onClick={() => copy(deposit.paymentCode)}>□</button>
          </h2>
          <p>
            Tạo lúc: {date(deposit.createdAt)} {time(deposit.createdAt)}
          </p>
        </div>
        <Status value={deposit.status} />
      </div>
      <div className="detail-body">
        <div className="detail-grid">
          <section>
            <h4>Thông tin người dùng</h4>
            <div className="detail-user">
              <i>{(deposit.user?.username || "U")[0].toUpperCase()}</i>
              <div>
                <b>{deposit.user?.username}</b>
                <small>ID: {deposit.userId.slice(0, 8)}</small>
                <small>{deposit.user?.email}</small>
              </div>
            </div>
          </section>
          <section>
            <h4>Thông tin giao dịch</h4>
            <p>
              <span>Mã nạp:</span>
              <b>
                {deposit.paymentCode}{" "}
                <button onClick={() => copy(deposit.paymentCode)}>□</button>
              </b>
            </p>
            <p>
              <span>Số tiền:</span>
              <b className="red-text">{money(deposit.amount)}</b>
            </p>
            <p>
              <span>Phương thức:</span>
              <b>VietQR - {bank.bankId || "MB"}</b>
            </p>
            <p>
              <span>Trạng thái:</span>
              <Status value={deposit.status} />
            </p>
            <p>
              <span>Thời gian:</span>
              <b>
                {date(deposit.createdAt)} {time(deposit.createdAt)}
              </b>
            </p>
          </section>
        </div>
        <section className="payment-info">
          <h4>Thông tin thanh toán</h4>
          <div className="payment-tabs">
            <button
              className={payTab === "vietqr" ? "active" : ""}
              onClick={() => setPayTab("vietqr")}
            >
              VietQR
            </button>
            <button
              className={payTab === "bank" ? "active" : ""}
              onClick={() => setPayTab("bank")}
            >
              Chuyển khoản
            </button>
            <button
              className={payTab === "card" ? "active" : ""}
              onClick={() => setPayTab("card")}
            >
              Thẻ cào
            </button>
          </div>
          {payTab === "vietqr" ? (
            <div className="qr-panel">
              <div>{qr && <img src={qr} alt="QR thanh toán" />}</div>
              <div>
                <p>
                  <span>Ngân hàng:</span>
                  <b>{bank.bankId || "MB Bank"}</b>
                </p>
                <p>
                  <span>Số tài khoản:</span>
                  <b>{bank.accountNumber || "—"}</b>
                </p>
                <p>
                  <span>Chủ tài khoản:</span>
                  <b>{bank.accountName || "—"}</b>
                </p>
                <label>
                  Nội dung CK:
                  <button onClick={() => copy(deposit.paymentCode)}>
                    {deposit.paymentCode}　□
                  </button>
                </label>
              </div>
            </div>
          ) : (
            <div className="payment-placeholder">
              {payTab === "bank"
                ? "Thông tin chuyển khoản ngân hàng"
                : "Phương thức thẻ cào chưa được cấu hình"}
            </div>
          )}
        </section>
        <div className="detail-bottom">
          <section>
            <h4>Trạng thái xử lý</h4>
            <p className="done">
              ● <span>Tạo yêu cầu nạp tiền</span>
              <small>
                {date(deposit.createdAt)} {time(deposit.createdAt)}
              </small>
            </p>
            <p className={deposit.status === "PAID" ? "done" : "waiting"}>
              ●{" "}
              <span>
                {deposit.status === "PAID"
                  ? "Đã thanh toán"
                  : "Chờ người dùng thanh toán"}
              </span>
              <small>
                {deposit.paidAt ? date(deposit.paidAt) : "Đang chờ..."}
              </small>
            </p>
            <p>
              ● <span>Cập nhật số dư</span>
              <small>
                {deposit.status === "PAID" ? "Hoàn tất" : "Chưa có dữ liệu"}
              </small>
            </p>
          </section>
          <section className="detail-actions">
            <h4>Thao tác</h4>
            <button
              className="mark-paid"
              disabled={busy || deposit.status === "PAID"}
              onClick={() => updateStatus("paid")}
            >
              ✓　Đánh dấu đã thanh toán
            </button>
            <button
              className="cancel-deposit"
              disabled={busy || deposit.status !== "PENDING"}
              onClick={() => updateStatus("cancel")}
            >
              ×　Hủy giao dịch
            </button>
            <button onClick={reload}>↻　Gửi lại thông tin</button>
          </section>
        </div>
      </div>
    </aside>
  );
}
