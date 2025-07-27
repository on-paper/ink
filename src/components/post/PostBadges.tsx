import type { Post } from "@cartel-sh/ui";
import { Edit2Icon } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function EditedIndicator({ post }: { post: Post }) {
  const lastUpdated = post.updatedAt ? post.updatedAt.toLocaleString() : post.createdAt.toLocaleString();
  const tooltipText = `last updated at ${lastUpdated}`;

  if (post.createdAt.toUTCString() === post.updatedAt.toUTCString()) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="w-10 h-6 flex flex-row gap-1 leading-3 ">
            <Edit2Icon size={14} className="shrink-0 scale-x-[-1] transform" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
