import { z } from 'zod';

const draftSchema = z.object({
  platformId: z.string().max(512),
  serviceId: z.string().max(512),
  serverId: z.string().max(512),
  link: z.string().max(8192),
  quantity: z.number().finite().min(0).max(1000000000),
  comments: z.string().max(1000000),
  reaction: z.string().max(30),
  trialMode: z.boolean(),
});

export type OrderDraft = z.infer<typeof draftSchema>;
export const emptyOrderDraft: OrderDraft = {
  platformId: '', serviceId: '', serverId: '', link: '', quantity: 1000,
  comments: '', reaction: '', trialMode: false,
};
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const draftKey = (userId: string) => `kid-social:order-draft:v1:${userId}`;
const maxAge = 24 * 60 * 60 * 1000;

export function readOrderDraft(storage: DraftStorage, userId: string, now = Date.now()): OrderDraft | null {
  try {
    const saved = JSON.parse(storage.getItem(draftKey(userId)) || 'null');
    if (!saved || saved.version !== 1 || !Number.isFinite(saved.savedAt) || now - saved.savedAt > maxAge || saved.savedAt > now) return null;
    const result = draftSchema.safeParse(saved.draft);
    return result.success ? result.data : null;
  } catch { return null; }
}

export function writeOrderDraft(storage: DraftStorage, userId: string, draft: OrderDraft, now = Date.now()) {
  try {
    // Only form fields are saved, never a trial KEY or account credentials.
    storage.setItem(draftKey(userId), JSON.stringify({ version: 1, savedAt: now, draft: draftSchema.parse(draft) }));
  } catch { /* The form still works when storage is unavailable or full. */ }
}

export function clearOrderDraft(storage: DraftStorage, userId: string) {
  try { storage.removeItem(draftKey(userId)); } catch { /* Storage can be blocked. */ }
}
