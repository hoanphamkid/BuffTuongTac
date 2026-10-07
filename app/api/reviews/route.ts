import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createOrderReview, reviewInput, ReviewError } from '@/lib/reviews';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});
const pageSize = 6;

export async function GET(request: Request) {
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ error: 'Bộ lọc đánh giá không hợp lệ.' }, { status: 400, headers });
  try {
    const user = await currentUser();
    const { page, rating } = query.data;
    const data = await prisma.$transaction(async (tx) => {
      const groups = await tx.orderReview.groupBy({ by: ['rating'], _count: { _all: true } });
      const counts = Object.fromEntries([1, 2, 3, 4, 5].map((star) => [star, groups.find((group) => group.rating === star)?._count._all || 0]));
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      const filteredTotal = rating ? counts[rating] : total;
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const currentPage = Math.min(page, totalPages);
      const reviews = await tx.orderReview.findMany({
        where: rating ? { rating } : {},
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, rating: true, content: true, createdAt: true,
          order: { select: { user: { select: { username: true } }, service: { select: { name: true, platform: { select: { name: true, slug: true } } } } } },
        },
      });
      const orders = user ? await tx.order.findMany({
        where: { userId: user.id, review: { is: null } },
        select: { id: true, service: { select: { name: true } }, createdAt: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }) : [];
      const orderCount = user ? await tx.order.count({ where: { userId: user.id } }) : 0;
      return {
        reviews: reviews.map(({ order, ...review }) => ({ ...review, username: order.user.username, service: order.service.name, platform: order.service.platform })),
        summary: { total, counts, average: total ? groups.reduce((sum, group) => sum + group.rating * group._count._all, 0) / total : null },
        pagination: { page: currentPage, totalPages, total: filteredTotal },
        eligibility: { signedIn: !!user, orderCount, orders: orders.map(({ service, ...order }) => ({ ...order, service: service.name })) },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return NextResponse.json({ success: true, data }, { headers });
  } catch {
    return NextResponse.json({ error: 'Chưa tải được đánh giá. Vui lòng thử lại sau.' }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers });
  }
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập để viết đánh giá.' }, { status: 401, headers });
    const input = reviewInput.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ error: 'Chọn đơn hàng, chấm từ 1–5 sao và viết nhận xét từ 10–1.000 ký tự.' }, { status: 400, headers });
    const review = await createOrderReview(prisma, user.id, input.data);
    return NextResponse.json({ success: true, data: review }, { status: 201, headers });
  } catch (error) {
    if (error instanceof ReviewError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    return NextResponse.json({ error: 'Chưa gửi được đánh giá. Vui lòng thử lại.' }, { status: 503, headers });
  }
}
