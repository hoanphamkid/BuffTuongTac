import {prisma} from '@/lib/prisma';
export type NormalizedTransaction={transactionId:string;amount:number;description:string;paidAt:Date;senderName?:string;senderAccount?:string};
export async function processPaymentTransaction(t:NormalizedTransaction){
  if(!t.transactionId||!t.amount||!t.description)throw new Error('INVALID_TRANSACTION');
  // SePay may prepend its own transfer code. Usernames can contain email
  // characters, so keep dots, @, %, +, _, and hyphens in the payment code.
  const code=t.description.match(/[A-Za-z0-9._%+@-]+2924111\d{4}/)?.[0] ?? t.description.match(/NHSV\d+/)?.[0] ?? t.description.trim(); if(!code)throw new Error('PAYMENT_CODE_NOT_FOUND');
  return prisma.$transaction(async tx=>{
    const deposit=await tx.deposit.findUnique({where:{paymentCode:code}}); if(!deposit)throw new Error('DEPOSIT_NOT_FOUND');
    if(deposit.transactionId===t.transactionId||deposit.status==='PAID')return {idempotent:true,depositId:deposit.id};
    if(deposit.status!=='PENDING'||Number(deposit.amount)!==Number(t.amount))throw new Error('INVALID_DEPOSIT');
    const duplicate=await tx.deposit.findUnique({where:{transactionId:t.transactionId}});if(duplicate)return {idempotent:true,depositId:duplicate.id};
    const user=await tx.user.findUniqueOrThrow({where:{id:deposit.userId}});const after=Number(user.balance)+Number(deposit.amount);
    const changed=await tx.deposit.updateMany({where:{id:deposit.id,status:'PENDING',transactionId:null},data:{status:'PAID',transactionId:t.transactionId,paidAt:t.paidAt,rawPayload:t as any}});if(changed.count!==1)return {idempotent:true,depositId:deposit.id};
    await tx.user.update({where:{id:user.id},data:{balance:{increment:Number(deposit.amount)},totalDeposited:{increment:Number(deposit.amount)}}});
    await tx.balanceTransaction.create({data:{userId:user.id,type:'DEPOSIT',amount:Number(deposit.amount),balanceBefore:Number(user.balance),balanceAfter:after,referenceType:'Deposit',referenceId:deposit.id,description:`Nạp tiền ${deposit.paymentCode}`}});
    return {idempotent:false,depositId:deposit.id};
  });
}
