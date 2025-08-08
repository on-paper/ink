"use client";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

export function DraftCloseConfirm({
  open,
  onOpenChange,
  onSave,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Save draft?</DialogTitle>
          <p className="text-sm text-muted-foreground">You have unsent changes. Save as a draft or discard?</p>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 p-3">
          <Button variant="ghost" className="flex-1" onClick={onDiscard}>
            Discard
          </Button>
          <Button className="flex-1" onClick={onSave}>
            Save draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}