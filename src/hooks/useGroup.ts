import type { Group } from "@cartel-sh/ui";
import { useQuery } from "@tanstack/react-query";

export type GroupWithOperations = Group;

const fetchGroup = async (groupId: string): Promise<Group> => {
  const response = await fetch(`/api/groups/${groupId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch group");
  }
  const data = await response.json();
  return data;
};

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId!),
    enabled: !!groupId,
    staleTime: 2 * 24 * 60 * 60 * 1000, // 2 days
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
