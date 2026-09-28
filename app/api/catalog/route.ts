import {NextResponse} from 'next/server'; import {prisma} from '@/lib/prisma';
export async function GET(){const data=await prisma.platform.findMany({where:{active:true},include:{services:{where:{active:true},include:{servers:{where:{active:true}}}}}});return NextResponse.json({success:true,data});}
