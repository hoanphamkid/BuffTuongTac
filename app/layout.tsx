import './globals.css'; import {CurrentUserProvider} from '@/providers/CurrentUserProvider';
export const metadata={title:'SMM Việt - Bảng điều khiển dịch vụ'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><CurrentUserProvider>{children}</CurrentUserProvider></body></html>}
