import { useCallback, useState } from "react";
import { toast } from "sonner";
import { type Address, type Hash } from "viem";
import { base } from "viem/chains";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { efpListRecordsAbi } from "~/lib/efp/abi";
import { encodeBatchOperations, encodeFollowOperation, encodeUnfollowOperation } from "~/lib/efp/operations";
import { useEFPStorageLocation } from "./useEFPStorageLocation";

export interface UseEFPFollowOptions {
  listId: string | null;
  targetAddress: Address;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export interface UseEFPFollowReturn {
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  batchOperations: (operations: Array<{ action: "follow" | "unfollow"; address: Address }>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useEFPFollow({ listId, targetAddress, onSuccess, onError }: UseEFPFollowOptions): UseEFPFollowReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { address: accountAddress } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const { data: walletClient } = useWalletClient({ chainId: base.id });
  const { data: storageLocation } = useEFPStorageLocation(listId);

  const executeOperation = useCallback(
    async (operation: "follow" | "unfollow") => {
      if (!accountAddress) {
        const err = new Error("No wallet connected");
        setError(err);
        onError?.(err);
        return;
      }

      if (!listId) {
        const err = new Error("No EFP list found");
        setError(err);
        onError?.(err);
        return;
      }

      if (!walletClient) {
        const err = new Error("Wallet client not available");
        setError(err);
        onError?.(err);
        return;
      }

      if (!publicClient) {
        const err = new Error("Public client not available");
        setError(err);
        onError?.(err);
        return;
      }

      if (!storageLocation) {
        const err = new Error("Storage location not found");
        setError(err);
        onError?.(err);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the slot from storage location, not the list ID
        const slot = storageLocation.slot;
        const opBytes =
          operation === "follow" ? encodeFollowOperation(targetAddress) : encodeUnfollowOperation(targetAddress);

        console.log("[useEFPFollow] Executing", operation, "operation");
        console.log("[useEFPFollow] Target address:", targetAddress);
        console.log("[useEFPFollow] Using slot:", slot.toString());
        console.log("[useEFPFollow] Using contract:", storageLocation.contractAddress);
        console.log("[useEFPFollow] Operation bytes:", opBytes);

        const hash = await walletClient.writeContract({
          chain: base,
          address: storageLocation.contractAddress,
          abi: efpListRecordsAbi,
          functionName: "applyListOps",
          args: [slot, [opBytes]], // Pass as array for batch operation
          account: accountAddress,
        });

        toast.promise(publicClient.waitForTransactionReceipt({ hash }), {
          loading: operation === "follow" ? "Following..." : "Unfollowing...",
          success: () => {
            onSuccess?.(hash);
            return operation === "follow" ? "Followed successfully!" : "Unfollowed successfully!";
          },
          error: (err) => {
            const errorMessage = err?.message || `Failed to ${operation}`;
            setError(new Error(errorMessage));
            onError?.(new Error(errorMessage));
            return errorMessage;
          },
        });

        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to ${operation}`;
        const error = new Error(errorMessage);
        setError(error);
        onError?.(error);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [accountAddress, listId, targetAddress, walletClient, publicClient, storageLocation, onSuccess, onError],
  );

  const follow = useCallback(() => executeOperation("follow"), [executeOperation]);
  const unfollow = useCallback(() => executeOperation("unfollow"), [executeOperation]);

  const batchOperations = useCallback(
    async (operations: Array<{ action: "follow" | "unfollow"; address: Address }>) => {
      if (!accountAddress || !listId || !walletClient || !publicClient || !storageLocation) {
        const err = new Error("Prerequisites not met for batch operations");
        setError(err);
        onError?.(err);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const slot = storageLocation.slot;
        const opBytes = encodeBatchOperations(operations);

        console.log("[useEFPFollow] Executing batch operations");
        console.log("[useEFPFollow] Operations count:", operations.length);
        console.log("[useEFPFollow] Using slot:", slot.toString());

        const hash = await walletClient.writeContract({
          chain: base,
          address: storageLocation.contractAddress,
          abi: efpListRecordsAbi,
          functionName: "applyListOps",
          args: [slot, opBytes],
          account: accountAddress,
        });

        toast.promise(publicClient.waitForTransactionReceipt({ hash }), {
          loading: `Processing ${operations.length} operations...`,
          success: () => {
            onSuccess?.(hash);
            return `Successfully processed ${operations.length} operations!`;
          },
          error: (err) => {
            const errorMessage = err?.message || "Failed to process batch operations";
            setError(new Error(errorMessage));
            onError?.(new Error(errorMessage));
            return errorMessage;
          },
        });

        await publicClient.waitForTransactionReceipt({ hash });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to process batch operations";
        const error = new Error(errorMessage);
        setError(error);
        onError?.(error);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [accountAddress, listId, walletClient, publicClient, storageLocation, onSuccess, onError],
  );

  return {
    follow,
    unfollow,
    batchOperations,
    isLoading,
    error,
  };
}
