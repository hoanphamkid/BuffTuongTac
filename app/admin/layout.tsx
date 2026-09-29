import './admin.css';
import './admin-mobile.css';
import './admin-refresh.css';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {AdminLayout} from '@/components/admin/AdminLayout';

export default async function Layout({children}:{children:React.ReactNode}){
 const user=await currentUser();
 if(!user)redirect('/login');
 if(user.role!=='ADMIN')redirect('/');
 return <AdminLayout>{children}</AdminLayout>;
}
