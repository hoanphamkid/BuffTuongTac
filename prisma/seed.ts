import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
type ServerSpec = { code: string; price: number };
const platforms = [['Facebook','facebook'],['TikTok','tiktok'],['Instagram','instagram'],['YouTube','youtube']] as const;
const tiktok = [
  ['TikTok Likes','tiktok-likes',[['SV1',9000],['SV2',11400],['SV3',10200]]],
  ['TikTok Followers','tiktok-followers',[['SV1',25000]]],
  ['TikTok Views','tiktok-views',[['SV1',360],['SV2',2400]]],
  ['TikTok Livestream Views','tiktok-livestream-views',[['SV1',60000]]],
  ['TikTok Comments','tiktok-comments',[['SV1',170000]]],
  ['TikTok Shares','tiktok-shares',[['SV2',4200]]],
  ['TikTok PK Battle Points','tiktok-pk-battle-points',[['SV1',6000]]],
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
      const name=`${platformName} Services`;
      const serviceSlug=`${slug}-services`;
      const service=await prisma.service.upsert({where:{platformId_slug:{platformId:platform.id,slug:serviceSlug}},update:{name,active:true},create:{platformId:platform.id,name,slug:serviceSlug}});
      await server(service.id,name,{code:'SV1',price:2900});
      await pruneServers(service.id,[`${name} [SV1]`]);
    }
  }
}
main().catch(console.error).finally(()=>prisma.$disconnect());
