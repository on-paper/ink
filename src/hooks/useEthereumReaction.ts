"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";

interface UseEthereumReactionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEthereumReaction(options?: UseEthereumReactionOptions) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const postReaction = useMutation({
    mutationFn: async ({ reactionType, endpoint }: { reactionType: "like" | "repost"; endpoint: string }) => {
      if (!address) {
        toast.error("Please connect your wallet");
        throw new Error("Please connect your wallet");
      }

      const toastId = `post-${reactionType}`;
      const defaultChainId = getDefaultChainId();

      try {
        const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId];
        let chainIdToUse = chainId;

        if (!currentChainSupported) {
          toast.loading("Switching to supported network...", { id: toastId });
          try {
            await switchChainAsync({ chainId: defaultChainId });
            chainIdToUse = defaultChainId;
          } catch (switchError) {
            console.error("Failed to switch chain:", switchError);
            chainIdToUse = defaultChainId;
          }
        }

        toast.loading(`Preparing ${reactionType}...`, { id: toastId });

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: address,
            chainId: chainIdToUse || defaultChainId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[${reactionType.toUpperCase()}] API error:`, errorData);
          throw new Error(errorData.error || `Failed to ${reactionType}`);
        }

        const { signature, commentData } = await response.json();

        toast.loading(`Posting ${reactionType}...`, { id: toastId });

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS,
          functionName: "postComment",
          args: [commentData, signature],
          chain: getDefaultChain(),
          account: address,
        });

        setTxHash(hash);
        toast.success(`${reactionType === "like" ? "Liked" : "Reposted"}!`, { id: toastId });

        return hash;
      } catch (error) {
        toast.error(error.message || `Failed to ${reactionType}`, { id: toastId });
        throw error;
      }
    },
    onSuccess: () => {
      options?.onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["feed"], exact: false });

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
    postReaction: postReaction.mutateAsync,
    isPosting: postReaction.isPending || isConfirming,
    error: postReaction.error,
  };
}

