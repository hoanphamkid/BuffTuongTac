import { PrismaClient } from '@prisma/client';
import { threadsPlatform, threadsService, threadsServer } from '../lib/catalog/threads';
const prisma = new PrismaClient();
type ServerSpec = { code: string; price: number };
const platforms = [['Facebook','facebook'],['TikTok','tiktok'],['Instagram','instagram'],['YouTube','youtube']] as const;
const tiktok = [
  ['TikTok Likes','tiktok-likes',[['SV3',15000]]],
  ['TikTok Followers','tiktok-followers',[['SV1',40000]]],
  ['TikTok Views','tiktok-views',[['SV1',2000],['SV2',2400]]],
  ['TikTok Livestream Views','tiktok-livestream-views',[['SV1',60000]]],
  ['TikTok Comments','tiktok-comments',[['SV1',300000]]],
  ['TikTok Shares','tiktok-shares',[['SV2',5000]]],
  ['TikTok PK Battle Points','tiktok-pk-battle-points',[['SV1',8000]]],
] as const;
async function server(serviceId:string, serviceName:string, spec:ServerSpec){
  const name = `${serviceName} [${spec.code}]`;
  const data = { name, pricePer1000: spec.price, description:'Toc do on dinh', speed:'50K/ngay', min:10, max:100000, active:true };
  const old = await prisma.server.findFirst({where:{serviceId,name}});
  if(old) await prisma.server.update({where:{id:old.id},data}); else await prisma.server.create({data:{serviceId,...data}});
}
async function pruneServers(serviceId: string, allowedNames: string[]) {
  await prisma.server.updateMany({
    where: { serviceId, name: { notIn: allowedNames } },
    data: { active: false },
  });
  await prisma.server.deleteMany({
    where: { serviceId, name: { notIn: allowedNames }, orders: { none: {} } },
  });
}
async function main(){
  // Keep this addition isolated from the existing platform seed/pruning logic.
  await prisma.$transaction(async tx => {
    const platform = await tx.platform.upsert({
      where: { slug: threadsPlatform.slug },
      update: {},
      create: threadsPlatform,
    });
    const service = await tx.service.upsert({
      where: { platformId_slug: { platformId: platform.id, slug: threadsService.slug } },
      update: {},
      create: { ...threadsService, platformId: platform.id },
    });
    const existing = await tx.server.findFirst({ where: { serviceId: service.id, name: threadsServer.name } });
    if (!existing) await tx.server.create({ data: { ...threadsServer, serviceId: service.id } });
  });
  for(const [platformName,slug] of platforms){
    const icon=platformName==='Facebook'?'🔵':platformName==='TikTok'?'🎵':platformName==='Instagram'?'📷':'▶️';
    const displayName=`${icon} ${platformName}`;
    const platform=await prisma.platform.upsert({where:{slug},update:{name:displayName},create:{name:displayName,slug,icon:slug}});
    if(platformName==='TikTok'){
      const old=await prisma.service.findMany({where:{platformId:platform.id},orderBy:{id:'asc'}});
      for(let i=0;i<tiktok.length;i++){
        const [name,serviceSlug,raw]=tiktok[i];
        const service=old[i]
          ? await prisma.service.update({where:{id:old[i].id},data:{name,slug:serviceSlug,active:true}})
          : await prisma.service.upsert({where:{platformId_slug:{platformId:platform.id,slug:serviceSlug}},update:{name,active:true},create:{platformId:platform.id,name,slug:serviceSlug}});
        for(const [code,price] of raw) await server(service.id,name,{code,price});
        await pruneServers(service.id, raw.map((item) => `${name} [${item[0]}]`));
      }
    }else{
      if(platformName==='Instagram'){
        const instagramServices = [
          ['Người theo dõi Instagram','instagram-followers',50000],
          ['Lượt thích Instagram','instagram-likes',40000],
        ] as const;
        const allowedIds:string[]=[];
        for(const [name,serviceSlug,price] of instagramServices){
          const service=await prisma.service.upsert({where:{platformId_slug:{platformId:platform.id,slug:serviceSlug}},update:{name,active:true},create:{platformId:platform.id,name,slug:serviceSlug}});
          allowedIds.push(service.id);
          await server(service.id,name,{code:'SV1',price});
          await pruneServers(service.id,[`${name} [SV1]`]);
        }
        await prisma.service.updateMany({where:{platformId:platform.id,id:{notIn:allowedIds}},data:{active:false}});
        continue;
      }
      const name=platformName==='Facebook'?'Lượt thích và cảm xúc bài viết Facebook':`${platformName} Services`;
      const serviceSlug=`${slug}-services`;
      const service=await prisma.service.upsert({where:{platformId_slug:{platformId:platform.id,slug:serviceSlug}},update:{name,active:true},create:{platformId:platform.id,name,slug:serviceSlug}});
      await server(service.id,platformName==='Facebook'?'Lượt thích bài viết Facebook':name,{code:'SV1',price:2900});
      if(platformName==='Facebook'){
        await server(service.id,'Cảm xúc bài viết Facebook',{code:'SV2',price:15000});
        await pruneServers(service.id,[`Lượt thích bài viết Facebook [SV1]`,`Cảm xúc bài viết Facebook [SV2]`]);
        // Only hide the two legacy categories merged into this service.
        await prisma.service.updateMany({where:{
          platformId:platform.id,
          id:{not:service.id},
          slug:{in:['lượt-thích-bài-viết-facebook','cảm-xúc-bài-viết-facebook']},
        },data:{active:false}});
      }else{
        await pruneServers(service.id,[`${name} [SV1]`]);
      }
    }
  }
}
main().catch(console.error).finally(()=>prisma.$disconnect());
