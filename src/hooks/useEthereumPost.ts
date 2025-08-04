"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";

interface UseSimplePostCommentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEthereumPost(options?: UseSimplePostCommentOptions) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const postComment = useMutation({
    mutationFn: async ({
      content,
      parentId,
      channelId,
    }: {
      content: string;
      parentId?: string;
      channelId?: string;
    }) => {
      if (!address) {
        toast.error("Please connect your wallet to post");
        throw new Error("Please connect your wallet");
      }

      const toastId = "post-comment";
      const defaultChainId = getDefaultChainId();

      try {
        // Check if current chain is supported
        const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId];
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
        toast.loading("Preparing comment...", { id: toastId });

        const requestBody: any = {
          content,
          parentId,
          author: address,
          chainId: chainIdToUse || defaultChainId,
        };

        if (channelId && !parentId) {
          requestBody.channelId = channelId;
        } else if (!parentId) {
          requestBody.targetUri = "app://paper";
        }

        const response = await fetch("/api/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[POST-COMMENT] Sign API error:", errorData);
          throw new Error(errorData.error || "Failed to prepare comment");
        }

        const { signature, commentData } = await response.json();

        // Step 2: Post to blockchain
        toast.loading("Posting...", { id: toastId });

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS,
          functionName: "postComment",
          args: [commentData, signature],
          chain: getDefaultChain(),
          account: address,
        });

        setTxHash(hash);
        toast.success("Comment posted!", { id: toastId });

        // Transaction will be confirmed by useWaitForTransactionReceipt
        return hash;
      } catch (error) {
        toast.error(error.message || "Failed to post comment", { id: toastId });
        throw error;
      }
    },
    onSuccess: () => {
      options?.onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["feed"], exact: false });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: false });
      }, 3000);

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: false });
      }, 4000);

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: false });
      }, 5000);
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
    postMutation: postComment.mutate,
    isPosting: postComment.isPending || isConfirming,
    error: postComment.error,
  };
}
