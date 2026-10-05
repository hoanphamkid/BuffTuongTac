import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { threadsPreview } from '@/lib/catalog/threads';

export async function GET() {
  const data = await prisma.platform.findMany({
    where: { active: true },
    include: { services: { where: { active: true }, include: { servers: { where: { active: true } } } } },
  });
  if (process.env.NODE_ENV === 'development' && !data.some((platform) => platform.slug === 'threads')) {
    return NextResponse.json({ success: true, data: [...data, threadsPreview] });
  }
  return NextResponse.json({ success: true, data });
}
