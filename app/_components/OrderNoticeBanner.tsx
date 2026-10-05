'use client';

import './order-notice-banner.css';

const notice = (
  <>
    Đơn hàng sẽ được hoàn thành trong vòng <strong className="order-notice-time">24h</strong>.
    {' '}Trong quá trình sử dụng, nếu đơn hàng gặp vấn đề hoặc bạn cần hỗ trợ, hãy{' '}
    <strong className="order-notice-contact">liên hệ trực tiếp với mình</strong>.
    {' '}<strong className="order-notice-welcome">Chúc bạn có trải nghiệm tốt tại KID Social!</strong>
  </>
);

export function OrderNoticeBanner() {
  return (
    <section className="order-notice-banner" aria-label="Thông báo dịch vụ">
      <span className="order-notice-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h4l10-5v14L8 14H4zM8 14l2 6H6l-2-6M21 9v6" />
        </svg>
      </span>
      <a
        className="order-notice-viewport"
        href="https://zalo.me/0945459491"
        target="_blank"
        rel="noopener noreferrer"
        title="Liên hệ KID Social trên Zalo (mở tab mới)"
      >
        <span className="order-notice-track">
          <span className="order-notice-copy">{notice}<span className="order-notice-divider" aria-hidden="true">✦</span></span>
          <span className="order-notice-copy" aria-hidden="true">{notice}<span className="order-notice-divider">✦</span></span>
        </span>
      </a>
    </section>
  );
}
