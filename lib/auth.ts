import {cookies} from 'next/headers';
import {prisma} from './prisma';
import crypto from 'node:crypto';

const hash=(password:string,salt:string)=>crypto.scryptSync(password,salt,64).toString('hex');
export const hashPassword=(password:string)=>{const salt=crypto.randomBytes(16).toString('hex');return `${salt}:${hash(password,salt)}`};
export const verifyPassword=(password:string,stored:string)=>{const [salt,digest]=stored.split(':');if(!salt||!digest)return false;const expected=Buffer.from(hash(password,salt),'hex'),actual=Buffer.from(digest,'hex');return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual)};

const secret=()=>{const value=process.env.AUTH_SECRET;if(!value||value==='thay-bang-chuoi-ngau-nhien')throw new Error('AUTH_SECRET_MISSING');return value};
const sign=(value:string)=>crypto.createHmac('sha256',secret()).update(value).digest('base64url');
export const sessionCookie=(userId:string)=>{const issuedAt=Math.floor(Date.now()/1000);const payload=`${userId}.${issuedAt}`;return `${payload}.${sign(payload)}`};
export async function currentUser(){
  const token=(await cookies()).get('smm_session')?.value;
  if(!token)return null;
  try{
    const [userId,issuedAt,signature,...extra]=token.split('.');
    if(!userId||!issuedAt||!signature||extra.length||!/^\d+$/.test(issuedAt))return null;
    const payload=`${userId}.${issuedAt}`,expected=sign(payload),actual=Buffer.from(signature),expectedBuffer=Buffer.from(expected);
    if(actual.length!==expectedBuffer.length||!crypto.timingSafeEqual(actual,expectedBuffer))return null;
    return prisma.user.findUnique({where:{id:userId}});
  }catch{return null}
}
