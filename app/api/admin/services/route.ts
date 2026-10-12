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

function serializeService(service: any) {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    active: service.active,
    platform: {
      id: service.platform.id,
      name: service.platform.name,
      slug: service.platform.slug,
      icon: service.platform.icon,
      active: service.platform.active,
    },
  };
}

const include = { service: { include: { platform: true } } } as const;

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const [servers, trialSettings, services] = await Promise.all([
    prisma.server.findMany({ include, orderBy: { createdAt: 'asc' } }),
    getTrialAvailability(),
    prisma.service.findMany({ include: { platform: true }, orderBy: [{ platform: { name: 'asc' } }, { name: 'asc' }] }),
  ]);

  return NextResponse.json({ success: true, data: servers.map(serializeServer), services: services.map(serializeService), trialEnabled: trialSettings.enabled, trialSettingsReady: trialSettings.configured });
}

export async function POST(request: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ success: false, error: 'Không có quyền quản trị' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const serviceId = typeof body.serviceId === 'string' ? body.serviceId.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const speed = typeof body.speed === 'string' ? body.speed.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const rawMin = typeof body.min === 'number' && Number.isSafeInteger(body.min) ? String(body.min) : typeof body.min === 'string' ? body.min.trim() : '';
  const rawMax = typeof body.max === 'number' && Number.isSafeInteger(body.max) ? String(body.max) : typeof body.max === 'string' ? body.max.trim() : '';
  const rawPrice = typeof body.pricePer1000 === 'number' && Number.isSafeInteger(body.pricePer1000) ? String(body.pricePer1000) : typeof body.pricePer1000 === 'string' ? body.pricePer1000.trim() : '';

  if (!serviceId || !name || !speed || !/^\d+$/.test(rawMin) || !/^\d+$/.test(rawMax) || !/^\d+$/.test(rawPrice)) {
    return NextResponse.json({ success: false, error: 'Vui lòng nhập đủ dịch vụ, tên máy chủ, tốc độ, giới hạn và giá hợp lệ' }, { status: 400 });
  }

  const min = Number(rawMin);
  const max = Number(rawMax);
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 1 || max < min || max > 100000000) {
    return NextResponse.json({ success: false, error: 'Giới hạn máy chủ không hợp lệ' }, { status: 400 });
  }

  const price = BigInt(rawPrice);
  if (price > MAX_PRICE) {
    return NextResponse.json({ success: false, error: 'Giá gói vượt quá giới hạn cho phép' }, { status: 400 });
  }
  if (name.length > 160 || speed.length > 120 || description.length > 500) {
    return NextResponse.json({ success: false, error: 'Thông tin máy chủ quá dài' }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy dịch vụ cần thêm máy chủ' }, { status: 404 });
  }

  try {
    const server = await prisma.server.create({
      data: {
        serviceId,
        name,
        description: description || null,
        speed,
        min,
        max,
        pricePer1000: new Prisma.Decimal(price.toString()),
        active: body.active !== false,
      },
      include,
    });
    return NextResponse.json({ success: true, data: serializeServer(server) }, { status: 201 });
  } catch (error) {
    console.error('[admin/services] server creation failed', error);
    return NextResponse.json({ success: false, error: 'Không thể thêm máy chủ lúc này' }, { status: 500 });
  }
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
