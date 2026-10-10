'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import '../auth.css';

export default function Login(){
  const [f,setF]=useState({identifier:'',password:''});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const router=useRouter();
  const {refreshUser}=useCurrentUser();
  function nextPath(){
    const next=new URLSearchParams(window.location.search).get('next');
    return next&&next.startsWith('/')&&!next.startsWith('//')?next:'/';
  }
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(loading)return;
    setLoading(true);setError('');
    try{
      const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(f)});
      const d=await r.json().catch(()=>null);
      if(!r.ok||!d?.success){setError(d?.error||'Đăng nhập thất bại');return}
      try{sessionStorage.removeItem('welcome-notice-seen:'+d.data.id)}catch{}
      await refreshUser();
      router.replace(d.data?.role==='ADMIN'?'/admin':nextPath());
      router.refresh();
    }catch{setError('Không thể kết nối máy chủ. Vui lòng thử lại.')}finally{setLoading(false)}
  }
  return <main className="auth auth-login"><form onSubmit={submit}><div className="auth-logo">KID <span>Social</span></div><h1>Đăng nhập</h1><p>Đăng nhập để quản lý đơn hàng và số dư</p><label>Tên đăng nhập hoặc email<input required value={f.identifier} onChange={e=>setF({...f,identifier:e.target.value})}/></label><label>Mật khẩu<input required type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></label>{error&&<div className="auth-error">{error}</div>}<button disabled={loading}>{loading?'Đang đăng nhập...':'Đăng nhập'}</button><small>Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link></small></form></main>
}
