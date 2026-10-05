import {NextResponse} from 'next/server';
import {z} from 'zod';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {sendOrderEmail} from '@/lib/send-order-email';

const schema=z.object({serverId:z.string(),link:z.string().url(),quantity:z.number().int().positive(),comments:z.array(z.string().trim().min(1).max(1000)).max(100000).optional(),reaction:z.string().trim().max(30).optional(),trialKey:z.string().trim().min(1).max(100).optional()});

export async function POST(req:Request){
  const user=await currentUser();
  if(!user)return NextResponse.json({success:false,error:'Chưa đăng nhập'},{status:401});
  const input=schema.safeParse(await req.json());
  if(!input.success)return NextResponse.json({success:false,error:'Thông tin đơn hàng không hợp lệ'},{status:400});
  const server=await prisma.server.findUnique({where:{id:input.data.serverId},include:{service:{include:{platform:true}}}});
  if(!server||!server.active)return NextResponse.json({success:false,error:'Máy chủ không khả dụng'},{status:400});
  if(input.data.quantity<server.min||input.data.quantity>server.max)return NextResponse.json({success:false,error:`Số lượng phải từ ${server.min} đến ${server.max}`},{status:400});
  if(input.data.trialKey){
    if(server.service.platform.slug!=='tiktok'||server.service.slug!=='tiktok-views')return NextResponse.json({success:false,error:'Gói thử chỉ dùng cho dịch vụ TikTok Views.'},{status:400});
    if(input.data.quantity<100||input.data.quantity>1000)return NextResponse.json({success:false,error:'Gói thử cho phép số lượng từ 100 đến 1000.'},{status:400});
    const keyValue=input.data.trialKey.toUpperCase();
    let trialOrder;
    try{
      trialOrder=await prisma.$transaction(async tx=>{
        const trialKey=await tx.trialKey.findUnique({where:{key:keyValue}});
        if(!trialKey)throw new Error('TRIAL_KEY_INVALID');
        if(trialKey.usedAt||trialKey.usedByUserId)throw new Error('TRIAL_KEY_USED');
        const usedByUser=await tx.trialKey.findUnique({where:{usedByUserId:user.id}});
        if(usedByUser)throw new Error('TRIAL_ALREADY_USED');
        const claimed=await tx.trialKey.updateMany({where:{id:trialKey.id,usedAt:null,usedByUserId:null},data:{usedAt:new Date(),usedByUserId:user.id}});
        if(claimed.count!==1)throw new Error('TRIAL_KEY_USED');
        return tx.order.create({data:{userId:user.id,platformId:server.service.platformId,serviceId:server.serviceId,serverId:server.id,link:input.data.link,quantity:input.data.quantity,price:0,label:'Gói thử'}});
      });
    }catch(error){
      const code=error instanceof Error?error.message:'';
      const message=code==='TRIAL_KEY_INVALID'?'KEY không hợp lệ. Vui lòng kiểm tra lại KEY với admin.':code==='TRIAL_KEY_USED'?'KEY này đã được sử dụng. Vui lòng xin KEY khác từ admin.':code==='TRIAL_ALREADY_USED'?'Tài khoản này đã sử dụng gói thử rồi.':'Không thể tạo gói thử lúc này. Vui lòng thử lại.';
      return NextResponse.json({success:false,error:message},{status:400});
    }
    try{
      await sendOrderEmail({orderId:trialOrder.id,username:user.username,service:server.service.name,server:server.name,link:trialOrder.link,quantity:trialOrder.quantity,total:0});
    }catch(error){console.error('[order-email] Không gửi được email gói thử:',error);}
    return NextResponse.json({success:true,data:trialOrder,trial:true});
  }
  if(server.service.slug==='tiktok-comments' && (!input.data.comments?.length || input.data.comments.length!==input.data.quantity))return NextResponse.json({success:false,error:'Vui lòng nhập mỗi comment trên một dòng.'},{status:400});
  if(server.service.platform.slug==='facebook' && server.name.includes('[SV2]') && !input.data.reaction)return NextResponse.json({success:false,error:'Vui lòng chọn cảm xúc.'},{status:400});
  const total=Math.ceil(input.data.quantity*Number(server.pricePer1000)/1000);
  let order;
  try{
    order=await prisma.$transaction(async tx=>{
      const debit=await tx.user.updateMany({where:{id:user.id,balance:{gte:total}},data:{balance:{decrement:total}}});
      if(debit.count!==1)throw new Error('INSUFFICIENT_BALANCE');
      const after=await tx.user.findUniqueOrThrow({where:{id:user.id},select:{balance:true}});
      const created=await tx.order.create({data:{userId:user.id,platformId:server.service.platformId,serviceId:server.serviceId,serverId:server.id,link:input.data.link,quantity:input.data.quantity,price:total,reaction:input.data.reaction||null}});
      await tx.balanceTransaction.create({data:{userId:user.id,type:'ORDER',amount:-total,balanceBefore:Number(after.balance)+total,balanceAfter:Number(after.balance),referenceType:'Order',referenceId:created.id,description:`Tạo đơn #${created.id}`}});
      return created;
    });
  }catch{return NextResponse.json({success:false,code:'INSUFFICIENT_BALANCE',error:'Số dư không đủ. Vui lòng nạp thêm tiền.'},{status:400});}

  // Chưa kết nối nhà cung cấp ngoài: giữ đơn ở trạng thái chờ xử lý để admin xử lý thủ công.
  const updated=await prisma.order.update({where:{id:order.id},data:{status:'PENDING'}});

  try{
    await sendOrderEmail({orderId:updated.id,username:user.username,service:server.service.name,server:server.name,link:updated.link,quantity:updated.quantity,total:Number(updated.price)});
  }catch(error){console.error('[order-email] Không gửi được email đơn hàng:',error);}
  return NextResponse.json({success:true,data:updated});
}

export async function GET(){
  const user=await currentUser();
  if(!user)return NextResponse.json({success:false,error:'Chưa đăng nhập'},{status:401});
  return NextResponse.json({success:true,data:await prisma.order.findMany({where:{userId:user.id},include:{service:true,server:true},orderBy:{createdAt:'desc'}})});
}
