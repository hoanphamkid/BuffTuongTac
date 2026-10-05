'use client';

import './user-detail.css';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {statusLabel} from '@/lib/status-label';

type Order={
  id:string;
  link:string;
  quantity:number;
  price:number|string;
  status:string;
  label?:string|null;
  reaction?:string|null;
  providerOrderId?:string|null;
  createdAt:string;
  service?:{name:string;platform?:{name:string;icon?:string|null}}|null;
  server?:{name:string}|null;
};

type UserDetail={
  id:string;
  username:string;
  email?:string|null;
  fullName?:string|null;
  balance:number|string;
  totalDeposited:number|string;
  role:string;
  createdAt:string;
  lastSeenAt?:string|null;
  passwordConfigured:boolean;
  _count:{orders:number;deposits:number;transactions:number};
  orders:Order[];
};

const money=(value:number|string|null|undefined)=>new Intl.NumberFormat('vi-VN').format(Number(value)||0)+'đ';
const dateTime=(value:string|null|undefined)=>value?new Date(value).toLocaleString('vi-VN'):'Chưa có';
const accountOf=(user:UserDetail)=>user.username?.trim()||user.email?.trim()||'—';

export default function UserDetailPage({params}:{params:Promise<{id:string}>}){
  const [user,setUser]=useState<UserDetail|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    params.then(({id})=>{
      fetch('/api/admin/users/'+id,{cache:'no-store'})
        .then(async response=>{
          const result=await response.json().catch(()=>({}));
          if(!response.ok)throw new Error(result.error||'Không tải được thông tin người dùng.');
          return result;
        })
        .then(result=>setUser(result.data||null))
        .catch(reason=>setError(reason instanceof Error?reason.message:'Không tải được thông tin người dùng.'))
        .finally(()=>setLoading(false));
    });
  },[params]);

  if(loading)return <div className="admin-body user-detail-page"><p>Đang tải thông tin người dùng...</p></div>;
  if(error||!user)return <div className="admin-body user-detail-page"><Link className="user-detail-back" href="/admin/users">← Quay lại người dùng</Link><div className="user-detail-error">{error||'Không tìm thấy tài khoản.'}</div></div>;

  const account=accountOf(user);
  return <div className="admin-body user-detail-page">
    <div className="user-detail-topbar">
      <div><p className="user-detail-crumb">Người dùng　›　Chi tiết tài khoản</p><h2 className="admin-only-title">Chi tiết người dùng</h2><p className="admin-only-sub">Toàn bộ thông tin và lịch sử đơn hàng của tài khoản</p></div>
      <Link className="user-detail-back" href="/admin/users">← Quay lại</Link>
    </div>

    <section className="user-profile-card admin-card">
      <div className="user-profile-avatar">{account.slice(0,2).toUpperCase()}</div>
      <div className="user-profile-main"><h1>{account} <span className="pill blue">{user.role}</span></h1><p>{user.email||'Chưa đăng ký email'}</p><small>ID: {user.id} · Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</small></div>
      <Link className="user-balance-link" href={'/admin/balance/'+user.id}>＋ Cộng/Trừ số dư</Link>
    </section>

    <div className="user-detail-stats">
      <Stat title="Số dư hiện tại" value={money(user.balance)} tone="green" />
      <Stat title="Tổng đã nạp" value={money(user.totalDeposited)} tone="blue" />
      <Stat title="Tổng đơn hàng" value={String(user._count?.orders||0)} tone="purple" />
      <Stat title="Giao dịch số dư" value={String(user._count?.transactions||0)} tone="orange" />
    </div>

    <section className="user-detail-grid">
      <div className="admin-card user-account-card">
        <h2>Thông tin tài khoản</h2>
        <Info label="Tài khoản" value={account} />
        <Info label="Họ tên" value={user.fullName||account} />
        <Info label="Email" value={user.email||'Chưa đăng ký email'} />
        <Info label="Vai trò" value={user.role} />
        <Info label="Hoạt động lần cuối" value={dateTime(user.lastSeenAt)} />
        <div className="password-safe-row"><span>Mật khẩu</span><b>••••••••</b><small>Mật khẩu được mã hóa, admin không thể xem mật khẩu gốc.</small></div>
      </div>
      <div className="admin-card user-security-card">
        <h2>Bảo mật tài khoản</h2>
        <div className="security-state"><i className={user.passwordConfigured?'active':''}/><div><b>{user.passwordConfigured?'Đã thiết lập mật khẩu':'Chưa có mật khẩu'}</b><small>Thông tin mật khẩu không được lưu dạng rõ.</small></div></div>
        <p>Để bảo vệ tài khoản, hệ thống chỉ lưu mật khẩu đã mã hóa một chiều nên không thể khôi phục để xem lại.</p>
      </div>
    </section>

    <section className="admin-card user-orders-card">
      <div className="user-orders-heading"><div><h2>Tất cả đơn hàng của {account}</h2><p>{user.orders.length} đơn hàng được tìm thấy</p></div><Link href="/admin/transactions">Quản lý đơn hàng</Link></div>
      <div className="user-orders-table-wrap"><table className="admin-table user-orders-table"><thead><tr><th>MÃ ĐƠN</th><th>THỜI GIAN</th><th>DỊCH VỤ</th><th>LIÊN KẾT</th><th>SỐ LƯỢNG</th><th>THÀNH TIỀN</th><th>TRẠNG THÁI</th></tr></thead><tbody>{user.orders.map(order=><tr key={order.id}><td><b>#{order.id.slice(-8)}</b></td><td>{dateTime(order.createdAt)}</td><td><b>{order.service?.name||'Dịch vụ'}</b><small className="order-platform">{order.service?.platform?.name||'—'}{order.server?.name?` · ${order.server.name}`:''}</small></td><td className="user-order-link"><a href={order.link} target="_blank" rel="noreferrer">{order.link}</a></td><td>{Number(order.quantity).toLocaleString('vi-VN')}</td><td><strong>{money(order.price)}</strong></td><td><span className={'pill '+statusTone(order.status)}>{statusLabel(order.status)}</span></td></tr>)}</tbody></table>{!user.orders.length&&<p className="user-orders-empty">Tài khoản này chưa có đơn hàng.</p>}</div>
    </section>
  </div>;
}

function Stat({title,value,tone}:{title:string;value:string;tone:string}){return <div className={'admin-card user-detail-stat '+tone}><small>{title}</small><strong>{value}</strong><span>● Dữ liệu tài khoản</span></div>}
function Info({label,value}:{label:string;value:string}){return <p className="user-info-row"><span>{label}</span><b>{value}</b></p>}
function statusTone(status:string){if(['COMPLETED'].includes(status))return 'green';if(['FAILED','CANCELED','REFUNDED'].includes(status))return 'red';if(['PROCESSING','IN_PROGRESS'].includes(status))return 'orange';return 'blue';}
