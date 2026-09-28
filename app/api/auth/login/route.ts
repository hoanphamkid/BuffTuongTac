import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {sessionCookie,verifyPassword} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req:Request){
  const d=z.object({identifier:z.string().trim().min(1),password:z.string().min(1)}).safeParse(await req.json().catch(()=>null));
  if(!d.success)return NextResponse.json({success:false,error:'Thông tin đăng nhập không hợp lệ'},{status:400});
  try{
    const u=await prisma.user.findFirst({where:{OR:[{email:d.data.identifier},{username:d.data.identifier}]}});
    if(!u||!verifyPassword(d.data.password,u.passwordHash))return NextResponse.json({success:false,error:'Sai tài khoản hoặc mật khẩu'},{status:401});
    const res=NextResponse.json({success:true,data:{id:u.id,username:u.username,role:u.role}});
    res.cookies.set('smm_session',sessionCookie(u.id),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*30,path:'/'});
    return res;
  }catch(error){
    const code=error && typeof error==='object' && 'code' in error ? String(error.code) : 'INTERNAL_ERROR';
    console.error('[auth/login] Đăng nhập thất bại:',code);
    return NextResponse.json({success:false,error:'Máy chủ tạm thời không thể xử lý đăng nhập. Vui lòng thử lại sau.'},{status:503});
  }
}
