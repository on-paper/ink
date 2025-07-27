import type { Post } from "@cartel-sh/ui";
import { ReplyIcon } from "lucide-react";
import Link from "~/components/Link";

export const ReplyInfo = ({ post }: { post: Post }) => {
  const username = post.reply?.author?.username;
  let content = "";
  if (post?.reply?.metadata && "content" in post.reply.metadata) {
    content = post.reply.metadata.content.substring(0, 100);
  }

  const id = post.reply?.id;

  if (!post?.reply) return null;

  return (
    <Link
      href={`/p/${id ?? ""}`}
      className="flex flex-row items-center gap-1 -mt-2 text-xs font-light leading-3 text-muted-foreground"
    >
      <ReplyIcon size={14} className="shrink-0 scale-x-[-1] transform text-muted-foreground" />
      <span className="pb-0.5">@{username}:</span>
      <span className="truncate pb-0.5">{content}</span>
    </Link>
  );
};
