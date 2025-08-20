import type { Post } from "@cartel-sh/ui";
import { UserAvatar } from "../user/UserAvatar";
import { getPostContent } from "./PostMetadataView";

interface QuotedPostPreviewProps {
  quotedPost: Post;
}

export function PostQuotePreview({ quotedPost }: QuotedPostPreviewProps) {
  return (
    <div className="p-3 mt-2 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-4">
          <UserAvatar user={quotedPost.author} link={false} card={false} />
        </div>
        <span className="text-sm text-bold text-muted-foreground">{quotedPost.author.username}</span>
      </div>
      <p className="text-sm line-clamp-3">{getPostContent(quotedPost.metadata, quotedPost.mentions, false)}</p>
    </div>
  );
}
