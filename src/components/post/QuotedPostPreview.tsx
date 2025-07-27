import type { Post } from "@cartel-sh/ui";
import { UserAvatar } from "../user/UserAvatar";
import { getPostMediaContent, getPostTextContent } from "./PostMetadataView";

interface QuotedPostPreviewProps {
  quotedPost: Post;
}

export function QuotedPostPreview({ quotedPost }: QuotedPostPreviewProps) {
  const mediaContent = getPostMediaContent(quotedPost.metadata, quotedPost.id, quotedPost.author.username);

  return (
    <div className="p-3 mt-2 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-4">
          <UserAvatar user={quotedPost.author} link={false} card={false} />
        </div>
        <span className="text-sm text-bold text-muted-foreground">{quotedPost.author.username}</span>
      </div>
      <p className="text-sm line-clamp-3">{getPostTextContent(quotedPost.metadata, quotedPost.mentions, false)}</p>
      {mediaContent && (
        <div className="max-w-full">
          <div className="[&_img]:max-h-48 [&_img]:object-cover [&_video]:max-h-48 [&_.fullscreen-video_video]:!max-h-none [&_.fullscreen-video]:!max-h-none [&_.fullscreen-video]:!h-screen [&_.image-grid]:gap-1 [&_.image-grid_img]:max-h-32 [&>div:not(.fullscreen-video)]:!h-fit [&_.h-full:not(.fullscreen-video)]:!h-fit [&_.fixed]:!max-h-none [&_.fixed]:!h-auto">
            {mediaContent}
          </div>
        </div>
      )}
    </div>
  );
}
