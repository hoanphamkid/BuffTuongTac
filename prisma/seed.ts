import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const platforms = [['Facebook','facebook'],['TikTok','tiktok'],['Instagram','instagram'],['YouTube','youtube']];
async function main(){
  for(const [name,slug] of platforms){
    const platform=await prisma.platform.upsert({where:{slug},update:{},create:{name,slug,icon:slug}});
    const names=name==='Facebook'?['Lượt thích bài viết Facebook','Người theo dõi Facebook','Cảm xúc bài viết Facebook']:[`Người theo dõi ${name}`,`Lượt thích ${name}`];
    for(const serviceName of names){
      const serviceSlug=serviceName.toLowerCase().replaceAll(' ','-');
      const service=await prisma.service.upsert({where:{platformId_slug:{platformId:platform.id,slug:serviceSlug}},update:{},create:{platformId:platform.id,name:serviceName,slug:serviceSlug}});
      await prisma.server.create({data:{serviceId:service.id,name:`${serviceName} [Toàn cầu]`,description:'Tốc độ ổn định',speed:'50K/ngày',min:10,max:100000,pricePer1000:2900}});
    }
  }
}
main().catch(console.error).finally(()=>prisma.$disconnect());
