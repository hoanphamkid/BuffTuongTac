import { prisma } from '@/lib/prisma';
import { createOrderStatusNotification } from '@/lib/notifications';
import { sendPushNotification } from '@/lib/push';

export async function refundOrder(orderId: string, reason: string) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === 'REFUNDED') return { idempotent: true, notification: null };
    if (order.price.lte(0)) throw new Error('ORDER_FREE');

    const updated = await tx.order.updateMany({
      where: { id: orderId, status: { not: 'REFUNDED' } },
      data: { status: 'REFUNDED', label: 'Đã hoàn tiền' },
    });
    if (updated.count !== 1) {
      const latest = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (latest?.status === 'REFUNDED') return { idempotent: true, notification: null };
      throw new Error('ORDER_CHANGED');
    }

    const priorRefund = await tx.balanceTransaction.findFirst({
      where: { userId: order.userId, type: 'REFUND', referenceType: 'Order', referenceId: order.id },
      select: { id: true },
    });
    if (priorRefund) throw new Error('REFUND_EXISTS');

    const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
    const after = user.balance.add(order.price);
    await tx.user.update({ where: { id: user.id }, data: { balance: { increment: order.price } } });
    await tx.balanceTransaction.create({
      data: {
        userId: user.id,
        type: 'REFUND',
        amount: order.price,
        balanceBefore: user.balance,
        balanceAfter: after,
        referenceType: 'Order',
        referenceId: order.id,
        description: `Hoàn tiền đơn #${order.id} · ${reason}`,
      },
    });

    const notification = await createOrderStatusNotification(tx, {
      userId: order.userId,
      orderId: order.id,
      status: 'REFUNDED',
      reason,
    });
    return { idempotent: false, notification };
  });

  if (result.notification) {
    try {
      await sendPushNotification(result.notification);
    } catch (error) {
      console.error('[order-refund] push notification failed', error);
    }
  }
  return { idempotent: result.idempotent };
}
