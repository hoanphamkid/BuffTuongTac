import './globals.css';import './mobile-sidebar.css';import {CurrentUserProvider} from '@/providers/CurrentUserProvider';import {AppShell} from './_components/AppShell';import {AuthGate} from './_components/AuthGate';import {ZaloButton} from './_components/ZaloButton';import {MobileSidebarToggle} from './_components/MobileSidebarToggle';
import {BrandNavigation} from './_components/BrandNavigation';
import './responsive.css';
import {WelcomeNotice} from '@/components/auth/WelcomeNotice';
export const metadata={title:'KID Social - Bảng điều khiển dịch vụ'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><CurrentUserProvider><AuthGate><AppShell>{children}</AppShell></AuthGate><WelcomeNotice/><BrandNavigation/><MobileSidebarToggle/><ZaloButton/></CurrentUserProvider></body></html>}
