import './admin.css';
import './admin-mobile.css';
import './admin-refresh.css';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {AdminLayout} from '@/components/admin/AdminLayout';

export default async function Layout({children}:{children:React.ReactNode}){
 const localPreview=process.env.NODE_ENV!=='production'||process.env.NEXT_PUBLIC_LOCAL_PREVIEW==='true';
 const user=await currentUser();
 if(!localPreview&&!user)redirect('/login');
 if(!localPreview&&user?.role!=='ADMIN')redirect('/');
 return <AdminLayout admin={{username:user?.username||'preview-admin',email:user?.email||'preview@local.test'}}>{children}</AdminLayout>;
}
