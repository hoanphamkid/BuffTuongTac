'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';

export type CurrentUser={id:string;username:string;fullName:string;email:string;avatar:string|null;balance:string;totalDeposited:string;level:string;createdAt:string};
type Ctx={user:CurrentUser|null;loading:boolean;error:string;refreshUser:(silent?:boolean)=>Promise<void>;clearUser:()=>void};
const UserContext=createContext<Ctx>({user:null,loading:true,error:'',refreshUser:async()=>{},clearUser:()=>{}});

export function CurrentUserProvider({children}:{children:React.ReactNode}){
 const localPreview=process.env.NEXT_PUBLIC_LOCAL_PREVIEW==='true';
 const previewUser:CurrentUser={id:'local-preview',username:'preview',fullName:'Local Preview',email:'preview@local.test',avatar:null,balance:'7179',totalDeposited:'0',level:'Thành viên',createdAt:new Date().toISOString()};
 const [user,setUser]=useState<CurrentUser|null>(localPreview?previewUser:null);const [loading,setLoading]=useState(!localPreview);const [error,setError]=useState('');
 const refreshUser=useCallback(async(silent=false)=>{
  if(localPreview){setUser(previewUser);setLoading(false);return}
  if(!silent)setLoading(true);
  try{
   const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);
   const r=await fetch('/api/me',{signal:c.signal,cache:'no-store'});clearTimeout(t);
   if(r.status===401){setUser(null);setError('');return}
   const d=await r.json();if(!r.ok)throw new Error(d.error);setUser(d.data);setError('');
  }catch(e){if(!silent)setError(e instanceof Error&&e.name==='AbortError'?'Hết thời gian tải tài khoản':e instanceof Error?e.message:'Không thể tải tài khoản')}
  finally{if(!silent)setLoading(false)}
 },[]);
 useEffect(()=>{refreshUser()},[refreshUser]);
 useEffect(()=>{
  const sync=()=>{if(document.visibilityState==='visible')refreshUser(true)};
  const timer=window.setInterval(sync,10000);
  window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);
  return()=>{window.clearInterval(timer);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync)};
 },[refreshUser]);
 return <UserContext.Provider value={{user,loading,error,refreshUser,clearUser:()=>setUser(null)}}>{children}</UserContext.Provider>;
}
export const useCurrentUser=()=>useContext(UserContext);
