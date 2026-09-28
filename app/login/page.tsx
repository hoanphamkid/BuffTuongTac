'use client';import {useState} from 'react';import {useRouter} from 'next/navigation';import Link from 'next/link';import '../auth.css';
export default function Login(){const [f,setF]=useState({identifier:'',password:''});const [error,setError]=useState('');const [loading,setLoading]=useState(false);const router=useRouter();async function submit(e:React.FormEvent){
e.preventDefault();if(loading)return;setLoading(true);setError('');
const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
try{
 const res=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(f),signal:controller.signal});
 const d=await res.json().catch(()=>null);
 if(!d){setError('Máy chủ trả về phản hồi không hợp lệ (HTTP '+res.status+'). Vui lòng thử lại.');return}
 if(!res.ok||!d.success){setError(d.error||'Đăng nhập thất bại');return}
 router.replace('/');router.refresh();
}catch(e){setError(e instanceof Error&&e.name==='AbortError'?'Máy chủ phản hồi quá lâu. Vui lòng thử lại.':'Không thể kết nối máy chủ. Kiểm tra kết nối mạng và thử lại.')}
finally{clearTimeout(timeout);setLoading(false)}
}return <main className="auth"><form onSubmit={submit}><div className="auth-logo">KID <span>Social</span></div><h1>Đăng nhập</h1><p>Đăng nhập để quản lý đơn hàng và số dư</p><label>Tên đăng nhập hoặc email<input required value={f.identifier} onChange={e=>setF({...f,identifier:e.target.value})}/></label><label>Mật khẩu<input required type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></label>{error&&<div className="auth-error">{error}</div>}<button disabled={loading}>{loading?'Đang đăng nhập...':'Đăng nhập'}</button><small>Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link></small></form></main>}
