import {NextResponse} from 'next/server';
import {processPaymentTransaction} from '@/lib/payment/process-payment';

export async function POST(req:Request){
  const secret=process.env.PAYMENT_WEBHOOK_SECRET;
  if(!secret&&process.env.NODE_ENV==='production')return NextResponse.json({success:false,error:'Webhook chưa được cấu hình'},{status:503});
  const legacy=req.headers.get('x-webhook-secret');
  const authorization=req.headers.get('authorization')||'';
  const apiKey=authorization.replace(/^Apikey\s+/i,'').trim();
  if(secret&&legacy!==secret&&apiKey!==secret)return NextResponse.json({success:false,error:'Invalid webhook signature'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body||typeof body!=='object')return NextResponse.json({success:false,error:'Invalid transaction'},{status:400});
  const transactionId=String(body.transactionId??body.referenceCode??body.id??'').trim();
  const amount=Number(body.amount??body.transferAmount);
  const description=String(body.description??body.content??body.code??'').trim();
  const paidAt=new Date(body.timestamp??body.transactionDate??Date.now());
  if(!transactionId||!Number.isSafeInteger(amount)||amount<=0||!description||Number.isNaN(paidAt.valueOf()))return NextResponse.json({success:false,error:'Invalid transaction'},{status:400});
  try{
    const result=await processPaymentTransaction({transactionId,amount,description,paidAt,senderName:String(body.senderName??body.counterAccountName??body.from??body.payerName??''),senderAccount:String(body.senderAccount??body.counterAccountNumber??body.fromAccount??body.payerAccount??'')});
    return NextResponse.json({success:true,data:result});
  }catch(error){console.error('[payments/webhook] processing failed:',error instanceof Error?error.message:'UNKNOWN_ERROR');return NextResponse.json({success:false,error:'Invalid transaction'},{status:400})}
}
