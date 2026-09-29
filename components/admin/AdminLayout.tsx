'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';

const items=[['Tổng quan','/admin','⌂'],['Đơn hàng','/admin/orders','▣'],['Người dùng','/admin/users','♙'],['Nạp tiền','/admin/deposits','▤'],['Giao dịch','/admin/transactions','↔'],['Hoàn tiền','/admin/refunds','↶'],['Dịch vụ','/admin/services','◉'],['Thông báo','/admin/notifications','♧'],['Nhà cung cấp','/admin/provider','◫'],['Cài đặt','/admin/settings','⚙']];
export function AdminLayout({children,admin}:{children:React.ReactNode;admin:{username:string;email:string}}){
 const path=usePathname(),router=useRouter();const [menuOpen,setMenuOpen]=useState(false),[refreshing,setRefreshing]=useState(false);
 useEffect(()=>setMenuOpen(false),[path]);
 const link=(item:string[])=>{const [name,href,icon]=item;return <Link className={path===href?'active':''} href={href} key={href} onClick={()=>setMenuOpen(false)}><i>{icon}</i><span>{name}</span></Link>};
 const refreshPage=()=>{if(refreshing)return;setRefreshing(true);window.location.reload()};
 return <div className={'admin '+(menuOpen?'admin-menu-open':'')}><button className="admin-menu-toggle" aria-label={menuOpen?'Đóng menu':'Mở menu'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(x=>!x)}>{menuOpen?'×':'☰'}</button>{menuOpen&&<button className="admin-menu-backdrop" aria-label="Đóng menu" onClick={()=>setMenuOpen(false)}/>}<aside className="admin-side"><div className="admin-brand"><b>K</b><div><div>KID Social</div><small>ADMIN PANEL</small></div></div><nav className="admin-nav"><h5>HỆ THỐNG</h5>{items.slice(0,1).map(link)}<h5>QUẢN LÝ</h5>{items.slice(1,7).map(link)}<h5>HỆ THỐNG</h5>{items.slice(7).map(link)}</nav><div className="admin-profile"><b>AD　{admin.username}</b><span>{admin.email}</span></div><button className="admin-back" onClick={()=>router.push('/')}>⌂　Trang người dùng</button></aside><section className="admin-main"><header className="admin-header"><div><h1>{path==='/admin'?'Tổng quan':'Quản trị hệ thống'}</h1><p>Theo dõi hoạt động của KID Social</p></div><div className="admin-header-actions"><button type="button" className={'admin-refresh '+(refreshing?'is-refreshing':'')} onClick={refreshPage} disabled={refreshing} aria-label="Làm mới dữ liệu">↻ <span>{refreshing?'Đang tải...':'Làm mới'}</span></button><button className="bell" aria-label="Thông báo">♧</button></div></header>{children}</section></div>;
}
