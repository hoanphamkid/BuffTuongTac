import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export const reviewInput = z.object({
  orderId: z.string().trim().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(10, 'Nhận xét cần ít nhất 10 ký tự.').max(1000, 'Nhận xét tối đa 1.000 ký tự.'),
}).strict();

export class ReviewError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function createOrderReview(db: PrismaClient, userId: string, input: z.infer<typeof reviewInput>) {
  try {
    return await db.$transaction(async (tx) => {
      // A successfully created order qualifies immediately, regardless of status.
      // Lock the owned order to serialize concurrent review submissions.
      const orders = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Order"
        WHERE "id" = ${input.orderId} AND "userId" = ${userId}
        FOR UPDATE
      `;
      const order = orders[0];
      if (!order) throw new ReviewError(404, 'Không tìm thấy đơn hàng trong tài khoản của bạn.');
      return tx.orderReview.create({ data: { orderId: order.id, rating: input.rating, content: input.content }, select: { id: true } });
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new ReviewError(409, 'Bạn đã đánh giá đơn hàng này rồi. Mỗi đơn chỉ được đánh giá một lần.');
    }
    throw error;
  }
}
