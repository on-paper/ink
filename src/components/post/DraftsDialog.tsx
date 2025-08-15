"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteDraftAtomFamily, draftsAtomFamily } from "~/atoms/drafts";
import { formatDate } from "~/utils/formatDate";
import Markdown from "../Markdown";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

interface DraftsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadDraft: (draftId: string) => void;
  currentDraftId?: string;
  draftsUserId?: string;
  onCurrentDraftChange?: (draftId: string | undefined, createdAt: number | null) => void;
}

export function DraftsDialog({
  isOpen,
  onOpenChange,
  onLoadDraft,
  currentDraftId,
  draftsUserId,
  onCurrentDraftChange,
}: DraftsDialogProps) {
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);

  const drafts = useAtomValue(draftsAtomFamily(draftsUserId));
  const deleteDraftAtom = useSetAtom(deleteDraftAtomFamily(draftsUserId));

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setPreviewDraftId(null);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    deleteDraftAtom(draftId);
    if (currentDraftId === draftId) {
      onCurrentDraftChange?.(undefined, null);
    }
    if (previewDraftId === draftId) {
      setPreviewDraftId(null);
    }
  };

  const handleLoadDraft = (draftId: string) => {
    onLoadDraft(draftId);
    handleOpenChange(false);
  };

  const getWordCount = (content: string) => {
    return content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] p-4">
        <div className="flex gap-2 h-[60vh]">
          {/* Left: Draft List - fixed width */}
          <div className="flex flex-col w-full sm:w-[300px] flex-shrink-0 overflow-hidden">
            <h3 className="text-sm font-medium mb-3">Your Drafts</h3>
            <ScrollArea className="flex-1 overflow-x-hidden">
              <div className="space-y-2 pr-4">
                {drafts.length === 0 && (
                  <div className="text-sm text-muted-foreground p-4 text-center">No drafts yet</div>
                )}
                {drafts.map((draft) => (
                  <Button
                    key={draft.id}
                    variant={previewDraftId === draft.id ? "secondary" : "ghost"}
                    className="w-full h-16 p-3 justify-start text-left overflow-hidden whitespace-normal max-w-full hover:scale-100 active:scale-100 data-[state=open]:scale-100"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
                        handleLoadDraft(draft.id);
                      } else {
                        setPreviewDraftId(draft.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-1 min-w-0 w-full overflow-hidden whitespace-normal">
                      <div className="text-xs text-muted-foreground truncate">
                        {formatDate(new Date(draft.createdAt), "MMM d, yyyy")}
                      </div>
                      <div className="text-sm line-clamp-2 leading-tight break-all overflow-hidden whitespace-normal">
                        {draft.content.trim() || "(empty)"}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Draft Preview - flexible */}
          <div className="hidden sm:flex flex-col flex-1 min-w-0 overflow-hidden">
            {previewDraftId ? (
              (() => {
                const draft = drafts.find((d) => d.id === previewDraftId);
                if (!draft) return <div className="text-muted-foreground">Draft not found</div>;

                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-muted-foreground">{getWordCount(draft.content)} words</div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleLoadDraft(draft.id)} size="sm" className="text-sm px-6">
                          Write
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 border rounded-md overflow-x-hidden">
                      <div
                        className="p-4 min-w-0 break-words"
                        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                      >
                        <Markdown content={draft.content} />
                      </div>
                    </ScrollArea>
                  </>
                );
              })()
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a draft to preview
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
