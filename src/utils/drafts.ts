export type PostDraft = {
  id: string;
  content: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  context?: {
    community?: string;
    feed?: string;
    replyingToId?: string;
    quotedPostId?: string;
  };
};

const STORAGE_KEY_PREFIX = "postDrafts";

function getStorageKey(userId: string | undefined): string {
  const safeUserId = userId || "anonymous";
  return `${STORAGE_KEY_PREFIX}.${safeUserId}`;
}

export function loadDrafts(userId?: string): PostDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PostDraft[];
    return [];
  } catch {
    return [];
  }
}

export function saveDrafts(userId: string | undefined, drafts: PostDraft[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(drafts));
  } catch {
    // ignore quota errors
  }
}

export function upsertDraft(userId: string | undefined, draft: PostDraft): void {
  const drafts = loadDrafts(userId);
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    drafts[idx] = draft;
  } else {
    drafts.unshift(draft);
  }
  saveDrafts(userId, drafts);
}

export function deleteDraft(userId: string | undefined, draftId: string): void {
  const drafts = loadDrafts(userId).filter((d) => d.id !== draftId);
  saveDrafts(userId, drafts);
}

export function getDraft(userId: string | undefined, draftId: string): PostDraft | undefined {
  return loadDrafts(userId).find((d) => d.id === draftId);
}

export function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function deleteMostRecentDraft(userId?: string): void {
  const drafts = loadDrafts(userId);
  if (drafts.length > 0) {
    deleteDraft(userId, drafts[0].id);
  }
}