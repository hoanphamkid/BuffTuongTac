import { prisma } from '@/lib/prisma';
import { createOrderStatusNotification } from '@/lib/notifications';
import { sendPushNotification } from '@/lib/push';

export async function refundOrder(orderId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === 'REFUNDED') return { idempotent: true, notification: null };

    const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: { in: ['PENDING', 'PROCESSING', 'FAILED'] } },
      data: { status: 'REFUNDED' },
    });
    if (updated.count !== 1) return { idempotent: true, notification: null };

    const notification = await createOrderStatusNotification(tx, {
      userId: order.userId,
      orderId: order.id,
      status: 'REFUNDED',
    });
    const after = Number(user.balance) + Number(order.price);
    await tx.user.update({ where: { id: user.id }, data: { balance: { increment: Number(order.price) } } });
    await tx.balanceTransaction.create({
      data: {
        userId: user.id,
        type: 'REFUND',
        amount: Number(order.price),
        balanceBefore: Number(user.balance),
        balanceAfter: after,
        referenceType: 'Order',
        referenceId: order.id,
        description: `Hoàn tiền đơn #${order.id}`,
      },
    });
    return { idempotent: false, notification };
  });

  if (result.notification) await sendPushNotification(result.notification);
  return { idempotent: result.idempotent };
}
