import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để xem đơn hàng.' }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true, link: true, quantity: true, price: true, status: true, label: true,
      reaction: true, createdAt: true, updatedAt: true,
      service: { select: { name: true, platform: { select: { name: true } } } },
      server: { select: { name: true } },
    },
  });
  if (!order) return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng trong tài khoản của bạn.' }, { status: 404 });
  return NextResponse.json({ success: true, data: { ...order, price: Number(order.price) } }, { headers: { 'Cache-Control': 'private, no-store' } });
}
