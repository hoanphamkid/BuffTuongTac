import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { getTrialAvailability, setTrialAvailability } from '@/lib/trial-availability';

const MAX_PRICE = BigInt('9007199254740991');

function serializeServer(server: any) {
  return {
    id: server.id,
    name: server.name,
    description: server.description,
    speed: server.speed,
    min: server.min,
    max: server.max,
    pricePer1000: server.pricePer1000.toString(),
    active: server.active,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    service: {
      id: server.service.id,
      name: server.service.name,
      slug: server.service.slug,
      active: server.service.active,
      platform: {
        id: server.service.platform.id,
        name: server.service.platform.name,
        slug: server.service.platform.slug,
        icon: server.service.platform.icon,
        active: server.service.platform.active,
      },
    },
  };
}

const include = { service: { include: { platform: true } } } as const;

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const [servers, trialSettings] = await Promise.all([
    prisma.server.findMany({ include, orderBy: { createdAt: 'asc' } }),
    getTrialAvailability(),
  ]);

  return NextResponse.json({ success: true, data: servers.map(serializeServer), trialEnabled: trialSettings.enabled, trialSettingsReady: trialSettings.configured });
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === 'trialAvailability') {
    if (typeof body.active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Trạng thái gói thử không hợp lệ' }, { status: 400 });
    }
    try {
      await setTrialAvailability(body.active);
      return NextResponse.json({ success: true, data: { trialEnabled: body.active } });
    } catch (error) {
      console.error('[admin/services] trial availability update failed', error);
      return NextResponse.json({ success: false, error: 'Không thể cập nhật trạng thái gói thử' }, { status: 500 });
    }
  }

  if (body.action === 'availability') {
    const target = body.target;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id || typeof body.active !== 'boolean' || !['platform', 'service', 'server'].includes(target)) {
      return NextResponse.json({ success: false, error: 'Yêu cầu đổi trạng thái không hợp lệ' }, { status: 400 });
    }

    try {
      if (target === 'platform') await prisma.platform.update({ where: { id }, data: { active: body.active } });
      else if (target === 'service') await prisma.service.update({ where: { id }, data: { active: body.active } });
      else await prisma.server.update({ where: { id }, data: { active: body.active } });
      return NextResponse.json({ success: true, data: { target, id, active: body.active } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ success: false, error: 'Không tìm thấy mục cần đổi trạng thái' }, { status: 404 });
      }
      console.error('[admin/services] availability update failed', error);
      return NextResponse.json({ success: false, error: 'Không thể cập nhật trạng thái' }, { status: 500 });
    }
  }

  const serverId = typeof body.serverId === 'string' ? body.serverId.trim() : '';
  const rawPrice = typeof body.pricePer1000 === 'string'
    ? body.pricePer1000.trim()
    : typeof body.pricePer1000 === 'number' && Number.isSafeInteger(body.pricePer1000)
      ? String(body.pricePer1000)
      : '';

  if (!serverId || !/^\d+$/.test(rawPrice)) {
    return NextResponse.json({ success: false, error: 'Giá gói phải là số nguyên không âm' }, { status: 400 });
  }

  const nextPrice = BigInt(rawPrice);
  if (nextPrice > MAX_PRICE) {
    return NextResponse.json({ success: false, error: 'Giá gói vượt quá giới hạn cho phép' }, { status: 400 });
  }

  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy gói dịch vụ' }, { status: 404 });
  }

  const updated = await prisma.server.update({
    where: { id: serverId },
    data: { pricePer1000: new Prisma.Decimal(nextPrice.toString()) },
    include,
  });

  return NextResponse.json({ success: true, data: serializeServer(updated) });
}
