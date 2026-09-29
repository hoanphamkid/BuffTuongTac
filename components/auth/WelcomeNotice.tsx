'use client';

export function WelcomeNotice({onClose}:{onClose:()=>void}){
  return <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
    <div className="welcome-modal">
      <button className="welcome-close" aria-label="Đóng" onClick={onClose}>×</button>
      <div className="welcome-sparkles">✦　☾　✦</div>
      <div className="welcome-kicker">KID SOCIAL</div>
      <h2 id="welcome-title">📢 THÔNG BÁO</h2>
      <p>Các đơn hàng sẽ được <strong>xử lý và hoàn thành trong vòng 24 giờ</strong> kể từ khi tạo đơn.</p>
      <p>Nếu đơn hàng gặp vấn đề hoặc quá thời gian xử lý, vui lòng <strong>liên hệ với Admin</strong> để được hỗ trợ.</p>
      <p>Cảm ơn bạn đã sử dụng <strong>KID Social</strong> ❤️</p>
      <button className="welcome-confirm" onClick={onClose}>Đã hiểu</button>
    </div>
  </div>;
}
