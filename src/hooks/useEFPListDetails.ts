import { useQuery } from "@tanstack/react-query";
import { EFP_API_BASE_URL } from "~/lib/efp/config";

export interface ENSRecord {
  name: string;
  avatar?: string;
  records?: {
    avatar?: string;
    "com.discord"?: string;
    "com.twitter"?: string;
    [key: string]: string | undefined;
  };
  updated_at: string;
}

export interface ListRanks {
  mutuals_rank: string;
  followers_rank: string;
  following_rank: string;
  top8_rank: string;
  blocks_rank: number;
}

export interface ListDetailsResponse {
  address: string;
  ens?: ENSRecord;
  ranks: ListRanks;
  primary_list: string;
}

export interface ListStatsResponse {
  followers_count: number;
  following_count: number;
}

export interface EFPListDetails {
  details: ListDetailsResponse | null;
  stats: ListStatsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEFPListDetails(listId: string | null | undefined): EFPListDetails {
  const {
    data: details,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["efp-list-details", listId],
    queryFn: async () => {
      if (!listId) return null;

      try {
        const response = await fetch(`${EFP_API_BASE_URL}/lists/${listId}/details`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error("Failed to fetch list details");
        }

        const data = (await response.json()) as ListDetailsResponse;
        return data;
      } catch (err) {
        console.error("[useEFPListDetails] Error fetching details:", err);
        throw err;
      }
    },
    enabled: !!listId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["efp-list-stats", listId],
    queryFn: async () => {
      if (!listId) return null;

      try {
        const response = await fetch(`${EFP_API_BASE_URL}/lists/${listId}/stats`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error("Failed to fetch list stats");
        }

        const data = (await response.json()) as ListStatsResponse;
        return data;
      } catch (err) {
        console.error("[useEFPListDetails] Error fetching stats:", err);
        throw err;
      }
    },
    enabled: !!listId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    details: details || null,
    stats: stats || null,
    isLoading: isLoadingDetails || isLoadingStats,
    error: detailsError || statsError,
    refetch: () => {
      refetchDetails();
      refetchStats();
    },
  };
}
