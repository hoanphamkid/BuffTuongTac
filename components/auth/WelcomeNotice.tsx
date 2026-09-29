'use client';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';

export function WelcomeNotice({onClose,force=false}:{onClose?:()=>void;force?:boolean}){
  const path=usePathname();
  const [open,setOpen]=useState(true);
  useEffect(()=>setOpen(true),[path]);
  if(!open||(!force&&(path==='/login'||path==='/register'||path.startsWith('/admin'))))return null;
  const close=()=>{setOpen(false);onClose?.()};
  return <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
    <div className="welcome-modal notice-style-modal">
      <div className="notice-style-title">⚡ <span id="welcome-title">Thông Báo</span> ⚡</div>
      <p className="notice-style-lead">KID Social hỗ trợ tăng tương tác mạng xã hội</p>
      <p className="notice-style-text">Nếu cần hỗ trợ hoặc gặp vấn đề với đơn hàng, vui lòng liên hệ qua các kênh bên dưới.</p>
      <div className="notice-links">
        <a className="contact-icon zalo-icon" href="https://zalo.me/0945459491" target="_blank" rel="noreferrer" aria-label="Liên hệ Zalo" title="Zalo">Z</a>
        <a className="contact-icon tiktok-icon" href="https://www.tiktok.com/@Kidzdayy" target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok">♪</a>
        <a className="contact-icon gmail-icon" href="mailto:phamthanhhoan2401@gmail.com" aria-label="Gửi email" title="Gmail">✉</a>
      </div>
      <p className="notice-style-thanks">Cảm ơn bạn đã sử dụng <strong>KID Social</strong> ❤️</p>
      <button className="welcome-confirm" onClick={close}>Đã hiểu</button>
    </div>
  </div>;
}
