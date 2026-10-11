import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { createOrderStatusNotification } from '@/lib/notifications';
import { sendPushNotification } from '@/lib/push';
import { refundOrder } from '@/lib/orders/refund-order';
import { resolveRefundReason } from '@/lib/orders/refund-reasons';

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const [deposits, transactions, orders] = await Promise.all([
    prisma.deposit.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true }, take: 500 }),
    prisma.balanceTransaction.findMany({ where: { type: { not: 'DEPOSIT' } }, orderBy: { createdAt: 'desc' }, include: { user: true }, take: 500 }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true, service: { include: { platform: true } }, server: true }, take: 500 }),
  ]);

  return NextResponse.json({ success: true, data: { deposits, transactions, orders } });
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  if (!id) return NextResponse.json({ success: false, error: 'Thiếu mã đơn hàng' }, { status: 400 });

  if (body.action === 'refund') {
    const reason = resolveRefundReason(body.reasonCode, body.reasonDetail);
    if (!reason) {
      return NextResponse.json({ success: false, error: 'Vui lòng chọn lý do hoàn tiền hợp lệ' }, { status: 400 });
    }

    try {
      await refundOrder(id, reason);
      const order = await prisma.order.findUnique({
        where: { id },
        include: { user: true, service: { include: { platform: true } }, server: true },
      });
      if (!order) return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
      return NextResponse.json({ success: true, data: order });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'ORDER_NOT_FOUND') return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
      if (code === 'ORDER_FREE') return NextResponse.json({ success: false, error: 'Đơn miễn phí không cần hoàn tiền' }, { status: 409 });
      if (code === 'REFUND_EXISTS') return NextResponse.json({ success: false, error: 'Đơn này đã có giao dịch hoàn tiền, không thể hoàn lần nữa' }, { status: 409 });
      if (code === 'ORDER_CHANGED') return NextResponse.json({ success: false, error: 'Đơn hàng vừa thay đổi, vui lòng tải lại' }, { status: 409 });
      console.error('[admin/transactions] refund failed', error);
      return NextResponse.json({ success: false, error: 'Không thể hoàn tiền đơn hàng' }, { status: 500 });
    }
  }

  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 120) : '';
  const validStatuses = ['PENDING', 'PROCESSING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'CANCELED', 'FAILED'];
  const status = typeof body.status === 'string' && validStatuses.includes(body.status) ? body.status : null;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id },
      data: { label: label || null, ...(status ? { status: status as 'PENDING' | 'PROCESSING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'CANCELED' | 'FAILED' } : {}) },
      include: { user: true, service: { include: { platform: true } }, server: true },
    });
    const notification = status && status !== order.status
      ? await createOrderStatusNotification(tx, { userId: order.userId, orderId: order.id, status, serviceName: next.service.name })
      : null;
    return { next, notification };
  });

  if (result.notification) await sendPushNotification(result.notification);
  return NextResponse.json({ success: true, data: result.next });
}
