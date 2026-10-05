'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearOrderDraft, emptyOrderDraft, OrderDraft, readOrderDraft, writeOrderDraft } from '@/lib/order-draft';

export function useOrderDraft(userId?: string) {
  const [draft, setDraft] = useState<OrderDraft>(emptyOrderDraft);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const current = useRef<OrderDraft>(emptyOrderDraft);

  useEffect(() => {
    let restored = { ...emptyOrderDraft };
    if (userId) {
      try { restored = readOrderDraft(window.sessionStorage, userId) || restored; } catch { /* Private browsing can block storage. */ }
    }
    current.current = restored;
    setDraft(restored);
    setLoadedFor(userId || null);
  }, [userId]);

  const updateDraft = useCallback((changes: Partial<OrderDraft>) => {
    if (!userId || loadedFor !== userId) return;
    const next = { ...current.current, ...changes };
    current.current = next;
    setDraft(next);
    // Save during the input event, before a navigation can unmount the form.
    try { writeOrderDraft(window.sessionStorage, userId, next); } catch { /* Keep editing without storage. */ }
  }, [userId, loadedFor]);

  const resetDraft = useCallback(() => {
    current.current = { ...emptyOrderDraft };
    setDraft(current.current);
    if (userId) {
      try { clearOrderDraft(window.sessionStorage, userId); } catch { /* Storage can be blocked. */ }
    }
  }, [userId]);

  return { draft, updateDraft, resetDraft, ready: Boolean(userId && loadedFor === userId) };
}
