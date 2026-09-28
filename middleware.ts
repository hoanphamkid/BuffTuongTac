import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
export function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  const protectedPath=path==='/'||['/new-order','/account','/add-funds','/orders','/refunds','/services','/mass-order','/support','/deposits','/transactions','/api-docs','/dev'].some(x=>path===x||path.startsWith(x+'/'));
  if(protectedPath&&!req.cookies.get('smm_session')?.value)return NextResponse.redirect(new URL('/login',req.url));
  // Cookie tồn tại chưa chứng minh phiên hợp lệ. Không chặn trang đăng nhập.
  return NextResponse.next();
}
export const config={matcher:['/((?!api|_next|favicon.ico).*)']};
