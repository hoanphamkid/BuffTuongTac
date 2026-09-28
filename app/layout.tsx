import './globals.css';
import {CurrentUserProvider} from '@/providers/CurrentUserProvider';
import {AppShell} from './_components/AppShell';
export const metadata={title:'KID Social - Bảng điều khiển dịch vụ'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><CurrentUserProvider><AppShell>{children}</AppShell></CurrentUserProvider></body></html>}
