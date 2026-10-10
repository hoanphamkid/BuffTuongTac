import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
export function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  if(process.env.NODE_ENV!=='production'||process.env.NEXT_PUBLIC_LOCAL_PREVIEW==='true')return NextResponse.next();
  const protectedPath=['/account','/add-funds','/orders','/refunds','/deposits','/transactions'].some(x=>path===x||path.startsWith(x+'/'));
  if(protectedPath&&!req.cookies.get('smm_session')?.value){
    const loginUrl=new URL('/login',req.url);
    loginUrl.searchParams.set('next',`${path}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  // Cookie tồn tại chưa chứng minh phiên hợp lệ. Không chặn trang đăng nhập.
  return NextResponse.next();
}
export const config={matcher:['/((?!api|_next|favicon.ico).*)']};
