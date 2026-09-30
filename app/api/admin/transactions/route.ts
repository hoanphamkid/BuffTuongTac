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

export async function PATCH(req:Request){
  if(!await requireAdmin())return NextResponse.json({success:false,error:'Không có quyền quản trị'},{status:403});
  const body=await req.json().catch(()=>({}));
  const id=typeof body.orderId==='string'?body.orderId:'';
  const label=typeof body.label==='string'?body.label.trim().slice(0,120):'';
  if(!id)return NextResponse.json({success:false,error:'Thiếu mã đơn hàng'},{status:400});
  const order=await prisma.order.findUnique({where:{id}});
  if(!order)return NextResponse.json({success:false,error:'Không tìm thấy đơn hàng'},{status:404});
  if(order.status!=='COMPLETED')return NextResponse.json({success:false,error:'Chỉ được sửa nhãn đơn hàng đã hoàn thành'},{status:400});
  const updated=await prisma.order.update({where:{id},data:{label:label||null},include:{user:true,service:{include:{platform:true}},server:true}});
  return NextResponse.json({success:true,data:updated});
}
