import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {processPaymentTransaction} from '@/lib/payment/process-payment';
export async function POST(req:Request){
  if(process.env.NODE_ENV==='production')return NextResponse.json({success:false,error:'Tắt trong môi trường production'},{status:404});
  const user=await currentUser();if(!user)return NextResponse.json({success:false,error:'Chưa đăng nhập'},{status:401});
  const body=await req.json();const deposit=await prisma.deposit.findFirst({where:{id:String(body.depositId),userId:user.id,status:'PENDING'}});if(!deposit)return NextResponse.json({success:false,error:'Không tìm thấy giao dịch đang chờ'},{status:404});
  try{return NextResponse.json({success:true,data:await processPaymentTransaction({transactionId:`DEV-${Date.now()}`,amount:Number(deposit.amount),description:deposit.paymentCode,paidAt:new Date()})});}catch{return NextResponse.json({success:false,error:'Không thể giả lập thanh toán'},{status:400});}
}
