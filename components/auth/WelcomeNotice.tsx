'use client';
import {useEffect,useState} from 'react';

export function WelcomeNotice({onClose,force=false}:{onClose?:()=>void;force?:boolean}){
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(force||sessionStorage.getItem('welcome-notice-seen')!=='true')setOpen(true);
  },[force]);
  if(!open)return null;
  const close=()=>{sessionStorage.setItem('welcome-notice-seen','true');setOpen(false);onClose?.()};
  return <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
    <div className="welcome-modal notice-style-modal">
      <div className="notice-style-title">⚡ <span id="welcome-title">Thông Báo</span> ⚡</div>
      <p className="notice-style-lead"><strong>👋 Xin chào, mình là Hoàn Phạm!</strong></p>
      <p className="notice-style-text">Cảm ơn bạn đã tin tưởng và sử dụng <strong>KID Social</strong> ❤️</p>
      <p className="notice-style-text">⏱️ Các đơn hàng sẽ được <strong>xử lý và hoàn thành trong vòng 24 giờ</strong> kể từ khi đặt đơn.</p>
      <p className="notice-style-text">💬 Trong quá trình sử dụng, nếu đơn hàng gặp vấn đề hoặc bạn cần hỗ trợ, hãy <strong>liên hệ trực tiếp với mình – Hoàn Phạm</strong>. Mình sẽ kiểm tra và hỗ trợ bạn sớm nhất có thể.</p>
      <p className="notice-style-thanks"><strong>Chúc bạn có trải nghiệm tốt tại KID Social!</strong></p>
      <div className="notice-links">
        <a className="contact-icon zalo-icon" href="https://zalo.me/0945459491" target="_blank" rel="noreferrer" aria-label="Liên hệ Zalo" title="Zalo">Z</a>
        <a className="contact-icon tiktok-icon" href="https://www.tiktok.com/@kidzdayy" target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok">♪</a>
        <a className="contact-icon gmail-icon" href="mailto:phamthanhhoan2401@gmail.com" aria-label="Gửi email" title="Gmail">✉</a>
      </div>
      <button className="welcome-confirm" onClick={close}>Đã hiểu</button>
    </div>
  </div>;
}
