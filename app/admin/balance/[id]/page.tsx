'use client';

import '../../../admin/admin.css';
import './balance.css';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type User = {
  id: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  role: string;
  balance: number | string;
  totalDeposited: number | string;
  createdAt: string;
  _count?: { orders?: number; transactions?: number };
};

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

const inputMoney = (value: string) =>
  value ? new Intl.NumberFormat('vi-VN').format(Number(value)) : '';

export default function BalancePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'add' | 'sub'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Điều chỉnh thủ công');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id: userId }) => {
      setId(userId);
      fetch('/api/admin/users/' + userId, { cache: 'no-store' })
        .then(async (response) => {
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || 'Không tải được tài khoản.');
          return result;
        })
        .then((result) => setUser(result.data || null))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const currentBalance = Number(user?.balance || 0);
  const enteredAmount = Number(amount || 0);
  const nextBalance = useMemo(
    () => currentBalance + (mode === 'add' ? enteredAmount : -enteredAmount),
    [currentBalance, enteredAmount, mode],
  );

  function setQuickAmount(value: number) {
    setAmount(String(value));
    setMessage('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enteredAmount || enteredAmount < 0) {
      setMessageType('error');
      setMessage('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    if (saving) return;

    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'balance',
          amount: mode === 'add' ? enteredAmount : -enteredAmount,
          reason,
          note,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật số dư.');

      setUser((current) => current ? { ...current, balance: result.data.balance } : current);
      setAmount('');
      setNote('');
      setMessageType('success');
      setMessage(mode === 'add' ? 'Đã cộng số dư thành công.' : 'Đã trừ số dư thành công.');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="admin-body balance-page"><p className="balance-loading">Đang tải dữ liệu tài khoản...</p></div>;
  }

  if (!user) {
    return <div className="admin-body balance-page"><Link className="balance-back" href="/admin/users">← Quay lại người dùng</Link><div className="balance-error">Không tìm thấy tài khoản hoặc bạn không có quyền truy cập.</div></div>;
  }

  const account = user.username || user.email || 'Tài khoản';

  return (
    <div className="admin-body balance-page">
      <header className="balance-page-head">
        <div>
          <span className="balance-eyebrow">WALLET CONTROL / MANUAL ADJUSTMENT</span>
          <h2>Cộng / trừ số dư</h2>
          <p>Điều chỉnh ví tiền có ghi rõ lý do và lưu lại trong lịch sử giao dịch.</p>
        </div>
        <Link className="balance-back" href={'/admin/users/' + user.id}>← Xem hồ sơ</Link>
      </header>

      <section className="balance-profile">
        <div className="balance-avatar">{account.slice(0, 2).toUpperCase()}</div>
        <div className="balance-profile-copy">
          <h1>{account}<span>{user.role}</span></h1>
          <p>{user.email || 'Chưa đăng ký email'}</p>
          <small>ID {user.id} · Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</small>
        </div>
        <div className="balance-profile-stats">
          <MiniStat label="Số dư hiện tại" value={money(user.balance)} accent="mint" />
          <MiniStat label="Tổng đã nạp" value={money(user.totalDeposited)} accent="cyan" />
          <MiniStat label="Đơn hàng" value={String(user._count?.orders || 0)} accent="violet" />
        </div>
      </section>

      <section className="balance-workspace">
        <form className="balance-form-card" onSubmit={save}>
          <div className="balance-card-heading">
            <div><span>TRANSACTION BUILDER</span><h3>Tạo điều chỉnh số dư</h3></div>
            <span className="balance-lock">ADMIN ONLY</span>
          </div>

          <div className="balance-mode">
            <button type="button" className={mode === 'add' ? 'active add' : ''} onClick={() => setMode('add')}><b>＋</b><span>Cộng tiền<small>Tăng số dư ví</small></span></button>
            <button type="button" className={mode === 'sub' ? 'active sub' : ''} onClick={() => setMode('sub')}><b>−</b><span>Trừ tiền<small>Giảm số dư ví</small></span></button>
          </div>

          <label className="balance-field">
            <span>Số tiền cần {mode === 'add' ? 'cộng' : 'trừ'}</span>
            <div className="amount-input"><input value={inputMoney(amount)} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} placeholder="0" inputMode="numeric" autoComplete="off" /><b>đ</b></div>
            <small>Nhập số nguyên, hệ thống sẽ cập nhật trực tiếp vào số dư tài khoản.</small>
          </label>

          <div className="quick-amounts"><span>Mức nhanh</span>{[50000, 100000, 500000, 1000000].map((value) => <button type="button" key={value} onClick={() => setQuickAmount(value)}>{new Intl.NumberFormat('vi-VN').format(value)}đ</button>)}</div>

          <label className="balance-field"><span>Lý do điều chỉnh</span><select value={reason} onChange={(event) => setReason(event.target.value)}><option>Điều chỉnh thủ công</option><option>Thưởng sự kiện</option><option>Hoàn tiền</option><option>Hỗ trợ khách hàng</option><option>Khác</option></select></label>
          <label className="balance-field"><span>Ghi chú nội bộ <em>(tùy chọn)</em></span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nhập nội dung để dễ đối soát sau này..." /></label>

          <button className={'balance-submit ' + mode} disabled={saving} type="submit">{saving ? 'Đang lưu thay đổi...' : mode === 'add' ? '＋ Xác nhận cộng tiền' : '− Xác nhận trừ tiền'}</button>
          {message && <p className={'balance-message ' + messageType}>{message}</p>}
        </form>

        <aside className="balance-side-panel">
          <div className="balance-preview-card">
            <span className="balance-side-kicker">BALANCE PREVIEW</span>
            <h3>Số dư sau điều chỉnh</h3>
            <strong className={mode === 'add' ? 'positive' : 'negative'}>{money(nextBalance)}</strong>
            <div className="balance-preview-line"><span>Số dư trước</span><b>{money(currentBalance)}</b></div>
            <div className="balance-preview-line"><span>Biến động</span><b className={mode === 'add' ? 'positive' : 'negative'}>{mode === 'add' ? '+' : '−'}{money(enteredAmount)}</b></div>
          </div>

          <div className="balance-guidance">
            <span className="balance-side-kicker">QUICK CHECK</span>
            <h3>Kiểm tra trước khi lưu</h3>
            <p><b>01</b> Xác nhận đúng tài khoản và số tiền.</p>
            <p><b>02</b> Chọn lý do để minh bạch lịch sử.</p>
            <p><b>03</b> Ghi chú nếu đây là hoàn tiền hoặc hỗ trợ.</p>
          </div>

          <Link className="balance-detail-link" href={'/admin/users/' + user.id}>Mở toàn bộ hồ sơ tài khoản <span>↗</span></Link>
        </aside>
      </section>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <div className={'balance-mini-stat ' + accent}><small>{label}</small><b>{value}</b></div>;
}
