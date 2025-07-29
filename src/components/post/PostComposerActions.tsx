import { ImageIcon, SmileIcon } from "lucide-react";
import { useState } from "react";
import { EmojiPicker } from "../emoji/EmojiPicker";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface PostComposerActionsProps {
  onImageClick: () => void;
  onEmojiClick: (emoji: any) => void;
}

export function PostComposerActions({ onImageClick, onEmojiClick }: PostComposerActionsProps) {
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleEmojiClick = (emoji: any) => {
    console.log("Emoji clicked:", emoji);
    onEmojiClick(emoji);
    // Keep the picker open so users can add multiple emojis
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full w-8 h-8 hover:bg-transparent button-hover-bg button-hover-bg-equal"
        onClick={onImageClick}
      >
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </Button>
      <DropdownMenu open={isEmojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 hover:bg-transparent button-hover-bg button-hover-bg-equal"
          >
            <SmileIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="p-0"
          onInteractOutside={(_event) => {
            // Close when clicking outside
            setEmojiPickerOpen(false);
          }}
          onPointerDownOutside={(_event) => {
            // Also handle pointer down outside for immediate response
            setEmojiPickerOpen(false);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
