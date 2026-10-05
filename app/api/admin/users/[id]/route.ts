import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  if(!await requireAdmin())return NextResponse.json({success:false,error:'Không có quyền quản trị'},{status:403});
  const {id}=await params;
  const user=await prisma.user.findUnique({
    where:{id},
    select:{
      id:true,username:true,email:true,fullName:true,balance:true,totalDeposited:true,role:true,createdAt:true,lastSeenAt:true,
      passwordHash:true,
      _count:{select:{orders:true,deposits:true,transactions:true}},
      orders:{
        orderBy:{createdAt:'desc'},
        select:{
          id:true,link:true,quantity:true,price:true,status:true,label:true,reaction:true,providerOrderId:true,createdAt:true,updatedAt:true,
          service:{select:{name:true,platform:{select:{name:true,slug:true,icon:true}}}},
          server:{select:{name:true}},
        },
      },
    },
  });
  if(!user)return NextResponse.json({success:false,error:'Không tìm thấy tài khoản'},{status:404});
  const {passwordHash,...safeUser}=user;
  return NextResponse.json({success:true,data:{
    ...safeUser,
    balance:Number(user.balance),
    totalDeposited:Number(user.totalDeposited),
    passwordConfigured:Boolean(passwordHash),
    orders:user.orders.map(order=>({...order,price:Number(order.price)})),
  }});
}
