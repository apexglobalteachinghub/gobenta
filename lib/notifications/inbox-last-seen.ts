/** Dispatched in the same tab when the user opens the inbox (so badges refresh). */
export const INBOX_SEEN_EVENT = "gobenta:inbox-seen";

function storageKey(userId: string) {
  return `gobenta:inbox_last_opened_at:${userId}`;
}

export function getInboxLastOpenedAt(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(storageKey(userId));
}

/** Baseline so first-time users are not flooded with historical “unread” counts. */
export function ensureInboxLastOpenedBaseline(userId: string): void {
  if (typeof window === "undefined") return;
  const key = storageKey(userId);
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, new Date().toISOString());
  }
}

export function markInboxSeen(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), new Date().toISOString());
  window.dispatchEvent(new CustomEvent(INBOX_SEEN_EVENT));
}
