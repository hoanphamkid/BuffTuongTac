'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/providers/CurrentUserProvider';

export function MobileWallet() {
  const { user, loading } = useCurrentUser();
  if (!user && !loading) return null;

  return (
    <section className="customer-mobile-wallet" aria-label="Số dư tài khoản">
      <span className="customer-wallet-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h15V8H5a2 2 0 0 1 0-4M20 12h-5v4h5" />
        </svg>
      </span>
      <div className="customer-wallet-value">
        <small>Số dư khả dụng</small>
        <strong>{loading ? 'Đang tải...' : new Intl.NumberFormat('vi-VN').format(Number(user?.balance) || 0) + 'đ'}</strong>
      </div>
      <Link href="/add-funds" className="customer-wallet-topup"><span aria-hidden="true">＋</span> Nạp tiền</Link>
    </section>
  );
}
