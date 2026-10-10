import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function readSubscription(body: any) {
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh.trim() : '';
  const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth.trim() : '';
  if (!endpoint || !p256dh || !auth || endpoint.length > 4096) return null;
  return { endpoint, p256dh, auth };
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });

  const subscription = readSubscription(await req.json().catch(() => null));
  if (!subscription) return NextResponse.json({ success: false, error: 'Thông tin thiết bị không hợp lệ' }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { userId: user.id, ...subscription },
    update: { userId: user.id, p256dh: subscription.p256dh, auth: subscription.auth },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint } });
  return NextResponse.json({ success: true });
}
