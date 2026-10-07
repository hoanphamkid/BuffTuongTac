'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import styles from './customer-reviews.module.css';

type Review = {
  id: string; username: string; service: string; rating: number; content: string; createdAt: string;
  platform: { name: string; slug: string };
};
type ReviewData = {
  reviews: Review[];
  summary: { total: number; average: number | null; counts: Record<number, number> };
  pagination: { page: number; totalPages: number; total: number };
  eligibility: { signedIn: boolean; orderCount: number; orders: { id: string; service: string; createdAt: string }[] };
};
const ratings = [5, 4, 3, 2, 1];
const ratingLabels = ['Chọn số sao', 'Chưa hài lòng', 'Cần cải thiện', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];
const date = (value: string) => new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

const previewReviews = [
  { name: 'Khách mẫu 01', service: 'TikTok Views', rating: 5, content: 'Giao diện dễ sử dụng, thông tin dịch vụ và tổng tiền được trình bày rõ ràng.' },
  { name: 'Khách mẫu 02', service: 'Facebook Likes', rating: 4, content: 'Các bước đặt đơn khá đơn giản. Mình muốn có thêm thông báo khi đơn hoàn thành.' },
  { name: 'Khách mẫu 03', service: 'Instagram Followers', rating: 5, content: 'Phần lịch sử đơn hàng dễ theo dõi, có sẵn chỗ liên hệ khi cần hỗ trợ.' },
];

function Star({ filled = true }: { filled?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#f8c65a' : '#29405a'} stroke={filled ? '#f8c65a' : '#486078'} strokeWidth="1" aria-hidden="true" className={`${styles['review-star']} ${filled ? styles['is-filled'] : ''}`}><path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9Z" /></svg>;
}

function ReviewIcon({ kind }: { kind: 'message' | 'check' | 'lock' | 'pen' }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'message' ? <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /><path d="M8 10h8M8 14h5" /></> :
      kind === 'check' ? <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8.5 11.5 2.5 2.5 4.5-5" /></> :
      kind === 'lock' ? <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></> :
      <><path d="m16 3 5 5-12 12H4v-5L16 3ZM13 6l5 5M3 22h18" /></>}
  </svg>;
}

