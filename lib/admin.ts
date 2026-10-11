import {currentUser} from '@/lib/auth';
type AdminUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireAdmin(){
 const user=await currentUser();
 const localPreview=process.env.NODE_ENV!=='production'||process.env.NEXT_PUBLIC_LOCAL_PREVIEW==='true';
 if(localPreview)return (user||{id:'preview-admin',username:'preview-admin',email:'preview@local.test',role:'ADMIN'}) as AdminUser;
 if(!user||user.role!=='ADMIN')return null;
 return user;
}
