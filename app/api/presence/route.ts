import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function POST(){
  const user=await currentUser();
  if(!user)return NextResponse.json({success:false},{status:401});
  const lastSeenAt=new Date();
  await prisma.user.update({where:{id:user.id},data:{lastSeenAt}});
  return NextResponse.json({success:true,data:{lastSeenAt}});
}
