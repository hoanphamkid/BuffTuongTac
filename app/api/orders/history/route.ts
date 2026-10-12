import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

const localOrdersPreview=()=>process.env.NODE_ENV!=='production'&&process.env.NEXT_PUBLIC_LOCAL_PREVIEW==='true';

function previewOrders(){
  return Array.from({length:10},(_,index)=>{
    const quantity=1000+(index*500);
    return {
      id:`preview-order-${String(index+1).padStart(2,'0')}`,
      quantity,
      price:quantity*50,
      link:'https://www.tiktok.com/@kid.social/video/preview',
      status:index===0?'PROCESSING':'PENDING',
      createdAt:new Date(Date.now()-(index*60*60*1000)).toISOString(),
      service:{name:'TikTok Likes',platform:{id:'tiktok',name:'TikTok',slug:'tiktok'}},
      server:{name:'TikTok Likes [SV1]'},
    };
  });
}

export async function GET(){
  const u=await currentUser();
  if(!u&&localOrdersPreview())return NextResponse.json({success:true,data:previewOrders()});
  if(!u)return NextResponse.json({success:false,error:'Chưa đăng nhập'},{status:401});
  const orders=await prisma.order.findMany({where:{userId:u.id},include:{service:{include:{platform:true}},server:true},orderBy:{createdAt:'desc'}});
  return NextResponse.json({success:true,data:orders});
}
