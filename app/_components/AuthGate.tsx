'use client';

import {useEffect} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {useCurrentUser} from '@/providers/CurrentUserProvider';

export function AuthGate({children}:{children:React.ReactNode}){
  const path=usePathname();
  const router=useRouter();
  const {user,loading,clearUser}=useCurrentUser();
  const publicPage=path==='/login'||path==='/register';
  const localPreview=process.env.NEXT_PUBLIC_LOCAL_PREVIEW==='true';

  useEffect(()=>{
    if(!localPreview&&!publicPage&&!loading&&!user){
      clearUser();
      router.replace('/login');
    }
  },[publicPage,loading,user,clearUser,router]);

  if(localPreview||publicPage||user)return <>{children}</>;
  return <div className="loading-screen">Đang chuyển đến đăng nhập...</div>;
}
