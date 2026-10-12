import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

const VIETNAM_OFFSET = 7 * 60 * 60 * 1000;
const PROCESSING_STATUSES: Array<'PENDING' | 'PROCESSING' | 'IN_PROGRESS'> = [
  'PENDING',
  'PROCESSING',
  'IN_PROGRESS',
];

function vietnamDayStart(value = new Date()) {
  const vietnamNow = new Date(value.getTime() + VIETNAM_OFFSET);
  return new Date(
    Date.UTC(
      vietnamNow.getUTCFullYear(),
      vietnamNow.getUTCMonth(),
      vietnamNow.getUTCDate(),
    ) - VIETNAM_OFFSET,
  );
}

function vietnamDateKey(value: Date) {
  return new Date(value.getTime() + VIETNAM_OFFSET).toISOString().slice(0, 10);
}

function formatTrendLabel(key: string) {
  const [, month, day] = key.split('-');
  return `${day}/${month}`;
}

async function getPeriodStats(start?: Date) {
  const userWhere = start ? { createdAt: { gte: start } } : undefined;
  const orderWhere = start ? { createdAt: { gte: start } } : undefined;
  const depositWhere = start
    ? { status: 'PAID' as const, paidAt: { gte: start } }
    : { status: 'PAID' as const };
  const processingWhere = {
    ...(start ? { createdAt: { gte: start } } : {}),
    status: { in: PROCESSING_STATUSES },
  };

  const [users, orders, deposits, processing] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.order.count({ where: orderWhere }),
    prisma.deposit.aggregate({
      where: depositWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.order.count({ where: processingWhere }),
  ]);

  return {
    users,
    orders,
    deposits: deposits._count._all,
    revenue: Number(deposits._sum.amount || 0),
    processing,
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền quản trị' },
      { status: 403 },
    );
  }

  const now = new Date();
  const today = vietnamDayStart(now);
  const vietnamNow = new Date(now.getTime() + VIETNAM_OFFSET);
  const dayOfWeek = vietnamNow.getUTCDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const week = new Date(today);
  week.setUTCDate(week.getUTCDate() - mondayOffset);
  const month = new Date(
    Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), 1) -
      VIETNAM_OFFSET,
  );
  const trendStart = new Date(today);
  trendStart.setUTCDate(trendStart.getUTCDate() - 29);

  const [total, currentWeek, currentMonth, statusRows, trendOrders, trendDeposits, recent] =
    await Promise.all([
      getPeriodStats(),
      getPeriodStats(week),
      getPeriodStats(month),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      prisma.deposit.findMany({
        where: { status: 'PAID', paidAt: { gte: trendStart } },
        select: { amount: true, paidAt: true },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: true, service: true },
      }),
    ]);

  const statusCounts = Object.fromEntries(
    statusRows.map((row) => [row.status, row._count._all]),
  );

  const trendMap = new Map<string, { orders: number; revenue: number }>();
  for (let index = 0; index < 30; index += 1) {
    const date = new Date(trendStart);
    date.setUTCDate(date.getUTCDate() + index);
    trendMap.set(vietnamDateKey(date), { orders: 0, revenue: 0 });
  }

  trendOrders.forEach((order) => {
    const item = trendMap.get(vietnamDateKey(order.createdAt));
    if (item) item.orders += 1;
  });
  trendDeposits.forEach((deposit) => {
    if (!deposit.paidAt) return;
    const item = trendMap.get(vietnamDateKey(deposit.paidAt));
    if (item) item.revenue += Number(deposit.amount);
  });

  const trend = Array.from(trendMap, ([date, values]) => ({
    date,
    label: formatTrendLabel(date),
    ...values,
  }));

  return NextResponse.json({
    success: true,
    data: {
      periods: { total, week: currentWeek, month: currentMonth },
      statusCounts,
      trend,
      recent: recent.map((order) => ({
        id: order.id,
        user: order.user.username,
        service: order.service.name,
        quantity: order.quantity,
        total: Number(order.price),
        status: order.status,
        createdAt: order.createdAt,
      })),
      generatedAt: now.toISOString(),
    },
  });
}
