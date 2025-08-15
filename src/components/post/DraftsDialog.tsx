"use client";

import { ChevronLeft, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  deleteDraftAtomFamily,
  draftsAtomFamily,
  type PostDraft,
} from "~/atoms/drafts";
import { formatDate } from "~/utils/formatDate";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import Markdown from "../Markdown";

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
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const drafts = useAtomValue(draftsAtomFamily(draftsUserId));
  const deleteDraftAtom = useSetAtom(deleteDraftAtomFamily(draftsUserId));

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setPreviewDraftId(null);
      setShowMobileDetail(false);
    }
  };

  const handleMobileDraftSelect = (draftId: string) => {
    setPreviewDraftId(draftId);
    setShowMobileDetail(true);
  };

  const handleMobileBack = () => {
    setShowMobileDetail(false);
    setPreviewDraftId(null);
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
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    const cleanText = text.trim().replace(/\s+/g, ' ');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength).trim() + '...';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-2 overflow-hidden">
        <DialogHeader className="sm:hidden">
          <DialogTitle>
            {showMobileDetail && previewDraftId ? "Draft Preview" : "Drafts"}
          </DialogTitle>
        </DialogHeader>

        <div className="h-[60vh]">
          {/* Desktop: Grid layout with fixed proportions */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_2px_2fr] sm:gap-4 w-full h-full">
            {/* Drafts List - Fixed 1fr width */}
            <div className="overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 pr-3">
                  {drafts.length === 0 && (
                    <div className="text-sm text-muted-foreground">No drafts yet</div>
                  )}
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      className={`flex items-center gap-2 p-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${previewDraftId === d.id ? "bg-accent" : ""
                        }`}
                      onClick={() => setPreviewDraftId(d.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDate(new Date(d.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {truncateText(d.content) || "(empty)"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="bg-border"></div>

            {/* Desktop Draft Preview - Fixed 2fr width */}
            <div className="flex flex-col min-w-0">
              {previewDraftId ? (
                (() => {
                  const draft = drafts.find((d) => d.id === previewDraftId);
                  if (!draft) return <div className="text-muted-foreground">Draft not found</div>;

                  return (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-muted-foreground">
                          {getWordCount(draft.content)} words
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="w-9 h-9 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleLoadDraft(draft.id)}
                            size="sm"
                            className="px-5"
                          >
                            Write
                          </Button>
                        </div>
                      </div>

                      <ScrollArea className="flex-1 border rounded-md">
                        <div className="whitespace-pre-wrap break-words text-sm/tight sm:text-base/tight p-2 min-w-0 max-w-full" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                          <Markdown content={draft.content} />
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })()
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a draft to preview
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Stack layout with navigation */}
          <div className="sm:hidden w-full h-full">
            {!showMobileDetail ? (
              /* Mobile Drafts List */
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2">
                  {drafts.length === 0 && (
                    <div className="text-sm text-muted-foreground p-4 text-center">No drafts yet</div>
                  )}
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-2 p-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleMobileDraftSelect(d.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDate(new Date(d.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {truncateText(d.content) || "(empty)"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              /* Mobile Draft Detail */
              previewDraftId && (() => {
                const draft = drafts.find((d) => d.id === previewDraftId);
                if (!draft) return <div className="text-muted-foreground">Draft not found</div>;

                return (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMobileBack}
                        className="p-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleDeleteDraft(draft.id);
                            handleMobileBack();
                          }}
                          className="w-9 h-9 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleLoadDraft(draft.id)}
                          size="sm"
                          className="px-5"
                        >
                          Write
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-center mb-2">
                      <div className="text-xs text-muted-foreground">
                        {getWordCount(draft.content)} words
                      </div>
                    </div>

                    <ScrollArea className="flex-1 border rounded-md">
                      <div className="whitespace-pre-wrap break-words text-sm/tight sm:text-base/tight p-2 min-w-0 max-w-full" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        <Markdown content={draft.content} />
                      </div>
                    </ScrollArea>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
