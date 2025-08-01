"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { base } from "viem/chains";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface UseEthereumDeleteOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEthereumDelete(options?: UseEthereumDeleteOptions) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const deleteComment = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!address) {
        toast.error("Please connect your wallet to delete");
        throw new Error("Please connect your wallet");
      }

      const toastId = "delete-comment";

      try {
        // Step 1: Get signature from the app
        toast.loading("Preparing deletion...", { id: toastId });

        const response = await fetch(`/api/posts/${postId}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: address,
            chainId: chainId || 8453, // Default to Base
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[DELETE-COMMENT] Sign API error:", errorData);
          throw new Error(errorData.error || "Failed to prepare deletion");
        }

        const { signature, data } = await response.json();

        // Step 2: Post deletion to blockchain
        toast.loading("Deleting post...", { id: toastId });

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS,
          functionName: "deleteComment",
          args: [data.commentId],
          chain: base,
          account: address,
        });

        setTxHash(hash);
        toast.success("Post deleted!", { id: toastId });

        // Transaction will be confirmed by useWaitForTransactionReceipt
        return hash;
      } catch (error) {
        toast.error(error.message || "Failed to delete post", { id: toastId });
        throw error;
      }
    },
    onSuccess: () => {
      options?.onSuccess?.();
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["feed"], exact: false });

      // Additional invalidations with delay to catch any delayed updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: false });
      }, 3000);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  useEffect(() => {
    if (isSuccess && txHash) {
      setTxHash(undefined);
    }
  }, [isSuccess, txHash]);

  return {
    deleteMutation: deleteComment.mutate,
    isDeleting: deleteComment.isPending || isConfirming,
    error: deleteComment.error,
  };
}
