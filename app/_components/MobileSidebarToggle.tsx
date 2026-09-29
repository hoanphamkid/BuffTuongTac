'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
export function MobileSidebarToggle(){
  const [open,setOpen]=useState(false);
  const path=usePathname();
  const visible=path!=='/login'&&path!=='/register'&&!path.startsWith('/admin');
  useEffect(()=>setOpen(false),[path]);
  useEffect(()=>{
    document.body.classList.toggle('mobile-sidebar-open',open&&visible);
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('keydown',close);
    return()=>{document.body.classList.remove('mobile-sidebar-open');document.removeEventListener('keydown',close)};
  },[open,visible]);
  if(!visible)return null;
  return <>{open&&<button className="mobile-sidebar-backdrop" aria-label="Đóng menu" onClick={()=>setOpen(false)}/>}<button className="mobile-sidebar-toggle" aria-label={open?'Đóng menu':'Mở menu'} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'×':'☰'}</button></>;
}
