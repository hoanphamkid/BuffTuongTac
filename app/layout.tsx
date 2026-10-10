import './globals.css';import './mobile-sidebar.css';import {CurrentUserProvider} from '@/providers/CurrentUserProvider';import {AppShell} from './_components/AppShell';import {AuthGate} from './_components/AuthGate';import {ZaloButton} from './_components/ZaloButton';import {MobileSidebarToggle} from './_components/MobileSidebarToggle';
import {BrandNavigation} from './_components/BrandNavigation';
import './responsive.css';import './theme-overrides.css';
import './customer-theme.css';
import {WelcomeNotice} from '@/components/auth/WelcomeNotice';
import {LocalMenuEnhancements} from './_components/LocalMenuEnhancements';
import {NotificationBell} from '@/components/notifications/NotificationBell';
import {Analytics} from '@vercel/analytics/next';
export const metadata={title:'KID Social - Bảng điều khiển dịch vụ'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><CurrentUserProvider><AuthGate><AppShell>{children}</AppShell></AuthGate><LocalMenuEnhancements/><WelcomeNotice/><BrandNavigation/><MobileSidebarToggle/><ZaloButton/><NotificationBell/><Analytics/></CurrentUserProvider></body></html>}
