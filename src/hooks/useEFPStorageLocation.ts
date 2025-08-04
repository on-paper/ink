import { useQuery } from "@tanstack/react-query";
import { base } from "viem/chains";
import { usePublicClient } from "wagmi";
import { efpListRegistryAbi } from "~/lib/efp/abi";
import { EFP_CONTRACTS } from "~/lib/efp/config";

export interface StorageLocation {
  version: number;
  listType: number;
  chainId: bigint;
  contractAddress: `0x${string}`;
  slot: bigint;
}

export function useEFPStorageLocation(listId: string | null) {
  const publicClient = usePublicClient({ chainId: base.id });

  return useQuery({
    queryKey: ["efp-storage-location", listId],
    queryFn: async (): Promise<StorageLocation | null> => {
      if (!listId || !publicClient) return null;

      try {
        const listIdBigInt = BigInt(listId);

        const storageLocationHex = await publicClient.readContract({
          address: EFP_CONTRACTS.EFPListRegistry,
          abi: efpListRegistryAbi,
          functionName: "getListStorageLocation",
          args: [listIdBigInt],
        });

        // Decode according to spec: version (1) + list type (1) + chain_id (32) + contract (20) + slot (remaining)
        const bytes = Buffer.from(storageLocationHex.slice(2), "hex");

        const version = bytes[0];
        const listType = bytes[1];
        const chainId = BigInt(`0x${bytes.slice(2, 34).toString("hex")}`);
        const contractAddress = `0x${bytes.slice(34, 54).toString("hex")}` as `0x${string}`;
        const slot = BigInt(`0x${bytes.slice(54, 86).toString("hex")}`); // Slot is exactly 32 bytes

        console.log("[useEFPStorageLocation] Decoded storage location:", {
          version,
          listType,
          chainId: chainId.toString(),
          contractAddress,
          slot: slot.toString(),
          slotHex: `0x${slot.toString(16)}`,
        });

        return {
          version,
          listType,
          chainId,
          contractAddress,
          slot,
        };
      } catch (error) {
        console.error("Error fetching storage location:", error);
        return null;
      }
    },
    enabled: !!listId && !!publicClient,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
