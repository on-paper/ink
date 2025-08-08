"use client";

export type Draft = {
  id: string;
  content: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

const STORAGE_KEY = "paper.drafts.v1";

function readAll(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Draft[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d) => typeof d?.id === "string" && typeof d?.content === "string")
      .map((d) => ({
        id: d.id,
        content: d.content,
        createdAt: typeof d.createdAt === "number" ? d.createdAt : Date.now(),
        updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function writeAll(drafts: Draft[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // ignore quota errors
  }
}

export function loadDrafts(): Draft[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDraftById(id: string): Draft | undefined {
  return readAll().find((d) => d.id === id);
}

export function upsertDraft(input: { id?: string; content: string }): Draft {
  const now = Date.now();
  const drafts = readAll();
  let draft: Draft;
  if (input.id) {
    const existingIndex = drafts.findIndex((d) => d.id === input.id);
    if (existingIndex >= 0) {
      const existing = drafts[existingIndex];
      draft = {
        ...existing,
        content: input.content,
        updatedAt: now,
      };
      drafts[existingIndex] = draft;
    } else {
      draft = { id: input.id, content: input.content, createdAt: now, updatedAt: now };
      drafts.unshift(draft);
    }
  } else {
    draft = { id: `d_${now}_${Math.random().toString(36).slice(2, 8)}`, content: input.content, createdAt: now, updatedAt: now };
    drafts.unshift(draft);
  }
  // Remove empty drafts defensively
  const filtered = drafts.filter((d) => d.content.trim().length > 0);
  writeAll(filtered);
  return draft;
}

export function deleteDraft(id: string): void {
  const drafts = readAll();
  const next = drafts.filter((d) => d.id !== id);
  writeAll(next);
}

export function clearAllDrafts(): void {
  writeAll([]);
}