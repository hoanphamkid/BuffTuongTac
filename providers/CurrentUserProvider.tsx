'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
export type CurrentUser={id:string;username:string;fullName:string;email:string;avatar:string|null;balance:string;totalDeposited:string;level:string;createdAt:string};
type Ctx={user:CurrentUser|null;loading:boolean;error:string;refreshUser:()=>Promise<void>;clearUser:()=>void};
const UserContext=createContext<Ctx>({user:null,loading:true,error:'',refreshUser:async()=>{},clearUser:()=>{}});
export function CurrentUserProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<CurrentUser|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const refreshUser=useCallback(async()=>{setLoading(true);try{const c=new AbortController();const t=setTimeout(()=>c.abort(),8000);const r=await fetch('/api/me',{signal:c.signal});clearTimeout(t);if(r.status===401){setUser(null);setError('');return}const d=await r.json();if(!r.ok)throw new Error(d.error);setUser(d.data);setError('')}catch(e){setUser(null);setError(e instanceof Error&&e.name==='AbortError'?'Hết thời gian tải tài khoản':e instanceof Error?e.message:'Không thể tải tài khoản')}finally{setLoading(false)}},[]);
 useEffect(()=>{refreshUser()},[refreshUser]);
 return <UserContext.Provider value={{user,loading,error,refreshUser,clearUser:()=>setUser(null)}}>{children}</UserContext.Provider>;
}
export const useCurrentUser=()=>useContext(UserContext);
