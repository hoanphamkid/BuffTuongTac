import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const env = {
    databaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
    authSecret: Boolean(process.env.AUTH_SECRET?.trim()),
  };

  if (!env.databaseUrl) {
    return NextResponse.json({app: 'ok', database: 'error', env}, {status: 503});
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({app: 'ok', database: 'ok', env});
  } catch (error) {
    console.error('[health] database check failed:', error instanceof Error ? error.name : 'UNKNOWN_ERROR');
    return NextResponse.json({app: 'ok', database: 'error', env}, {status: 503});
  }
}
