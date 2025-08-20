"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";

interface UseEthereumDeleteOptions {
  onSuccess?: (postId: string) => void;
  onError?: (error: Error) => void;
}

export function useEthereumDelete(options?: UseEthereumDeleteOptions) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
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
      const defaultChainId = getDefaultChainId();

      try {
        // Check if current chain is supported
        const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
        let chainIdToUse = chainId;

        if (!currentChainSupported) {
          // Switch to default chain if current chain is not supported
          toast.loading("Switching to supported network...", { id: toastId });
          try {
            await switchChainAsync({ chainId: defaultChainId });
            chainIdToUse = defaultChainId;
          } catch (switchError) {
            console.error("Failed to switch chain:", switchError);
            // Continue with default chain even if switch fails
            chainIdToUse = defaultChainId;
          }
        }
        // Step 1: Get signature from the app
        toast.loading("Preparing deletion...", { id: toastId });

        const response = await fetch(`/api/posts/${postId}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: address,
            chainId: chainIdToUse || defaultChainId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[DELETE-COMMENT] Sign API error:", errorData);
          throw new Error(errorData.error || "Failed to prepare deletion");
        }

        const { data } = await response.json();

        // Step 2: Post deletion to blockchain
        toast.loading("Deleting post...", { id: toastId });

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS,
          functionName: "deleteComment",
          args: [data.commentId],
          chain: getDefaultChain(),
          account: address,
        });

        setTxHash(hash);
        toast.success("Post deleted!", { id: toastId });

        // Transaction will be confirmed by useWaitForTransactionReceipt
        return { hash, postId };
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete post", { id: toastId });
        throw error;
      }
    },
    onSuccess: ({ postId }) => {
      options?.onSuccess?.(postId);
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
