import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin';
import {createBalanceNotification} from '@/lib/notifications';
import {sendPushNotification} from '@/lib/push';

export async function GET(){
  if(!await requireAdmin())return NextResponse.json({success:false,error:'Không có quyền quản trị'},{status:403});
  const data=await prisma.deposit.findMany({orderBy:{createdAt:'desc'},include:{user:true},take:500});
  return NextResponse.json({success:true,data});
}

export async function PATCH(req:Request){
  const admin=await requireAdmin();
  if(!admin)return NextResponse.json({success:false,error:'Không có quyền quản trị'},{status:403});
  const body=await req.json().catch(()=>({}));
  const id=String(body.id||''),action=String(body.action||'');
  if(!id||!['paid','cancel'].includes(action))return NextResponse.json({success:false,error:'Yêu cầu không hợp lệ'},{status:400});
  try{
    const result=await prisma.$transaction(async tx=>{
      const deposit=await tx.deposit.findUnique({where:{id}});
      if(!deposit)throw new Error('NOT_FOUND');
      if(deposit.status!=='PENDING')throw new Error('NOT_PENDING');
      if(action==='cancel'){
        await tx.deposit.update({where:{id},data:{status:'FAILED'}});
        return {status:'FAILED'};
      }
      const user=await tx.user.findUniqueOrThrow({where:{id:deposit.userId}});
      const amount=Number(deposit.amount),after=Number(user.balance)+amount;
      const changed=await tx.deposit.updateMany({where:{id,status:'PENDING'},data:{status:'PAID',paidAt:new Date(),transactionId:`ADMIN-${admin.id.slice(-6)}-${Date.now()}`,rawPayload:{source:'ADMIN',adminId:admin.id}}});
      if(changed.count!==1)throw new Error('NOT_PENDING');
      await tx.user.update({where:{id:user.id},data:{balance:{increment:amount},totalDeposited:{increment:amount}}});
      await tx.balanceTransaction.create({data:{userId:user.id,type:'DEPOSIT',amount,balanceBefore:Number(user.balance),balanceAfter:after,referenceType:'Deposit',referenceId:deposit.id,description:`Admin xác nhận nạp tiền ${deposit.paymentCode}`}});
      const notification=await createBalanceNotification(tx,{userId:user.id,amount,balanceAfter:after,reason:'Admin xác nhận nạp tiền'});
      return {status:'PAID',notification};
    });
    if(result.notification)await sendPushNotification(result.notification);
    return NextResponse.json({success:true,data:result});
  }catch(error){
    const message=error instanceof Error?error.message:'';
    if(message==='NOT_FOUND')return NextResponse.json({success:false,error:'Không tìm thấy giao dịch'},{status:404});
    if(message==='NOT_PENDING')return NextResponse.json({success:false,error:'Giao dịch đã được xử lý trước đó'},{status:409});
    console.error('[admin/deposits] update failed',error);
    return NextResponse.json({success:false,error:'Không thể cập nhật giao dịch'},{status:500});
  }
}
