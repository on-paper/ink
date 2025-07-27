import type { Post } from "@cartel-sh/ui";
import { Repeat2Icon } from "lucide-react";
import Link from "~/components/Link";
import { getTimeAgo } from "~/utils/formatTime";
import { TimeElapsedSince } from "../TimeLabel";

export const RepostInfo = ({ post }: { post: Post }) => {
  if (!post.isRepost || !post.repostedBy) return null;

  const username = post.repostedBy.username;

  const getRepostTimeText = () => {
    if (!post.repostedAt) return "";
    const dateObj = typeof post.repostedAt === "string" ? new Date(post.repostedAt) : post.repostedAt;
    const timeAgo = getTimeAgo(dateObj);

    // Add "ago" for time-based values, but not for "just now" or absolute dates
    if (timeAgo === "just now") return timeAgo;
    if (timeAgo.match(/^\d+[mhdw]$/)) return `${timeAgo} ago`;
    if (timeAgo.match(/^\d+(mo|y)$/)) return `${timeAgo} ago`;

    return <TimeElapsedSince date={post.repostedAt} />;
  };

  return (
    <Link
      href={`/u/${username}`}
      className="flex flex-row items-center gap-1 -mt-2 text-xs font-light leading-3 text-muted-foreground"
    >
      <Repeat2Icon size={14} className="shrink-0 text-muted-foreground" />
      <span className="pb-0.5">
        {username} reposted {getRepostTimeText()}
      </span>
    </Link>
  );
};
