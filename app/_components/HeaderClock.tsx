'use client';

import { useEffect, useState } from 'react';
import styles from './header-clock.module.css';

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
});

export function HeaderClock({ children }: { children?: React.ReactNode }) {
  // Start with a stable placeholder so server/client rendering cannot disagree.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    const sync = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', sync);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', sync); };
  }, []);

  return (
    <div className={styles.headerInfo}>
      <div className={styles.account}>{children}</div>
      <div className={styles.clock} title="Giờ Việt Nam (UTC+7)">
        <svg className={styles.icon} width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
        <time dateTime={now?.toISOString()} aria-label={now ? `Giờ Việt Nam ${timeFormatter.format(now)}, ngày ${dateFormatter.format(now)}` : 'Đang tải giờ Việt Nam'}>
          <strong className={styles.time}>{now ? timeFormatter.format(now) : '--:--:--'}</strong>
          <span className={styles.date}>{now ? dateFormatter.format(now) : '--/--/----'}<span className={styles.zone}>UTC+7</span></span>
        </time>
      </div>
    </div>
  );
}
