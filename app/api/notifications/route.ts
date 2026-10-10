import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return NextResponse.json(
    { success: true, data: items, unreadCount },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.all === true) {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (typeof body.id === 'string' && body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } else {
    return NextResponse.json({ success: false, error: 'Thiếu mã thông báo' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
