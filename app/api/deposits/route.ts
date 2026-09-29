import {NextResponse} from 'next/server';
import {z} from 'zod';
import crypto from 'node:crypto';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

const amountSchema=z.object({amount:z.number().int().min(5000).max(999_999_999_999)});
export async function GET(){const u=await currentUser();if(!u)return NextResponse.json({success:false},{status:401});return NextResponse.json({success:true,data:await prisma.deposit.findMany({where:{userId:u.id},orderBy:{createdAt:'desc'}})})}
export async function POST(req:Request){
  const u=await currentUser();if(!u)return NextResponse.json({success:false,error:'Chưa đăng nhập'},{status:401});
  const p=amountSchema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({success:false,error:'Số tiền nạp không hợp lệ'},{status:400});
  const account=u.username.split('@')[0].replace(/[^A-Za-z0-9_-]/g,'')||'user';
  const code=`${account}2924111${Date.now().toString().slice(-8)}${crypto.randomInt(1000,10000)}`;
  try{
    const d=await prisma.deposit.create({data:{userId:u.id,amount:p.data.amount,paymentCode:code,paymentMethod:'BANK_TRANSFER'}});
    return NextResponse.json({success:true,data:{...d,amount:Number(d.amount),bank:{id:process.env.BANK_ID||'MB',accountNumber:process.env.BANK_ACCOUNT_NUMBER||'',accountName:process.env.BANK_ACCOUNT_NAME||''}}});
  }catch{return NextResponse.json({success:false,error:'Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.'},{status:500})}
}
