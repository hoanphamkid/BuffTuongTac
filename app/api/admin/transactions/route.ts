import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin';

export async function GET(){
  if(!await requireAdmin())return NextResponse.json({success:false,error:'Không có quyền quản trị'},{status:403});
  const [deposits,transactions,orders]=await Promise.all([
    prisma.deposit.findMany({orderBy:{createdAt:'desc'},include:{user:true},take:500}),
    prisma.balanceTransaction.findMany({where:{type:{not:'DEPOSIT'}},orderBy:{createdAt:'desc'},include:{user:true},take:500}),
    prisma.order.findMany({orderBy:{createdAt:'desc'},include:{user:true,service:{include:{platform:true}},server:true},take:500})
  ]);
  return NextResponse.json({success:true,data:{deposits,transactions,orders}});
}
