import type { Post } from "@cartel-sh/ui";
import { PostView } from "./PostView";

export const PostComments = ({ post, level = 1 }: { post: Post; level?: number }) => {
  if (!post.comments || post.comments.length === 0) {
    return null;
  }

  const comments = post.comments.filter((comment) => {
    const isMuted = comment.author.actions?.muted;
    const isBlocked = comment.author.actions?.blocked;
    return !isMuted && !isBlocked;
  });

  return (
    <div className="w-full flex flex-col justify-center gap-2 text-xs sm:text-sm">
      <ul className="flex flex-col gap-1">
        {comments.map((comment, index) => (
          <li key={comment.id}>
            <PostView
              item={comment}
              settings={{
                level,
                isComment: true,
                showBadges: true,
                isLastComment: index === comments.length - 1,
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