export function CustomerReviews({ refreshKey }: { refreshKey?: string }) {
  const { user } = useCurrentUser();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let active = true;
    setLoading(true);
    setLoadError('');
    fetch(`/api/reviews?page=${page}${filter ? `&rating=${filter}` : ''}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.data) throw new Error(result.error || 'Không thể tải đánh giá.');
        if (active) {
          const next = result.data as ReviewData;
          setData(next);
          setOrderId((previous) => next.eligibility.orders.some((order) => order.id === previous) ? previous : next.eligibility.orders[0]?.id || '');
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.name === 'AbortError' ? 'Kết nối hơi lâu. Bạn thử tải lại nhé.' : error.message || 'Không thể tải đánh giá.');
      })
      .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [filter, page, reload, user?.id, refreshKey]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setReload((value) => value + 1); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  const summary = data?.summary;
  const eligibility = data?.eligibility;
  const canReview = !!eligibility?.signedIn && !!eligibility.orders.length && !loading && !loadError;
  const selectedOrder = eligibility?.orders.find((order) => order.id === orderId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canReview || saving) return;
    if (!selectedOrder || !rating || content.trim().length < 10) {
      setSubmitError('Chọn đơn hàng, chấm sao và viết nhận xét ít nhất 10 ký tự nhé.');
      return;
    }
    setSaving(true);
    setSubmitError('');
    setSuccess('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, content: content.trim() }), signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) {
        if ([401, 403, 404, 409].includes(response.status)) setReload((value) => value + 1);
        throw new Error(result.error || 'Chưa gửi được đánh giá.');
      }
      setSuccess('Cảm ơn bạn! Đánh giá của bạn đã được đăng.');
      setContent('');
      setRating(0);
      setHoverRating(0);
      setFilter(0);
      setPage(1);
      setReload((value) => value + 1);
    } catch (error) {
      setSubmitError(error instanceof Error && error.name !== 'AbortError' ? error.message : 'Chưa xác nhận được kết quả gửi. Hãy tải lại trước khi gửi lại.');
    } finally { window.clearTimeout(timeout); setSaving(false); }
  }

  function focusForm() {
    formRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    if (canReview) contentRef.current?.focus({ preventScroll: true });
    else formRef.current?.focus({ preventScroll: true });
  }

  return (
    <section className={styles['feedback-section']} id="feedback" aria-labelledby="feedback-heading">
      <div className={styles['feedback-heading']}>
        <div className={styles['feedback-title-group']}>
          <span className={styles['feedback-heading-icon']}><ReviewIcon kind="message" /></span>
          <div><span className={styles['feedback-eyebrow']}>GÓC CHIA SẺ CỦA KHÁCH HÀNG</span><h2 id="feedback-heading">Trải nghiệm thật. Đánh giá thật.</h2><p>Mỗi góp ý của bạn giúp KID Social tốt hơn mỗi ngày.</p></div>
        </div>
        <button type="button" className={styles['feedback-write-button']} onClick={focusForm}><ReviewIcon kind="pen" /> Viết đánh giá</button>
      </div>

      <div className={styles['feedback-overview']}>
        <div className={styles['feedback-score']}>
          <span>Đánh giá từ cộng đồng</span>
          <div className={styles['feedback-score-value']}><strong>{summary?.total ? summary.average?.toFixed(1) : '—'}</strong><span>/ 5</span></div>
          <div className={styles['feedback-stars']} role="img" aria-label={summary?.total ? `${summary.average?.toFixed(1)} trên 5 sao` : 'Chưa có đánh giá'}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} filled={!!summary?.total && star <= Math.round(summary.average || 0)} />)}</div>
          <small>{loading && !data ? 'Đang tải đánh giá…' : loadError && !data ? 'Chưa tải được đánh giá' : `${summary?.total || 0} đánh giá từ khách đã đặt hàng`}</small>
        </div>
        <div className={styles['feedback-distribution']} aria-label="Phân bố đánh giá">
          {ratings.map((star) => <div className={styles['feedback-rating-row']} key={star}><span>{star} <Star /></span><div className={styles['feedback-rating-track']}><div style={{ width: `${summary?.total ? (summary.counts[star] / summary.total) * 100 : 0}%` }} /></div><small>{summary?.counts[star] || 0}</small></div>)}
        </div>
        <div className={styles['feedback-assurance']}><span><ReviewIcon kind="check" /></span><strong>Đã đặt hàng, được đánh giá</strong><p>Đặt đơn thành công là có thể chia sẻ nhận xét. Mỗi đơn hàng, một đánh giá.</p></div>
      </div>

      <div className={styles['feedback-layout']}>
        <div className={styles['feedback-feed']}>
          <div className={styles['feedback-feed-heading']}><h3>Khách hàng chia sẻ</h3><span>Mới nhất trước</span></div>
          <div className={styles['feedback-filters']} role="group" aria-label="Lọc theo số sao">
            {[0, ...ratings].map((star) => <button key={star} type="button" aria-pressed={filter === star} onClick={() => { setFilter(star); setPage(1); }}>
              {star ? <>{star} <Star /></> : 'Tất cả'}<span>{star ? summary?.counts[star] || 0 : summary?.total || 0}</span>
            </button>)}
          </div>
          {loadError ? <div className={styles['feedback-empty']} role="alert"><ReviewIcon kind="message" /><h4>Chưa kết nối được</h4><p>{loadError}</p><button type="button" onClick={() => setReload((value) => value + 1)}>Thử lại</button></div> :
            loading ? <div className={styles['feedback-loading']} role="status"><span />Đang tải những chia sẻ mới nhất…</div> :
              data?.reviews.length ? <div className={styles['feedback-grid']}>{data.reviews.map((review, index) => <article className={styles['feedback-card']} key={review.id}>
                <div className={styles['feedback-card-top']}><div className={`${styles['feedback-avatar']} ${styles[`tone-${index % 3}`]}`}>{review.username.slice(0, 2).toUpperCase()}</div><div><strong>{review.username}</strong><span className={styles['feedback-verified']}><ReviewIcon kind="check" /> Đã mua hàng</span></div><time dateTime={review.createdAt}>{date(review.createdAt)}</time></div>
                <div className={styles['feedback-stars']} role="img" aria-label={`${review.rating} trên 5 sao`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} filled={star <= review.rating} />)}</div>
                <p className={styles['feedback-content']}>{review.content}</p>
                <div className={styles['feedback-service']}><span className={styles['feedback-service-dot']} />{review.service}</div>
              </article>)}</div> : <div className={styles['feedback-empty']}><ReviewIcon kind="message" /><h4>{filter ? `Chưa có đánh giá ${filter} sao` : 'Câu chuyện đầu tiên có thể là của bạn'}</h4><p>{filter ? 'Thử chọn số sao khác để xem thêm nhận xét.' : 'Đặt đơn thành công và chia sẻ trải nghiệm của bạn với mọi người nhé.'}</p></div>}
          {!loading && !loadError && !!data && data.pagination.totalPages > 1 && <div className={styles['feedback-pagination']}><button type="button" disabled={data.pagination.page === 1} onClick={() => setPage(data.pagination.page - 1)}>← Trước</button><span>Trang {data.pagination.page} / {data.pagination.totalPages}</span><button type="button" disabled={data.pagination.page === data.pagination.totalPages} onClick={() => setPage(data.pagination.page + 1)}>Sau →</button></div>}
          {process.env.NODE_ENV === 'development' && (
            <details className={styles['feedback-preview']} open>
              <summary>Xem giao diện với 3 feedback mẫu</summary>
              <p className={styles['feedback-preview-note']}>Nội dung minh họa, không phải đánh giá của khách hàng thật. Chỉ hiển thị ở bản local và không tính vào điểm đánh giá.</p>
              <div className={styles['feedback-grid']}>
                {previewReviews.map((review, index) => (
                  <article className={styles['feedback-card']} key={review.name}>
                    <div className={styles['feedback-card-top']}>
                      <div className={`${styles['feedback-avatar']} ${index ? styles[`tone-${index}`] : ''}`}>0{index + 1}</div>
                      <div><strong>{review.name}</strong><span className={styles['feedback-sample-badge']}>Mẫu minh họa</span></div>
                    </div>
                    <div className={styles['feedback-stars']} role="img" aria-label={`Minh họa ${review.rating} trên 5 sao`}>
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} filled={star <= review.rating} />)}
                    </div>
                    <p className={styles['feedback-content']}>{review.content}</p>
                    <div className={styles['feedback-service']}><span className={styles['feedback-service-dot']} />{review.service}</div>
                  </article>
                ))}
              </div>
            </details>
          )}
        </div>

        <form className={styles['feedback-composer']} onSubmit={submit} ref={formRef} tabIndex={-1} aria-labelledby="feedback-form-heading">
          <div className={styles['feedback-composer-title']}><span><ReviewIcon kind="pen" /></span><div><h3 id="feedback-form-heading">Chia sẻ trải nghiệm</h3><p>Đánh giá của bạn rất có ý nghĩa.</p></div></div>
          {success && <p className={styles['feedback-success']} role="status">{success}</p>}
          {!canReview && <div className={styles['feedback-gate']}><ReviewIcon kind="lock" /><div><strong>{loading ? 'Đang kiểm tra đơn hàng…' : loadError ? 'Chưa kiểm tra được đơn hàng' : !eligibility?.signedIn ? 'Đăng nhập để đánh giá' : eligibility.orderCount ? 'Bạn đã đánh giá hết các đơn' : 'Mở ngay sau khi đặt đơn'}</strong><p>{loading ? 'Một chút thôi, mình đang kiểm tra điều kiện đánh giá.' : loadError ? 'Tải lại để kiểm tra đơn hàng đủ điều kiện của bạn.' : !eligibility?.signedIn ? 'Dùng tài khoản đã đặt hàng để chia sẻ trải nghiệm.' : eligibility.orderCount ? 'Cảm ơn bạn đã chia sẻ! Bạn có thể đánh giá tiếp ngay khi đặt đơn mới thành công.' : 'Sau khi tạo đơn thành công, bạn có thể chọn đơn và viết nhận xét ngay tại đây.'}</p>{!loading && !loadError && <Link href={eligibility?.signedIn ? '/orders' : '/login'}>{eligibility?.signedIn ? 'Xem đơn hàng của tôi' : 'Đăng nhập'} <span aria-hidden="true">↗</span></Link>}{!loading && <button type="button" className={styles['feedback-refresh']} onClick={() => setReload((value) => value + 1)}>Kiểm tra lại</button>}</div></div>}
          <fieldset disabled={!canReview || saving}>
            <label className={styles['feedback-input-label']} htmlFor="feedback-order">Đơn hàng của bạn</label>
            <select id="feedback-order" value={orderId} onChange={(event) => { setOrderId(event.target.value); setSubmitError(''); }} required>
              {!eligibility?.orders.length && <option value="">Chưa có đơn đủ điều kiện</option>}
              {eligibility?.orders.map((order) => <option key={order.id} value={order.id}>#{order.id.slice(-8)} · {order.service}</option>)}
            </select>
            {selectedOrder && <small className={styles['feedback-order-date']}>Đã đặt · {date(selectedOrder.createdAt)}</small>}
            <fieldset className={styles['feedback-rating-picker']} onMouseLeave={() => setHoverRating(0)}>
              <legend>Bạn cảm thấy thế nào?</legend>
              <div>{[1, 2, 3, 4, 5].map((star) => <label key={star} onMouseEnter={() => setHoverRating(star)}><input type="radio" name="feedback-rating" value={star} checked={rating === star} onChange={() => { setRating(star); setSubmitError(''); }} aria-label={`${star} sao — ${ratingLabels[star]}`} required /><Star filled={star <= (hoverRating || rating)} /></label>)}</div>
              <span>{ratingLabels[hoverRating || rating]}</span>
            </fieldset>
            <label className={styles['feedback-input-label']} htmlFor="feedback-content">Nhận xét của bạn</label>
            <textarea id="feedback-content" ref={contentRef} value={content} onChange={(event) => { setContent(event.target.value); setSubmitError(''); }} placeholder="Bạn thấy dịch vụ, tốc độ xử lý và hỗ trợ thế nào? Chia sẻ với mọi người nhé…" minLength={10} maxLength={1000} required rows={4} aria-describedby="feedback-content-hint" />
            <div className={styles['feedback-content-hint']} id="feedback-content-hint"><span>Tối thiểu 10 ký tự</span><span>{content.length}/1.000</span></div>
            <button type="submit" className={styles['feedback-submit']} disabled={!rating || content.trim().length < 10 || !selectedOrder}>{saving ? 'Đang gửi…' : 'Gửi đánh giá'}<span aria-hidden="true">↗</span></button>
          </fieldset>
          {submitError && <p className={styles['feedback-error']} role="alert">{submitError}</p>}
          <p className={styles['feedback-privacy']}><ReviewIcon kind="check" />Tên tài khoản và nhận xét sẽ hiển thị công khai.</p>
        </form>
      </div>
    </section>
  );
}
