import { useQuery } from "@tanstack/react-query";
import { type Address } from "viem";
import { usePublicClient } from "wagmi";
import { base } from "viem/chains";
import { EFP_CONTRACTS } from "~/lib/efp/config";
import { efpListRecordsAbi } from "~/lib/efp/abi";
import { decodeListOp } from "~/lib/efp/operations";
import { useEFPStorageLocation } from "./useEFPStorageLocation";

export type FollowingState = "follows" | "does-not-follow" | "unknown";

export interface UseEFPFollowingStateOptions {
  userAddress?: Address;
  targetAddress: Address;
  listId: string | null;
}

export interface UseEFPFollowingStateReturn {
  state: FollowingState;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEFPFollowingState({
  userAddress,
  targetAddress,
  listId,
}: UseEFPFollowingStateOptions): UseEFPFollowingStateReturn {
  const publicClient = usePublicClient({ chainId: base.id });
  const { data: storageLocation } = useEFPStorageLocation(listId);

  console.log("[useEFPFollowingState] userAddress", userAddress);
  console.log("[useEFPFollowingState] targetAddress", targetAddress);
  console.log("[useEFPFollowingState] listId", listId);

  const { data: state = "unknown", isLoading, error, refetch } = useQuery({
    queryKey: ["efp-following-state", userAddress, targetAddress, listId, storageLocation?.slot.toString()],
    queryFn: async () => {
      if (!userAddress || !listId || !publicClient || !storageLocation) {
        return "unknown" as FollowingState;
      }

      try {
        // Use the slot from storage location, not the list ID
        const slot = storageLocation.slot;

        const listOps = await publicClient.readContract({
          address: storageLocation.contractAddress,
          abi: efpListRecordsAbi,
          functionName: "getAllListOps",
          args: [slot],
        });
        console.log("[useEFPFollowingState] listOps", listOps);
        console.log("[useEFPFollowingState] Using slot:", slot.toString());
        console.log("[useEFPFollowingState] Using contract:", storageLocation.contractAddress);

        let isFollowing = false;

        for (const opData of listOps) {
          const decoded = decodeListOp(opData);
          console.log("[useEFPFollowingState] decoded", decoded);
          if (!decoded) continue;

          const { opcode, record } = decoded;
          console.log("[useEFPFollowingState] checking address match:", {
            recordAddress: record.address.toLowerCase(),
            targetAddress: targetAddress.toLowerCase(),
            match: record.address.toLowerCase() === targetAddress.toLowerCase()
          });

          if (record.address.toLowerCase() === targetAddress.toLowerCase()) {
            if (opcode === 0x01) {
              console.log("[useEFPFollowingState] ADD operation - setting isFollowing = true");
              isFollowing = true;
            } else if (opcode === 0x02) {
              console.log("[useEFPFollowingState] REMOVE operation - setting isFollowing = false");
              isFollowing = false;
            }
          }
        }

        console.log("[useEFPFollowingState] Final state:", isFollowing ? "follows" : "does-not-follow");
        return isFollowing ? "follows" : "does-not-follow";
      } catch (err) {
        console.error("Error checking following state:", err);
        return "unknown" as FollowingState;
      }
    },
    enabled: !!userAddress && !!listId && !!publicClient && !!storageLocation,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    state,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}