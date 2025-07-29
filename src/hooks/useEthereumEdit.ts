"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { base } from "viem/chains";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface UseEthereumEditOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEthereumEdit(options?: UseEthereumEditOptions) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const editComment = useMutation({
    mutationFn: async ({ postId, content, metadata = [] }: { postId: string; content: string; metadata?: any[] }) => {
      if (!address) {
        toast.error("Please connect your wallet to edit");
        throw new Error("Please connect your wallet");
      }

      const toastId = "edit-comment";

      try {
        // Step 1: Get signature from the app
        toast.loading("Preparing edit...", { id: toastId });

        const response = await fetch(`/api/posts/${postId}/edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            author: address,
            chainId: chainId || 8453, // Default to Base
            metadata,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[EDIT-COMMENT] Sign API error:", errorData);
          throw new Error(errorData.error || "Failed to prepare edit");
        }

        const { signature, data } = await response.json();

        // Step 2: Post edit to blockchain
        toast.loading("Updating post...", { id: toastId });

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS,
          functionName: "editComment",
          args: [data.commentId, data, signature],
          chain: base,
          account: address,
        });

        setTxHash(hash);
        toast.success("Post updated!", { id: toastId });

        // Transaction will be confirmed by useWaitForTransactionReceipt
        return hash;
      } catch (error) {
        toast.error(error.message || "Failed to edit post", { id: toastId });
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
    editMutation: editComment.mutate,
    isEditing: editComment.isPending || isConfirming,
    error: editComment.error,
  };
}
