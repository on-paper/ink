"use client";

import { CommunityHeader } from "~/components/communities/CommunityHeader";
import { CommunityNavigation } from "~/components/communities/CommunityNavigation";
import { Feed } from "~/components/Feed";
import { FeedSuspense } from "~/components/FeedSuspense";
import PostComposer from "~/components/post/PostComposer";
import { PostView } from "~/components/post/PostView";
import { Card } from "~/components/ui/card";
import { useUser } from "~/components/user/UserContext";
import { useCommunity } from "~/hooks/useCommunity";

interface CommunityPageProps {
  params: {
    community: string;
  };
}

export default function CommunityPage({ params }: CommunityPageProps) {
  const { data: community, isLoading, error } = useCommunity(params.community);
  const { user } = useUser();

  if (isLoading) {
    return (
      <div className="z-[30] p-4 py-0">
        <div className="pt-4">
          <FeedSuspense />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="z-[30] p-4 py-0">
        <div className="pt-4">
          <div className="text-center text-muted-foreground">Community not found</div>
        </div>
      </div>
    );
  }

  const channelId = community.address; // The community address is the channel ID
  const endpoint = `/api/posts?channelId=${channelId}`;

  return (
    <div className="z-[30] p-4 py-0">
      <div className="pt-4">
        <CommunityHeader community={community} />
        <CommunityNavigation communityAddress={params.community} />

        {user && (
          <div className="">
            {community.canPost && !community.isBanned && (
              <Card className="p-4">
                <PostComposer user={user} feed={channelId} community={params.community} />
              </Card>
            )}
          </div>
        )}
        <Feed ItemView={PostView} endpoint={endpoint} />
      </div>
    </div>
  );
}
