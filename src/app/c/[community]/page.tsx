"use client";

import { Feed } from "~/components/Feed";
import { FeedSuspense } from "~/components/FeedSuspense";
import { GroupHeader } from "~/components/groups/GroupHeader";
import { GroupNavigation } from "~/components/groups/GroupNavigation";
import PostComposer from "~/components/post/PostComposer";
import { PostView } from "~/components/post/PostView";
import { Card } from "~/components/ui/card";
import { useUser } from "~/components/user/UserContext";
import { useGroup } from "~/hooks/useGroup";

interface GroupPageProps {
  params: {
    community: string;
  };
}

export default function GroupPage({ params }: GroupPageProps) {
  const { data: group, isLoading, error } = useGroup(params.community);
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

  if (error || !group) {
    return (
      <div className="z-[30] p-4 py-0">
        <div className="pt-4">
          <div className="text-center text-muted-foreground">Group not found</div>
        </div>
      </div>
    );
  }

  const feedAddress = group.feed?.address;
  const endpoint = feedAddress ? `/api/posts?feed=${feedAddress}` : `/api/posts?group=${params.community}`;

  return (
    <div className="z-[30] p-4 py-0">
      <div className="pt-4">
        <GroupHeader group={group} />
        <GroupNavigation groupAddress={params.community} />

        {user && (
          <div className="">
            {group.canPost && !group.isBanned && (
              <Card className="p-4">
                <PostComposer user={user} feed={feedAddress} community={params.community} />
              </Card>
            )}
          </div>
        )}
        <Feed ItemView={PostView} endpoint={endpoint} />
      </div>
    </div>
  );
}
