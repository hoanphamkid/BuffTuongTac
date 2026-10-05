import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const data = await prisma.trialKey.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { usedByUser: { select: { username: true, email: true } } },
  });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const requested = Number(body.count);
  const count = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 50) : 1;
  const created = [];

  for (let index = 0; index < count; index += 1) {
    let key = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `KID-TRIAL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      if (!await prisma.trialKey.findUnique({ where: { key: candidate } })) {
        key = candidate;
        break;
      }
    }
    if (!key) return NextResponse.json({ success: false, error: 'Không thể tạo KEY mới, vui lòng thử lại.' }, { status: 500 });
    created.push(await prisma.trialKey.create({ data: { key } }));
  }

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
