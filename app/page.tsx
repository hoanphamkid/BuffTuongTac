'use client';

import './comment.css';
import '../components/payment/payment.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import PlatformPicker from '@/app/_components/PlatformPicker';
import { OrderSuccessModal } from '@/components/order/OrderSuccessModal';

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';

type Server = {
  id: string;
  name: string;
  description: string | null;
  speed: string;
  min: number;
  max: number;
  pricePer1000: string | number;
};

type Service = { id: string; name: string; slug?: string; servers: Server[] };
type Platform = { id: string; name: string; slug?: string; services: Service[] };
type CreatedOrder = { id: string; service: string; server: string; quantity: number; total: number };

const displayName = (value: string | undefined, fallback: string) =>
  value?.replace(/^\S+\s+/, '') || fallback;

export default function Home() {
  const { user, loading, refreshUser, clearUser } = useCurrentUser();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Platform[]>([]);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [server, setServer] = useState<Server | null>(null);
  const [link, setLink] = useState('');
  const [comments, setComments] = useState('');
  const [reaction, setReaction] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [trialMode, setTrialMode] = useState(false);
  const [trialKey, setTrialKey] = useState('');
  const [showTrialKeyNotice, setShowTrialKeyNotice] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    fetch('/api/catalog')
      .then((response) => response.json())
      .then((result) => setCatalog(result.data || []));
  }, []);

  useEffect(() => {
    if (!platform) {
      setService(null);
      return;
    }
    setService(
      trialMode
        ? platform.services.find((item) => item.slug === 'tiktok-views') || null
        : platform.services[0] || null,
    );
  }, [platform, trialMode]);

  useEffect(() => setServer(service?.servers[0] || null), [service]);

  useEffect(() => {
    if (!trialMode) return;
    const tiktok = catalog.find((item) => item.slug === 'tiktok');
    if (tiktok && platform?.id !== tiktok.id) setPlatform(tiktok);
  }, [catalog, platform, trialMode]);

  const isComments = !trialMode && service?.slug === 'tiktok-comments';
  const isFacebookReaction = !trialMode && platform?.slug === 'facebook' && server?.name.includes('[SV2]');
  const reactions = [
    ['like', '👍'], ['love', '❤️'], ['care', '🥰'], ['haha', '😆'],
    ['wow', '😮'], ['sad', '😢'], ['angry', '😡'],
  ];
  const commentLines = useMemo(
    () => comments.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    [comments],
  );

  useEffect(() => {
    if (isComments) setQuantity(commentLines.length || 0);
  }, [isComments, commentLines.length]);

  const total = useMemo(
    () => trialMode ? 0 : server ? Math.ceil(quantity * Number(server.pricePer1000) / 1000) : 0,
    [server, quantity, trialMode],
  );

  function changeMode(nextTrialMode: boolean) {
    setTrialMode(nextTrialMode);
    setTrialKey('');
    setShowTrialKeyNotice(false);
    setMessage('');
    setReaction('');
    if (nextTrialMode) {
      setQuantity(100);
    } else {
      setPlatform(null);
      setService(null);
      setServer(null);
      setQuantity(1000);
    }
  }

  async function create() {
    const value = link.trim();
    if (trialMode && !trialKey.trim()) {
      setMessage('');
      setShowTrialKeyNotice(true);
      return;
    }
    if (!value) {
      setMessage('Vui lòng nhập link cần tăng.');
      return;
    }
    try {
      new URL(value);
    } catch {
      setMessage('Link không hợp lệ. Vui lòng nhập URL đầy đủ.');
      return;
    }
    if (trialMode && (quantity < 100 || quantity > 1000)) {
      setMessage('Gói thử cho phép số lượng từ 100 đến 1000.');
      return;
    }
    if (!server || !service) {
      setMessage(trialMode ? 'Gói thử chưa sẵn sàng. Vui lòng thử lại.' : 'Vui lòng chọn nền tảng và dịch vụ.');
      return;
    }
    if (isComments && !commentLines.length) {
      setMessage('Vui lòng nhập ít nhất một comment.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serverId: server.id,
          link: value,
          quantity,
          ...(trialMode ? { trialKey: trialKey.trim() } : {}),
          ...(isComments ? { comments: commentLines } : {}),
          ...(isFacebookReaction ? { reaction } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === 'INSUFFICIENT_BALANCE') await refreshUser();
        setMessage(data.error || 'Không thể tạo đơn hàng.');
        return;
      }

      const order = data.data;
      setLink('');
      if (isComments) setComments('');
      if (trialMode) setTrialKey('');
      await refreshUser();
      setCreatedOrder({
        id: order.id,
        service: service.name,
        server: server.name,
        quantity: order.quantity,
        total: Number(order.price),
      });
    } catch {
      setMessage('Không thể kết nối máy chủ.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearUser();
    router.replace('/login');
  }

  if (loading) return <div className="loading-screen">Đang tải tài khoản...</div>;

  return (
    <div className="shell">
      <aside>
        <div className="brand">KID <span>Social</span></div>
        <div className="user">
          <div className="avatar">{user?.username?.slice(0, 2).toUpperCase()}</div>
          <div><b>{user?.username}</b><small>Số dư: {money(user?.balance)}</small></div>
        </div>
        <nav>
          <label>DỊCH VỤ & ĐƠN HÀNG</label>
          {[
            ['Tạo đơn mới', '/'], ['Đơn hàng hàng loạt', '/mass-order'],
            ['Lịch sử đơn hàng', '/orders'], ['Danh sách dịch vụ', '/services'], ['Hỗ trợ', '/support'],
          ].map(([label, href]) => <button onClick={() => router.push(href)} key={href}>◈ {label}</button>)}
          <label>TÀI KHOẢN</label>
          {[
            ['Tài khoản của tôi', '/account'], ['Nạp tiền', '/add-funds'],
            ['Lịch sử hoàn tiền', '/refunds'], ['API SMM V2', '/api-docs'],
          ].map(([label, href]) => <button onClick={() => router.push(href)} key={href}>◈ {label}</button>)}
          <button onClick={logout}>◈ Đăng xuất</button>
        </nav>
      </aside>

      <main>
        <header>
          <div><span className="crumb">Bảng điều khiển</span><h1>Tạo đơn mới</h1></div>
          <div className="head-user">◉ {user?.username} <span>{money(user?.balance)}</span></div>
        </header>

        <div className={'card order ' + (isComments ? 'comments-order' : '')}>
          <div className="order-mode-switch" role="tablist" aria-label="Loại đơn hàng">
            <button type="button" className={!trialMode ? 'selected' : ''} onClick={() => changeMode(false)}>
              Đặt đơn thường
            </button>
            <button type="button" className={trialMode ? 'selected trial' : ''} onClick={() => changeMode(true)}>
              Gói thử miễn phí
            </button>
          </div>

          <div className="field">
            <label>Liên kết *</label>
            <input required value={link} onChange={(event) => setLink(event.target.value)} placeholder="Nhập liên kết cần tăng..." />
          </div>

          {trialMode ? (
            <div className="trial-service-box">
              <div><small>NỀN TẢNG</small><strong>{displayName(platform?.name, 'TikTok')}</strong></div>
              <div><small>DỊCH VỤ</small><strong>{service?.name || 'TikTok Views'}</strong></div>
              <p>Gói thử chỉ áp dụng cho TikTok Views và không trừ số dư.</p>
            </div>
          ) : (
            <div className="grid2">
              <div className="field">
                <label>Nền tảng</label>
                <PlatformPicker items={catalog} value={platform?.id || ''} onChange={(item: Platform) => setPlatform(item)} />
              </div>
              <div className="field">
                <label>Dịch vụ</label>
                <select
                  value={service?.id || ''}
                  disabled={!platform}
                  onChange={(event) => setService(platform?.services.find((item) => item.id === event.target.value) || null)}
                >
                  <option value="">{platform ? 'Chọn dịch vụ' : 'Chọn nền tảng trước'}</option>
                  {platform?.services.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <label className="section-label">Máy chủ</label>
          <div className="servers">
            {service?.servers.map((item) => (
              <label className={'server ' + (server?.id === item.id ? 'chosen' : '')} key={item.id}>
                <input type="radio" checked={server?.id === item.id} onChange={() => setServer(item)} />
                <div>
                  <small>Mã: {item.id}</small>
                  <strong>{item.name} <i>✓</i></strong>
                  <p>{item.description || ''} · Tốc độ: {item.speed} · Tối thiểu: {item.min} · Tối đa: {item.max}</p>
                </div>
                <b>{isComments ? money(Number(item.pricePer1000) / 1000) + ' / comment' : trialMode ? 'Miễn phí' : money(item.pricePer1000) + ' / 1000'}<br /><em>Đang hoạt động</em></b>
              </label>
            ))}
          </div>

          {trialMode ? (
            <>
              <div className="field">
                <label>Số lượng dùng thử (100 - 1000)</label>
                <input type="number" min={100} max={1000} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
                <small className="trial-help">Mỗi tài khoản chỉ được dùng gói thử một lần.</small>
              </div>
              <div className="field trial-key-field">
                <label>KEY dùng thử *</label>
                <input value={trialKey} onChange={(event) => setTrialKey(event.target.value.toUpperCase())} placeholder="Nhập KEY admin cung cấp..." autoComplete="off" />
                <a href="https://zalo.me/0945459491" target="_blank" rel="noreferrer">Chưa có KEY? Inbox admin trên Zalo để nhận KEY</a>
              </div>
            </>
          ) : isComments ? (
            <div className="field">
              <label>Nội dung comment *</label>
              <textarea className="comment-box" value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Mỗi hàng là một comment..." />
              <small className="comment-count">{commentLines.length} comment · {server ? money(Number(server.pricePer1000) / 1000) : '0đ'}/comment</small>
            </div>
          ) : (
            <div className="field">
              <label>Số lượng</label>
              <input type="number" min={server?.min || 1} max={server?.max || 1000000} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </div>
          )}

          <div className="total">
            <div><small>{trialMode ? 'Tổng thanh toán gói thử' : 'Tổng thanh toán'}</small><strong>{trialMode ? 'Miễn phí' : money(total)}</strong></div>
            <span>▣</span>
          </div>
          {message && <div className="notice">{message}</div>}
          <button className="primary" disabled={busy || !server || quantity < 1} onClick={create}>
            {busy ? 'Đang xử lý...' : trialMode ? 'Tạo gói thử miễn phí' : 'Tạo đơn hàng'}
          </button>
        </div>
      </main>
      <OrderSuccessModal order={createdOrder} onClose={() => setCreatedOrder(null)} />
      {showTrialKeyNotice && (
        <div className="payment-overlay trial-key-notice-overlay" role="dialog" aria-modal="true" aria-label="Thông báo nhận KEY dùng thử">
          <div className="success-modal trial-key-notice">
            <div className="trial-key-error-icon" aria-hidden="true">!</div>
            <h2>Lỗi!</h2>
            <p>Vui lòng inbox admin để nhận KEY dùng thử trước khi tạo đơn.</p>
            <div className="trial-key-actions">
              <a className="trial-key-inbox" href="https://zalo.me/0945459491" target="_blank" rel="noreferrer" aria-label="Inbox admin trên Zalo">Inbox ngay</a>
              <button className="trial-key-ok" onClick={() => setShowTrialKeyNotice(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
