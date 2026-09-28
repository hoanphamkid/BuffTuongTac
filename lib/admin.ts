import {currentUser} from '@/lib/auth';
export async function requireAdmin(){const user=await currentUser();if(!user||user.role!=='ADMIN')return null;return user}
