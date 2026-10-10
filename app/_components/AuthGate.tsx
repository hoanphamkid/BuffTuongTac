'use client';

import {useEffect} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {useCurrentUser} from '@/providers/CurrentUserProvider';

export function AuthGate({children}:{children:React.ReactNode}){
  const path=usePathname();
  const router=useRouter();
  const {user,loading,clearUser}=useCurrentUser();
  const publicPage=path==='/login'||path==='/register';
  const privatePage=['/account','/add-funds','/orders','/refunds','/deposits','/transactions'].some(x=>path===x||path.startsWith(x+'/'));

  useEffect(()=>{
    if(privatePage&&!publicPage&&!loading&&!user){
      clearUser();
      const next=`${path}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  },[path,privatePage,publicPage,loading,user,clearUser,router]);

  if(!privatePage||publicPage||user)return <>{children}</>;
  return <div className="loading-screen">Đang chuyển đến đăng nhập...</div>;
}
