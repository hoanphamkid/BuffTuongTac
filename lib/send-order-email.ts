import {Resend} from 'resend';

type OrderEmailData={orderId:string;username?:string;service:string;server?:string;link:string;quantity:number;total:number};

const escapeHtml=(value:string)=>value.replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]||char));

export async function sendOrderEmail(order:OrderEmailData){
  const apiKey=process.env.RESEND_API_KEY?.trim();
  const adminEmail=process.env.ADMIN_EMAIL?.trim();
  if(!apiKey||!adminEmail){console.error('[order-email] RESEND_API_KEY hoặc ADMIN_EMAIL chưa được cấu hình');return false;}
  const resend=new Resend(apiKey);
  const {error}=await resend.emails.send({
    from:'KID Social <onboarding@resend.dev>',to:adminEmail,
    subject:`🔔 Có đơn hàng mới #${order.orderId}`,
    html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>🔔 Có đơn hàng mới</h2><table style="width:100%;border-collapse:collapse"><tr><td><b>Mã đơn</b></td><td>${escapeHtml(order.orderId)}</td></tr><tr><td><b>Khách hàng</b></td><td>${escapeHtml(order.username||'Không xác định')}</td></tr><tr><td><b>Dịch vụ</b></td><td>${escapeHtml(order.service)}</td></tr><tr><td><b>Server</b></td><td>${escapeHtml(order.server||'-')}</td></tr><tr><td><b>Link</b></td><td>${escapeHtml(order.link)}</td></tr><tr><td><b>Số lượng</b></td><td>${order.quantity.toLocaleString('vi-VN')}</td></tr><tr><td><b>Tổng tiền</b></td><td>${order.total.toLocaleString('vi-VN')}đ</td></tr></table></div>`
  });
  if(error)throw new Error(error.message);
  return true;
}
