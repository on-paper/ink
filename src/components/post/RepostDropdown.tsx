"use client";

import type { Post } from "@cartel-sh/ui";
import { EditIcon, RefreshCwIcon, Repeat2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "~/components/user/UserContext";
import { usePostMutations } from "~/hooks/usePostMutations";
import { cn } from "~/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog, DialogContent } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import PostComposer from "./PostComposer";

interface RepostDropdownProps {
  post: Post;
  variant?: "post" | "comment";
  reactions: {
    reacted: boolean;
    count: number;
    canRepost: boolean;
    canQuote: boolean;
  };
}

export default function RepostDropdown({ post, variant = "post", reactions }: RepostDropdownProps) {
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const { requireAuth } = useUser();
  const { repost } = usePostMutations(post.id, post);

  const handleRepost = async () => {
    if (!reactions.canRepost) {
      toast.error("You cannot repost this post");
      return;
    }

    setDropdownOpen(false);
    repost();
  };

  const handleQuote = () => {
    if (!reactions.canQuote) {
      toast.error("You cannot quote this post");
      return;
    }
    setDropdownOpen(false);
    // Delay opening the dialog to ensure dropdown is fully closed
    setTimeout(() => {
      setShowQuoteDialog(true);
    }, 100);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={`border-0 px-0 place-content-center items-center flex flex-row min-w-[2.2rem] gap-1.5 sm:gap-2 md:gap-3 hover:bg-transparent hover:scale-105 active:scale-95 data-[state=open]:scale-95 button-hover-bg ${
              reactions.count > 0 ? "button-hover-bg-wide" : "button-hover-bg-equal"
            }`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <RefreshCwIcon
              size={variant === "post" ? 18 : 16}
              strokeWidth={reactions.reacted ? 3 : 2.3}
              stroke={reactions.reacted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              className="transition-all duration-200"
            />
            {reactions.count > 0 && (
              <span
                className={cn(
                  "text-xs font-bold transition-colors duration-200",
                  reactions.reacted ? "text-primary" : "text-muted-foreground",
                )}
              >
                {reactions.count}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => requireAuth(handleRepost)} className="gap-2">
            <Repeat2Icon size={18} strokeWidth={2} />
            <span>{reactions.reacted ? "Undo repost" : "Repost"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => requireAuth(handleQuote)} className="gap-2">
            <EditIcon size={18} strokeWidth={2} />
            <span>Quote</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <Card className="p-4">
            <PostComposer
              quotedPost={post}
              onCancel={() => setShowQuoteDialog(false)}
              onSuccess={(newPost) => {
                setShowQuoteDialog(false);
                if (newPost?.id && !newPost.id.startsWith("optimistic-")) {
                  router.push(`/p/${newPost.id}`);
                }
              }}
            />
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
