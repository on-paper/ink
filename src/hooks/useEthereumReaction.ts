"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSignTypedData, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";

interface UseEthereumReactionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEthereumReaction(options?: UseEthereumReactionOptions) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
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
        const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
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

        // Extract postId and channelId from endpoint
        const urlParts = endpoint.split("/");
        const postId = urlParts[urlParts.indexOf("posts") + 1];
        const urlParams = new URLSearchParams(endpoint.split("?")[1] || "");
        const channelId = urlParams.get("channelId");

        // Use unified reaction endpoint
        const response = await fetch(`/api/posts/${postId}/reaction/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reactionType,
            author: address,
            chainId: chainIdToUse || defaultChainId,
            channelId,
            mode: "auto",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[${reactionType.toUpperCase()}] Prepare API error:`, errorData);
          throw new Error(errorData.error || `Failed to ${reactionType}`);
        }

        const result = await response.json();

        // Handle different response modes
        if (result.mode === "gasless_submitted") {
          // Transaction was submitted gaslessly
          setTxHash(result.txHash);
          toast.success(`${reactionType === "like" ? "Liked" : "Reposted"}!`, { id: toastId });
          return result.txHash;
        }

        if (result.mode === "gasless_pending") {
          // Need user signature for gasless submission
          toast.loading(`Please sign to ${reactionType}...`, { id: toastId });

          const authorSignature = await signTypedDataAsync(result.signTypedDataParams);

          // Submit gasless transaction
          toast.loading(`Posting ${reactionType}...`, { id: toastId });

          const submitResponse = await fetch(`/api/posts/${postId}/reaction/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signTypedDataParams: result.signTypedDataParams,
              appSignature: result.appSignature,
              authorSignature,
              commentData: result.commentData,
              chainId: chainIdToUse || defaultChainId,
            }),
          });

          if (!submitResponse.ok) {
            const errorData = await submitResponse.json().catch(() => ({}));

            if (errorData.code === "INSUFFICIENT_FUNDS") {
              // Fall back to regular transaction
              console.warn("Gasless funds insufficient, falling back to regular transaction");
            } else {
              throw new Error(errorData.error || `Failed to submit ${reactionType}`);
            }
          } else {
            const submitResult = await submitResponse.json();
            setTxHash(submitResult.txHash);
            toast.success(`${reactionType === "like" ? "Liked" : "Reposted"}!`, { id: toastId });
            return submitResult.txHash;
          }
        }

        // Regular mode: submit transaction directly
        toast.loading(`Posting ${reactionType}...`, { id: toastId });

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS as `0x${string}`,
          functionName: "postComment",
          args: [result.commentData, result.signature],
          chain: getDefaultChain(),
          account: address,
        });

        setTxHash(hash);
        toast.success(`${reactionType === "like" ? "Liked" : "Reposted"}!`, { id: toastId });

        return hash;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to ${reactionType}`, { id: toastId });
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
