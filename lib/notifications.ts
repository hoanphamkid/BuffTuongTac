import type { Prisma } from '@prisma/client';

type NewOrder={id:string;username:string;service:string;quantity:number;price:number;link:string};
export async function notifyAdminNewOrder(order:NewOrder){console.log('[email] order notification invoked',order.id);const key=process.env.RESEND_API_KEY?.trim(),to=process.env.ADMIN_NOTIFICATION_EMAIL?.trim();if(!key||!to){console.error('[email] missing RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL');return false}try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from:'KID Social <onboarding@resend.dev>',to:[to],subject:`Đơn hàng mới #${order.id.slice(0,8)}`,html:`<h2>Có đơn hàng mới</h2><p><b>User:</b> ${order.username}</p><p><b>Dịch vụ:</b> ${order.service}</p><p><b>Số lượng:</b> ${order.quantity.toLocaleString('vi-VN')}</p><p><b>Tổng tiền:</b> ${order.price.toLocaleString('vi-VN')}đ</p><p><b>Link:</b> ${order.link}</p>`})});const body=await response.text();if(!response.ok){console.error('[email] Resend error',response.status,body);return false}console.log('[email] sent',to);return true}catch(error){console.error('[email] request failed',error);return false}}
export async function createOrderStatusNotification(
  tx: Prisma.TransactionClient,
  input: { userId: string; orderId: string; status: string; serviceName?: string | null },
) {
  if (input.status !== 'COMPLETED' && input.status !== 'REFUNDED') return null;

  const completed = input.status === 'COMPLETED';
  const orderCode = `#${input.orderId.slice(-8)}`;
  return tx.notification.create({
    data: {
      userId: input.userId,
      orderId: input.orderId,
      type: completed ? 'ORDER_COMPLETED' : 'ORDER_REFUNDED',
      title: completed ? 'Đơn hàng đã hoàn thành' : 'Đơn hàng đã được hoàn tiền',
      message: completed
        ? `Đơn ${orderCode}${input.serviceName ? ` · ${input.serviceName}` : ''} đã hoàn thành.`
        : `Đơn ${orderCode}${input.serviceName ? ` · ${input.serviceName}` : ''} đã được hoàn tiền vào số dư.`,
    },
  });
}

export async function createBalanceNotification(
  tx: Prisma.TransactionClient,
  input: { userId: string; amount: number; balanceAfter: number; reason?: string | null },
) {
  const credited = input.amount > 0;
  const amountText = Math.abs(input.amount).toLocaleString('vi-VN') + 'đ';
  const balanceText = input.balanceAfter.toLocaleString('vi-VN') + 'đ';
  const reason = input.reason?.trim();
  return tx.notification.create({
    data: {
      userId: input.userId,
      type: credited ? 'BALANCE_CREDIT' : 'BALANCE_DEBIT',
      title: credited ? 'Số dư đã được cộng' : 'Số dư đã được trừ',
      message: credited
        ? `${amountText} đã được cộng vào tài khoản${reason ? ` · ${reason}` : ''}. Số dư mới: ${balanceText}.`
        : `${amountText} đã được trừ khỏi tài khoản${reason ? ` · ${reason}` : ''}. Số dư mới: ${balanceText}.`,
    },
  });
}
