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
        <a href="https://zalo.me/0945459491" target="_blank" rel="noreferrer">Zalo: 0945459491</a>
        <a href="https://www.tiktok.com/@Kidzdayy" target="_blank" rel="noreferrer">TikTok: @Kidzdayy</a>
        <a href="mailto:phamthanhhoan2401@gmail.com">Gmail: phamthanhhoan2401@gmail.com</a>
      </div>
      <p className="notice-style-thanks">Cảm ơn bạn đã sử dụng <strong>KID Social</strong> ❤️</p>
      <button className="welcome-confirm" onClick={close}>Đã hiểu</button>
    </div>
  </div>;
}
