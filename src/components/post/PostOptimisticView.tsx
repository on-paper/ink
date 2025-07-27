import type { Post, User } from "@cartel-sh/ui";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { UserAvatar } from "../user/UserAvatar";
import { ReactionsList } from "./PostReactions";
import { PostStateProvider } from "./PostStateContext";

export const PostOptimisticView = ({ author, isComment = false }: { author: User; isComment?: boolean }) => {
  // Mock post object with zero reactions
  const mockPost = {
    id: "optimistic",
    author,
    reactions: {
      Like: 0,
      Repost: 0,
      Comment: 0,
      Quote: 0,
      Collect: 0,
      upvotes: 0,
      isUpvoted: false,
      isReposted: false,
      isCollected: false,
      canRepost: true,
      canQuote: true,
    },
    createdAt: new Date(),
    metadata: {},
    __typename: "Post" as const,
    platform: "lens" as const,
    comments: [],
  } as Post;

  return (
    <Card className="duration-300 transition-all z-20 opacity-60">
      <CardContent className={`flex flex-row p-4 ${isComment ? "gap-2" : "gap-4"}`}>
        <span className="min-h-full flex flex-col justify-start items-center relative">
          <div className={`shrink-0 z-20 grow-0 rounded-full ${isComment ? "w-6 h-6" : "w-10 h-10"}`}>
            <UserAvatar user={author} />
          </div>
        </span>
        <div className="flex w-3/4 shrink group max-w-2xl grow flex-col place-content-start">
          <div className="flex h-5 flex-row items-center place-items-center gap-2 text-xs font-light leading-4 text-base-content sm:text-sm">
            <span className="font-bold w-fit">{author.username}</span>
            <span className="text-muted-foreground">just now</span>
          </div>
          <Skeleton className="h-4 w-full mt-2" />

          <PostStateProvider post={mockPost}>
            <ReactionsList post={mockPost} isComment={isComment} />
          </PostStateProvider>
        </div>
      </CardContent>
    </Card>
  );
};
