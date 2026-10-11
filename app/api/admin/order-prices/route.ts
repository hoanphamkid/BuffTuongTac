import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { createBalanceNotification } from '@/lib/notifications';
import { sendPushNotification } from '@/lib/push';

const ZERO = BigInt(0);
const MAX_PRICE = BigInt('9007199254740991');
const userSelect = { id: true, username: true, email: true, balance: true } as const;
const orderInclude = { user: { select: userSelect }, service: { include: { platform: true } }, server: true } as const;

function serializeOrder(order: any) {
  return {
    ...order,
    price: order.price.toString(),
    user: order.user ? { ...order.user, balance: order.user.balance.toString() } : order.user,
  };
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: orderInclude,
    take: 500,
  });

  return NextResponse.json({
    success: true,
    data: orders.map(serializeOrder),
  });
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const rawPrice = typeof body.price === 'string'
    ? body.price.trim()
    : typeof body.price === 'number' && Number.isSafeInteger(body.price)
      ? String(body.price)
      : '';

  if (!orderId || !/^\d+$/.test(rawPrice)) {
    return NextResponse.json({ success: false, error: 'Giá mới phải là số nguyên không âm' }, { status: 400 });
  }

  const nextPrice = BigInt(rawPrice);
  if (nextPrice > MAX_PRICE) {
    return NextResponse.json({ success: false, error: 'Giá mới vượt quá giới hạn cho phép' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('ORDER_NOT_FOUND');
      if (order.status === 'REFUNDED') throw new Error('ORDER_REFUNDED');

      const oldPrice = BigInt(order.price.toFixed(0));
      if (oldPrice === nextPrice) {
        const unchanged = await tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: orderInclude,
        });
        return { order: unchanged, notification: null, adjustment: ZERO };
      }

      const difference = nextPrice - oldPrice;
      const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
      const adjustmentAmount = new Prisma.Decimal((difference > ZERO ? difference : -difference).toString());
      if (difference > ZERO) {
        const debited = await tx.user.updateMany({
          where: { id: user.id, balance: { gte: adjustmentAmount } },
          data: { balance: { decrement: adjustmentAmount } },
        });
        if (debited.count !== 1) throw new Error('INSUFFICIENT_BALANCE');
      } else {
        await tx.user.update({ where: { id: user.id }, data: { balance: { increment: adjustmentAmount } } });
      }
      const balanceAfterRecord = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { balance: true } });
      const afterBalance = BigInt(balanceAfterRecord.balance.toFixed(0));
      const beforeBalance = afterBalance + difference;

      const changed = await tx.order.updateMany({
        where: { id: orderId, price: order.price },
        data: { price: new Prisma.Decimal(nextPrice.toString()) },
      });
      if (changed.count !== 1) throw new Error('PRICE_CHANGED');

      await tx.balanceTransaction.create({
        data: {
          userId: user.id,
          type: 'ORDER_PRICE_ADJUSTMENT',
          amount: new Prisma.Decimal((-difference).toString()),
          balanceBefore: new Prisma.Decimal(beforeBalance.toString()),
          balanceAfter: new Prisma.Decimal(afterBalance.toString()),
          referenceType: 'Order',
          referenceId: order.id,
          description: `Điều chỉnh giá đơn #${order.id}: ${oldPrice.toString()}đ → ${nextPrice.toString()}đ`,
        },
      });

      const notification = await createBalanceNotification(tx, {
        userId: user.id,
        amount: Number(-difference),
        balanceAfter: Number(afterBalance),
        reason: `Điều chỉnh giá đơn #${order.id.slice(-8)}`,
      });
      const updated = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: orderInclude,
      });
      return { order: updated, notification, adjustment: difference };
    });

    if (result.notification) await sendPushNotification(result.notification);
    return NextResponse.json({
      success: true,
      data: serializeOrder(result.order),
      adjustment: result.adjustment.toString(),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'ORDER_NOT_FOUND') return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    if (code === 'ORDER_REFUNDED') return NextResponse.json({ success: false, error: 'Không thể chỉnh giá đơn đã hoàn tiền' }, { status: 409 });
    if (code === 'INSUFFICIENT_BALANCE') return NextResponse.json({ success: false, error: 'Số dư khách hàng không đủ để tăng giá đơn' }, { status: 409 });
    if (code === 'PRICE_CHANGED') return NextResponse.json({ success: false, error: 'Đơn hàng vừa được cập nhật, vui lòng tải lại trang' }, { status: 409 });
    console.error('[admin/order-prices] update failed', error);
    return NextResponse.json({ success: false, error: 'Không thể cập nhật giá đơn hàng' }, { status: 500 });
  }
}
