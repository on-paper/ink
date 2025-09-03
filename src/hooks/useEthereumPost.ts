"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { decodeEventLog } from "viem";
import {
  useAccount,
  usePublicClient,
  useSignTypedData,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";

interface UseSimplePostCommentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEthereumPost(options?: UseSimplePostCommentOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const publicClient = usePublicClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Helper function to get comment ID from transaction and update toast
  const getCommentIdAndUpdateToast = async (hash: `0x${string}`, toastId: string | number) => {
    if (!publicClient) return;

    try {
      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      // Parse the CommentAdded event from logs
      for (const log of receipt.logs) {
        try {
          const decodedLog = decodeEventLog({
            abi: CommentManagerABI,
            data: log.data,
            topics: log.topics,
          });

          if (decodedLog.eventName === "CommentAdded") {
            const commentId = decodedLog.args.commentId as string;

            // Update the existing toast with the action button
            toast.success("Posted successfully!", {
              id: toastId,
              action: {
                label: "Show me",
                onClick: () => router.push(`/p/${commentId}`),
              },
            });
            return commentId;
          }
        } catch {
          // Not a CommentAdded event, continue
        }
      }
    } catch (error) {
      console.error("Failed to get comment ID from transaction:", error);
    }
  };

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

        // Step 1: Prepare the comment using unified endpoint
        toast.loading("Posting...", { id: toastId });

        const requestBody: any = {
          content,
          parentId,
          author: address,
          chainId: chainIdToUse || defaultChainId,
          mode: "auto", // Auto-detect based on approval status
          submitIfApproved: true,
        };

        if (channelId) {
          requestBody.channelId = channelId;
        } else if (!parentId) {
          requestBody.targetUri = "app://paper";
        }

        const prepareResponse = await fetch("/api/posts/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!prepareResponse.ok) {
          const errorData = await prepareResponse.json().catch(() => ({}));

          // Handle insufficient funds error
          if (errorData.code === "INSUFFICIENT_FUNDS") {
            toast.error("Paper is out of funds. Using regular posting.", { id: toastId });

            // Retry with regular mode
            const regularResponse = await fetch("/api/posts/prepare", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...requestBody, mode: "regular" }),
            });

            if (!regularResponse.ok) {
              const regularError = await regularResponse.json().catch(() => ({}));
              throw new Error(regularError.error || "Failed to prepare comment");
            }

            const regularData = await regularResponse.json();

            // Execute regular transaction
            toast.loading("Posting...", { id: toastId });
            const hash = await writeContractAsync({
              abi: CommentManagerABI,
              address: COMMENT_MANAGER_ADDRESS as `0x${string}`,
              functionName: "postComment",
              args: [regularData.commentData, regularData.appSignature],
              chain: getDefaultChain(),
              account: address,
            });

            setTxHash(hash);
            toast.success("Posted successfully!", { id: toastId });
            // Get comment ID in background and update toast with Show me button
            getCommentIdAndUpdateToast(hash, toastId);
            return hash;
          }

          console.error("[POST-COMMENT] Prepare error:", errorData);
          throw new Error(errorData.error || "Failed to prepare comment");
        }

        const preparedData = await prepareResponse.json();

        // Handle response based on mode
        if (preparedData.mode === "gasless_submitted") {
          setTxHash(preparedData.txHash);
          toast.success("Posted successfully!", { id: toastId });
          // Get comment ID in background and update toast with Show me button
          getCommentIdAndUpdateToast(preparedData.txHash, toastId);
          return preparedData.txHash;
        }
        if (preparedData.mode === "gasless_pending") {
          // Need user signature for gasless
          toast.loading("Please sign the message...", { id: toastId });
          const authorSignature = await signTypedDataAsync(preparedData.signTypedDataParams);

          toast.loading("Submitting gasless comment...", { id: toastId });
          const submitResponse = await fetch("/api/posts/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...preparedData,
              authorSignature,
            }),
          });

          if (!submitResponse.ok) {
            const errorData = await submitResponse.json().catch(() => ({}));

            if (errorData.code === "INSUFFICIENT_FUNDS") {
              toast.error("Paper is out of funds. Please try regular posting.", { id: toastId });
            }

            throw new Error(errorData.error || "Failed to submit comment");
          }

          const submitData = await submitResponse.json();
          setTxHash(submitData.txHash);
          toast.success("Posted successfully!", { id: toastId });
          // Get comment ID in background and update toast with Show me button
          getCommentIdAndUpdateToast(submitData.txHash, toastId);
          return submitData.txHash;
        }
        // Regular mode - user submits transaction
        toast.loading("Posting...", { id: toastId });
        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS as `0x${string}`,
          functionName: "postComment",
          args: [preparedData.commentData, preparedData.appSignature],
          chain: getDefaultChain(),
          account: address,
        });

        setTxHash(hash);
        toast.success("Posted successfully!", { id: toastId });
        // Get comment ID in background and update toast with Show me button
        getCommentIdAndUpdateToast(hash, toastId);
        return hash;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to post comment", { id: toastId });
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
