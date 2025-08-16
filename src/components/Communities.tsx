"use client";

import type { Group } from "@cartel-sh/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateCommunityDialog } from "~/components/channels/CreateChannelDialog";
import { CommunitiesListSuspense } from "~/components/communities/CommunitiesListSuspense";
import { CommunityView } from "~/components/communities/CommunityView";
import { Feed } from "~/components/Feed";
import { useUser } from "~/components/user/UserContext";

interface CommunitiesProps {
  initialQuery?: string;
}

const CommunityViewWrapper = ({ item }: { item: Group }) => {
  return <CommunityView community={item} />;
};

export default function Communities({ initialQuery = "" }: CommunitiesProps) {
  const searchParams = useSearchParams();
  const query = initialQuery || searchParams.get("q") || "";
  const { user } = useUser();
  const router = useRouter();

  const handleChannelCreated = (channelId: string) => {
    router.push(`/c/${channelId}`);
  };

  return (
    <>
      {user && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Communities</h1>
          <CreateCommunityDialog onChannelCreated={handleChannelCreated} />
        </div>
      )}
      <Feed<Group>
        ItemView={CommunityViewWrapper}
        endpoint={`/api/communities${query ? `?q=${encodeURIComponent(query)}` : ""}`}
        queryKey={["communities", query]}
        LoadingView={CommunitiesListSuspense}
      />
    </>
  );
}
