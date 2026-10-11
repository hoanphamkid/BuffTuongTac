import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'freeTrialEnabled';

export async function getTrialAvailability() {
  try {
    const rows = await prisma.$queryRaw<Array<{ value: string }>>`
      SELECT "value" FROM "SiteSetting" WHERE "key" = ${SETTING_KEY} LIMIT 1
    `;
    return { enabled: rows[0]?.value !== 'false', configured: true };
  } catch (error) {
    // Keep existing ordering behavior until the schema migration is applied.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2010' && error.meta?.code === '42P01') {
      return { enabled: true, configured: false };
    }
    throw error;
  }
}

export async function setTrialAvailability(enabled: boolean) {
  const value = enabled ? 'true' : 'false';
  await prisma.$executeRaw`
    INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
    VALUES (${SETTING_KEY}, ${value}, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE
    SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
  `;
}
