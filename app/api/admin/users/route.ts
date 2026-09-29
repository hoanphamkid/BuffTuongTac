import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin';

export async function GET(){
  if(!await requireAdmin())return NextResponse.json({error:'Forbidden'},{status:403});
  const data=await prisma.user.findMany({orderBy:{createdAt:'desc'},include:{_count:{select:{orders:true}}},take:100});
  return NextResponse.json({success:true,data});
}

export async function PATCH(req:Request){
  const admin=await requireAdmin();
  if(!admin)return NextResponse.json({error:'Forbidden'},{status:403});
  const b=await req.json();
  const u=await prisma.user.findUnique({where:{id:b.id}});
  if(!u)return NextResponse.json({error:'Không tìm thấy tài khoản'},{status:404});

  if(b.action==='role')await prisma.user.update({where:{id:u.id},data:{role:b.role==='ADMIN'?'ADMIN':'USER'}});
  else if(b.action==='profile')await prisma.user.update({where:{id:u.id},data:{fullName:b.fullName||u.fullName,email:b.email||u.email}});
  else if(b.action==='balance'){
    const rawAmount=typeof b.amount==='string'?b.amount.replace(/[^0-9-]/g,''):b.amount;
    const delta=Number(rawAmount);
    if(!Number.isFinite(delta)||!delta)return NextResponse.json({error:'Số tiền không hợp lệ'},{status:400});
    const adjustment=await prisma.$transaction(async tx=>{
      const beforeUser=await tx.user.findUniqueOrThrow({where:{id:u.id},select:{balance:true}});
      const before=Number(beforeUser.balance);
      if(delta<0){
        const deducted=await tx.user.updateMany({where:{id:u.id,balance:{gte:Math.abs(delta)}},data:{balance:{decrement:Math.abs(delta)}}});
        if(deducted.count!==1)throw new Error('INSUFFICIENT_BALANCE');
      }else await tx.user.update({where:{id:u.id},data:{balance:{increment:delta}}});
      const updated=await tx.user.findUniqueOrThrow({where:{id:u.id},select:{balance:true}});
      const after=Number(updated.balance);
      const reason=typeof b.reason==='string'&&b.reason.trim()?b.reason.trim():'Điều chỉnh thủ công';
      const note=typeof b.note==='string'&&b.note.trim()?` — ${b.note.trim()}`:'';
      await tx.balanceTransaction.create({data:{userId:u.id,type:delta>0?'ADMIN_CREDIT':'ADMIN_DEBIT',amount:Math.abs(delta),balanceBefore:before,balanceAfter:after,referenceType:'ADMIN',referenceId:admin.id,description:`${reason}${note}`}});
      return {balance:after};
    }).catch(error=>{
      if(error instanceof Error&&error.message==='INSUFFICIENT_BALANCE')return null;
      throw error;
    });
    if(!adjustment)return NextResponse.json({error:'Số dư hiện tại không đủ để trừ.'},{status:400});
    return NextResponse.json({success:true,data:adjustment});
  }else return NextResponse.json({error:'Thao tác không hợp lệ'},{status:400});
  return NextResponse.json({success:true});
}
