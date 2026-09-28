import {NextResponse} from 'next/server';
import {z} from 'zod';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {getSmmProvider} from '@/lib/smm/provider';
import {refundOrder} from '@/lib/orders/refund-order';
import {notifyAdminNewOrder} from '@/lib/notifications';
const schema=z.object({serverId:z.string(),link:z.string().url(),quantity:z.number().int().positive()});
export async function POST(req:Request){
  const user=await currentUser(); if(!user)return NextResponse.json({success:false,error:'Chưa đăng nhập'},{status:401});
  const input=schema.safeParse(await req.json()); if(!input.success)return NextResponse.json({success:false,error:'Thông tin đơn hàng không hợp lệ'},{status:400});
  const server=await prisma.server.findUnique({where:{id:input.data.serverId},include:{service:true}});
  if(!server||!server.active)return NextResponse.json({success:false,error:'Máy chủ không khả dụng'},{status:400});
  if(input.data.quantity<server.min||input.data.quantity>server.max)return NextResponse.json({success:false,error:`Số lượng phải từ ${server.min} đến ${server.max}`},{status:400});
  const pricePer1000=Number(server.pricePer1000);
  const total=Math.ceil(input.data.quantity*pricePer1000/1000);
  let order;
  try{order=await prisma.$transaction(async tx=>{const debit=await tx.user.updateMany({where:{id:user.id,balance:{gte:total}},data:{balance:{decrement:total}}});if(debit.count!==1)throw new Error('INSUFFICIENT_BALANCE');const after=await tx.user.findUniqueOrThrow({where:{id:user.id},select:{balance:true}});const o=await tx.order.create({data:{userId:user.id,platformId:server.service.platformId,serviceId:server.serviceId,serverId:server.id,link:input.data.link,quantity:input.data.quantity,price:total}});await tx.balanceTransaction.create({data:{userId:user.id,type:'ORDER',amount:-total,balanceBefore:Number(after.balance)+total,balanceAfter:Number(after.balance),referenceType:'Order',referenceId:o.id,description:`Tạo đơn #${o.id}`}});return o;});}catch(e){return NextResponse.json({success:false,code:'INSUFFICIENT_BALANCE',error:'Số dư không đủ. Vui lòng nạp thêm tiền.'},{status:400});}
  try{const provider=getSmmProvider();const result=await provider.createOrder({serviceId:server.providerServiceId||server.serviceId,link:input.data.link,quantity:input.data.quantity});const updated=await prisma.order.update({where:{id:order.id},data:{providerOrderId:result.orderId,status:'PROCESSING'}});await notifyAdminNewOrder({id:updated.id,username:user.username,service:server.service.name,quantity:updated.quantity,price:Number(updated.price),link:updated.link});return NextResponse.json({success:true,data:updated});}
  catch{await prisma.order.update({where:{id:order.id},data:{status:'FAILED'}}).catch(()=>{});await refundOrder(order.id).catch(()=>{});return NextResponse.json({success:false,code:'PROVIDER_FAILED_REFUNDED',error:'Không thể gửi đơn đến nhà cung cấp. Số tiền đã được hoàn lại.'},{status:502});}
}
export async function GET(){const user=await currentUser();if(!user)return NextResponse.json({success:false,error:'Chưa đăng nhập'},{status:401});return NextResponse.json({success:true,data:await prisma.order.findMany({where:{userId:user.id},include:{service:true,server:true},orderBy:{createdAt:'desc'}})});}
