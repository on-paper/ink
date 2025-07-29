import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { EFP_API_BASE_URL } from "~/lib/efp/config";

interface ProfileListsResponse {
  primary_list?: string | null;
  lists?: string[];
}

export function useEFPList() {
  const { address } = useAccount();

  const {
    data: profileLists,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["efp-profile-lists", address],
    queryFn: async () => {
      if (!address) return null;

      try {
        const response = await fetch(`${EFP_API_BASE_URL}/users/${address}/lists`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return {
              primary_list: null,
              lists: [],
            } as ProfileListsResponse;
          }
          throw new Error("Failed to fetch EFP lists");
        }

        const data = (await response.json()) as ProfileListsResponse;
        console.log("[useEFPList] API response:", data);
        return data;
      } catch (err) {
        return {
          primary_list: null,
          lists: [],
        } as ProfileListsResponse;
      }
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasEFPList = !!(profileLists?.primary_list || (profileLists?.lists && profileLists.lists.length > 0));
  const primaryListId = profileLists?.primary_list;
  const lists = profileLists?.lists || [];

  console.log("[useEFPList] Result:", {
    hasEFPList,
    primaryListId,
    listsCount: lists.length,
  });

  return {
    hasEFPList,
    primaryListId,
    lists,
    isLoading,
    error,
    refetch,
  };
}
