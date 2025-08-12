import { atom } from "jotai";
import { atomFamily, atomWithStorage } from "jotai/utils";

export type PostDraft = {
  id: string;
  content: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  context?: {
    community?: string;
    replyingToId?: string;
    quotedPostId?: string;
  };
};

const STORAGE_KEY_PREFIX = "postDrafts";

function getStorageKey(userId?: string): string {
  const safeUserId = userId || "anonymous";
  return `${STORAGE_KEY_PREFIX}.${safeUserId}`;
}

export const draftsAtomFamily = atomFamily((userId?: string) =>
  atomWithStorage<PostDraft[]>(getStorageKey(userId), []),
);

export const upsertDraftAtomFamily = atomFamily((userId?: string) =>
  atom(null, (get, set, draft: PostDraft) => {
    const drafts = get(draftsAtomFamily(userId));
    const existingIndex = drafts.findIndex((d) => d.id === draft.id);
    const nextDrafts = existingIndex >= 0 ? drafts.map((d) => (d.id === draft.id ? draft : d)) : [draft, ...drafts];
    set(draftsAtomFamily(userId), nextDrafts);
  }),
);

export const deleteDraftAtomFamily = atomFamily((userId?: string) =>
  atom(null, (get, set, draftId: string) => {
    const drafts = get(draftsAtomFamily(userId));
    set(
      draftsAtomFamily(userId),
      drafts.filter((d) => d.id !== draftId),
    );
  }),
);

export const clearDraftsAtomFamily = atomFamily((userId?: string) =>
  atom(null, (_get, set) => {
    set(draftsAtomFamily(userId), []);
  }),
);

export function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
