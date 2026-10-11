import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { threadsPreview } from '@/lib/catalog/threads';
import { getTrialAvailability } from '@/lib/trial-availability';

export async function GET() {
  const [data, trialSettings] = await Promise.all([
    prisma.platform.findMany({
      where: { active: true },
      include: { services: { where: { active: true }, include: { servers: { where: { active: true } } } } },
    }),
    getTrialAvailability(),
  ]);
  if (process.env.NODE_ENV === 'development' && !data.some((platform) => platform.slug === 'threads')) {
    return NextResponse.json({ success: true, data: [...data, threadsPreview], trialEnabled: trialSettings.enabled });
  }
  return NextResponse.json({ success: true, data, trialEnabled: trialSettings.enabled });
}
