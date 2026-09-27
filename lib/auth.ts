import { cookies } from 'next/headers';
import { prisma } from './prisma';
import crypto from 'node:crypto';
const hash = (password:string, salt:string) => crypto.scryptSync(password, salt, 64).toString('hex');
export const hashPassword = (password:string) => { const salt=crypto.randomBytes(16).toString('hex'); return `${salt}:${hash(password,salt)}`; };
export const verifyPassword = (password:string, stored:string) => { const [salt, digest]=stored.split(':'); return !!salt && !!digest && crypto.timingSafeEqual(Buffer.from(hash(password,salt),'hex'),Buffer.from(digest,'hex')); };
export async function currentUser(){ const token=(await cookies()).get('smm_session')?.value; if(!token) return null; const userId=Buffer.from(token,'base64url').toString(); return prisma.user.findUnique({where:{id:userId}}); }
export const sessionCookie=(userId:string)=>Buffer.from(userId).toString('base64url');
