'use client';

import './trial-keys.css';
import { useEffect, useMemo, useState } from 'react';

type TrialKey = {
  id: string;
  key: string;
  usedAt: string | null;
  createdAt: string;
  usedByUser?: { username: string; email: string | null } | null;
};

const date = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '—';

export default function TrialKeysPage() {
  const [keys, setKeys] = useState<TrialKey[]>([]);
  const [count, setCount] = useState(1);
  const [newKeys, setNewKeys] = useState<TrialKey[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/trial-keys', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Không tải được danh sách KEY.');
        setKeys(result.data || []);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Không tải được danh sách KEY.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const available = useMemo(() => keys.filter((item) => !item.usedAt).length, [keys]);
  const used = keys.length - available;

  async function createKeys(event: React.FormEvent) {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/trial-keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể tạo KEY.');
      setNewKeys(result.data || []);
      setCount(1);
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tạo KEY.');
    } finally {
      setCreating(false);
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage(`Đã sao chép KEY ${value}.`);
  }

  async function copyAll() {
    if (!newKeys.length) return;
    await navigator.clipboard.writeText(newKeys.map((item) => item.key).join('\n'));
    setMessage(`Đã sao chép ${newKeys.length} KEY mới.`);
  }

  return (
    <div className="admin-body trial-keys-page">
      <h2 className="admin-only-title">KEY gói thử</h2>
      <p className="admin-only-sub">Tạo và quản lý KEY miễn phí để gửi cho người dùng.</p>

      <div className="admin-stats trial-key-stats">
        <div className="admin-card admin-stat"><small>TỔNG KEY</small><strong>{keys.length}</strong><span>↗ Đã tạo</span></div>
        <div className="admin-card admin-stat"><small>KEY CÒN LẠI</small><strong>{available}</strong><span>↗ Có thể cấp</span></div>
        <div className="admin-card admin-stat"><small>ĐÃ SỬ DỤNG</small><strong>{used}</strong><span>↗ Đã cấp cho user</span></div>
      </div>

      <div className="trial-key-grid">
        <form className="admin-card trial-key-create" onSubmit={createKeys}>
          <h2>Tạo KEY mới</h2>
          <p>Tạo tối đa 50 KEY mỗi lần để gửi cho người dùng qua Zalo.</p>
          <label>Số lượng KEY<input type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} /></label>
          <button className="trial-key-primary" disabled={creating}>{creating ? 'Đang tạo...' : '＋ Tạo KEY'}</button>
          {message && <div className="trial-key-message">{message}</div>}
        </form>

        {newKeys.length > 0 && (
          <section className="admin-card trial-key-new">
            <div className="trial-key-section-head"><div><h2>KEY vừa tạo</h2><p>Copy và gửi cho người dùng.</p></div><button onClick={copyAll}>Sao chép tất cả</button></div>
            <div className="new-key-list">{newKeys.map((item) => <button key={item.id} onClick={() => copy(item.key)} title="Sao chép KEY">{item.key} <span>⧉</span></button>)}</div>
          </section>
        )}
      </div>

      <section className="admin-card trial-key-table-card">
        <div className="trial-key-section-head"><div><h2>Danh sách KEY</h2><p>KEY đã dùng sẽ không thể cấp lại.</p></div><button onClick={load}>↻ Làm mới</button></div>
        {loading ? <p>Đang tải danh sách KEY...</p> : (
          <div className="trial-key-table-wrap">
            <table className="admin-table trial-key-table">
              <thead><tr><th>KEY</th><th>TRẠNG THÁI</th><th>NGƯỜI DÙNG</th><th>NGÀY TẠO</th><th>ĐÃ DÙNG LÚC</th><th></th></tr></thead>
              <tbody>{keys.map((item) => (
                <tr key={item.id}>
                  <td><b className="key-code">{item.key}</b></td>
                  <td><span className={'pill ' + (item.usedAt ? 'red' : 'blue')}>{item.usedAt ? 'ĐÃ DÙNG' : 'CÒN TRỐNG'}</span></td>
                  <td>{item.usedByUser?.username || '—'}</td>
                  <td>{date(item.createdAt)}</td>
                  <td>{date(item.usedAt)}</td>
                  <td><button className="copy-key" onClick={() => copy(item.key)}>Sao chép</button></td>
                </tr>
              ))}</tbody>
            </table>
            {!keys.length && <p>Chưa có KEY nào.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
