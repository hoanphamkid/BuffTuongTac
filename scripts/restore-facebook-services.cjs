const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Restore only the existing categories accidentally disabled by the merge seed.
const slugs = [
  'người-theo-dõi-facebook',
  'lượt-thích-trang-+-người-theo-dõi',
  'thành-viên-nhóm-facebook',
  'lượt-xem/reels-facebook',
  'lượt-xem-story-facebook',
  'bình-luận-facebook',
  'lượt-xem-livestream-facebook',
  'lượt-chia-sẻ-bài-viết-facebook',
];

async function main() {
  const platform = await prisma.platform.findUnique({ where: { slug: 'facebook' } });
  if (!platform) throw new Error('Facebook platform not found');
  await prisma.$transaction([
    prisma.service.updateMany({
      where: { platformId: platform.id, slug: { in: slugs } },
      data: { active: true },
    }),
    prisma.service.updateMany({
      where: { platformId: platform.id, slug: 'facebook-services' },
      data: { name: 'Lượt thích và cảm xúc bài viết Facebook' },
    }),
  ]);
  const services = await prisma.service.findMany({
    where: { platformId: platform.id, active: true },
    select: { name: true, servers: { where: { active: true }, select: { id: true } } },
  });
  console.log(JSON.stringify(services.map(s => ({ name: s.name, servers: s.servers.length })), null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
