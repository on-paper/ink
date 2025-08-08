"use client";

import { useEffect, useState } from "react";
import { getTimeAgo } from "~/utils/formatTime";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { loadDrafts, deleteDraft, type Draft } from "~/utils/drafts";

export function DraftsModal({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (draft: Draft) => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const refresh = () => setDrafts(loadDrafts());

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const handleDelete = (id: string) => {
    deleteDraft(id);
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Drafts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-auto">
          {drafts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No drafts yet</div>
          ) : (
            drafts.map((d) => {
              const firstLine = d.content.split(/\r?\n/)[0]?.slice(0, 120) || "(empty)";
              return (
                <div key={d.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      onSelect(d);
                      onOpenChange(false);
                    }}
                  >
                    <div className="text-sm font-medium truncate">{firstLine || "(no content)"}</div>
                    <div className="text-xs text-muted-foreground">Created {getTimeAgo(d.createdAt)}</div>
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                    Delete
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}