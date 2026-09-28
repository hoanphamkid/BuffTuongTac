'use client';
import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {useCurrentUser} from '@/providers/CurrentUserProvider';

export function AuthGate({children}:{children:React.ReactNode}){
  const path=usePathname();
  const router=useRouter();
  const {refreshUser,clearUser}=useCurrentUser();
  const [checkedPath,setCheckedPath]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  const publicPage=path==='/login'||path==='/register';
  useEffect(()=>{
    if(publicPage)return;
    let cancelled=false;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    setError('');
    (async()=>{
      try{
        const response=await fetch('/api/me',{cache:'no-store',signal:controller.signal});
        if(cancelled)return;
        if(response.status===401){clearUser();router.replace('/login');return;}
        const result=await response.json();
        if(!response.ok||!result.data?.id)throw new Error('Không thể kiểm tra tài khoản. Vui lòng thử lại.');
        await refreshUser();
        if(!cancelled)setCheckedPath(path);
      }catch{if(!cancelled)setError('Không thể kiểm tra tài khoản. Vui lòng thử lại.');}
      finally{clearTimeout(timer);}
    })();
    return()=>{cancelled=true;controller.abort();clearTimeout(timer);};
    // clearUser có tham chiếu mới mỗi render; chỉ kiểm tra lại khi đổi trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[path,publicPage,retry,router,refreshUser]);
  if(publicPage)return <>{children}</>;
  if(error)return <div role="alert">{error} <button onClick={()=>setRetry(n=>n+1)}>Thử lại</button></div>;
  if(checkedPath!==path)return <div className="loading-screen">Đang kiểm tra đăng nhập...</div>;
  return <>{children}</>;
}
