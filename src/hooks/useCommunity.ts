import type { Group } from "@cartel-sh/ui";
import { useQuery } from "@tanstack/react-query";

export type CommunityWithOperations = Group;

const fetchCommunity = async (communityId: string): Promise<Group> => {
  const response = await fetch(`/api/communities/${communityId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch community");
  }
  const data = await response.json();
  return data;
};

export function useCommunity(communityId: string | undefined) {
  return useQuery({
    queryKey: ["community", communityId],
    queryFn: () => fetchCommunity(communityId!),
    enabled: !!communityId,
    staleTime: 2 * 24 * 60 * 60 * 1000, // 2 days
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
