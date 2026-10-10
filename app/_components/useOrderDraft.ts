'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearOrderDraft, emptyOrderDraft, OrderDraft, readOrderDraft, writeOrderDraft } from '@/lib/order-draft';

export function useOrderDraft(userId?: string) {
  const [draft, setDraft] = useState<OrderDraft>(emptyOrderDraft);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const current = useRef<OrderDraft>(emptyOrderDraft);
  const storageKey = userId || 'guest';

  useEffect(() => {
    let restored = { ...emptyOrderDraft };
    try {
      const saved = readOrderDraft(window.sessionStorage, storageKey);
      restored = saved || restored;
      if (userId && !saved) {
        const guestDraft = readOrderDraft(window.sessionStorage, 'guest');
        if (guestDraft) {
          restored = guestDraft;
          writeOrderDraft(window.sessionStorage, userId, guestDraft);
          clearOrderDraft(window.sessionStorage, 'guest');
        }
      }
    } catch { /* Private browsing can block storage. */ }
    current.current = restored;
    setDraft(restored);
    setLoadedFor(storageKey);
  }, [storageKey, userId]);

  const updateDraft = useCallback((changes: Partial<OrderDraft>) => {
    if (loadedFor !== storageKey) return;
    const next = { ...current.current, ...changes };
    current.current = next;
    setDraft(next);
    // Save during the input event, before a navigation can unmount the form.
    try { writeOrderDraft(window.sessionStorage, storageKey, next); } catch { /* Keep editing without storage. */ }
  }, [storageKey, loadedFor]);

  const resetDraft = useCallback(() => {
    current.current = { ...emptyOrderDraft };
    setDraft(current.current);
    try { clearOrderDraft(window.sessionStorage, storageKey); } catch { /* Storage can be blocked. */ }
  }, [storageKey]);

  return { draft, updateDraft, resetDraft, ready: loadedFor === storageKey };
}
