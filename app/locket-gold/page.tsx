import Link from 'next/link';
import './locket-gold.css';

export default function LocketGoldPage() {
  return (
    <div className="locket-gold-page">
      <section className="locket-gold-hero">
        <div className="locket-gold-orb" aria-hidden="true">L</div>
        <p className="locket-gold-eyebrow">GÓI ĐẶC BIỆT · LOCKET</p>
        <h1>Locket Gold <span>Vĩnh viễn</span></h1>
        <p className="locket-gold-description">
          Sở hữu gói Locket Gold với một lần thanh toán, không phải gia hạn định kỳ.
        </p>

        <div className="locket-gold-price">
          <span>Giá trọn gói</span>
          <strong>30.000đ</strong>
          <small>Thanh toán một lần · Thời hạn vĩnh viễn</small>
        </div>

        <Link className="locket-gold-cta" href="/support">
          Liên hệ để đặt gói <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="locket-gold-note">
        <span className="locket-gold-note-icon" aria-hidden="true">i</span>
        <div>
          <strong>Cần hỗ trợ đăng ký?</strong>
          <p>Liên hệ admin để được hướng dẫn và xác nhận thông tin trước khi kích hoạt.</p>
        </div>
        <Link href="/support">Trung tâm hỗ trợ</Link>
      </section>
    </div>
  );
}
