import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {hashPassword,sessionCookie} from '@/lib/auth';
export const runtime = 'nodejs';
const schema=z.object({username:z.string().min(3).max(30),email:z.string().email(),password:z.string().min(8),confirmPassword:z.string()}).refine(x=>x.password===x.confirmPassword,{path:['confirmPassword'],message:'Mật khẩu xác nhận không khớp'});
export async function POST(req:Request){try{const data=schema.parse(await req.json());const exists=await prisma.user.findFirst({where:{OR:[{email:data.email},{username:data.username}]}});if(exists)return NextResponse.json({success:false,error:'Email hoặc tên người dùng đã tồn tại'},{status:409});const user=await prisma.user.create({data:{fullName:data.username,username:data.username,email:data.email,passwordHash:hashPassword(data.password)}});const res=NextResponse.json({success:true,data:{id:user.id,username:user.username}});res.cookies.set('smm_session',sessionCookie(user.id),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*30,path:'/'});return res}catch(e){return NextResponse.json({success:false,error:'Dữ liệu đăng ký không hợp lệ'},{status:400})}}
