'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function LocalMenuEnhancements() {
  const router = useRouter();

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.shell > aside > .user'));
    const apiButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.shell > aside > nav button'))
      .filter((button) => button.textContent?.includes('API SMM V2'));
    const linkInput = document.querySelector<HTMLInputElement>('.order .field input');
    const orderButton = document.querySelector<HTMLButtonElement>('.order .primary');
    const linkField = linkInput?.closest('.field');
    const openAccount = () => router.push('/account');
    const focusLinkIfEmpty = () => {
      if (!linkInput || linkInput.value.trim()) return;
      requestAnimationFrame(() => {
        linkInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        linkInput.focus();
      });
    };
    cards.forEach((card) => {
      card.addEventListener('click', openAccount);
      card.addEventListener('keydown', openAccount);
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
    });
    apiButtons.forEach((button) => { button.hidden = true; });
    orderButton?.addEventListener('click', focusLinkIfEmpty);
    const moveNotice = () => {
      const notice = document.querySelector<HTMLElement>('.order .notice');
      if (notice && linkField && !linkField.contains(notice)) linkField.appendChild(notice);
    };
    const updateMaintenance = () => {
      const platform = document.querySelector('.platform-trigger')?.textContent?.toLowerCase() || '';
      const service = document.querySelector('.grid2 select option:checked')?.textContent?.toLowerCase() || '';
      const maintenance = platform.includes('youtube') && (service.includes('theo dõi') || service.includes('followers'));
      document.querySelectorAll<HTMLElement>('.servers .server').forEach((server) => {
        server.classList.toggle('maintenance', maintenance);
        const input = server.querySelector<HTMLInputElement>('input[type="radio"]');
        const status = server.querySelector<HTMLElement>('em');
        if (input) input.disabled = maintenance;
        const nextStatus = maintenance ? 'Đang bảo trì' : 'Đang hoạt động';
        if (status && status.textContent !== nextStatus) status.textContent = nextStatus;
      });
    };
    updateMaintenance();
    const maintenanceObserver = new MutationObserver(updateMaintenance);
    const order = document.querySelector('.order');
    if (order) maintenanceObserver.observe(order, { childList: true, subtree: true, characterData: true });
    moveNotice();
    const noticeObserver = new MutationObserver(moveNotice);
    const orderCard = document.querySelector('.order');
    if (orderCard) noticeObserver.observe(orderCard, { childList: true, subtree: true });
    return () => {
      cards.forEach((card) => {
        card.removeEventListener('click', openAccount);
        card.removeEventListener('keydown', openAccount);
      });
      apiButtons.forEach((button) => { button.hidden = false; });
      orderButton?.removeEventListener('click', focusLinkIfEmpty);
      noticeObserver.disconnect();
      maintenanceObserver.disconnect();
    };
  }, [router]);

  return null;
}
