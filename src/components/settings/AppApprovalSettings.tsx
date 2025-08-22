"use client";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Loader2, Shield, XCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";

const PRESET_DURATIONS = [
  { label: "1 day", value: 1 },
  { label: "1 month", value: 30 },
  { label: "1 year", value: 365 },
];

const APPROVAL_STATUS_REFETCH_INTERVAL = 5000;
const APPROVAL_STATUS_STALE_TIME = 2000;

export function AppApprovalSettings() {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const queryClient = useQueryClient();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const customDaysInputId = useId();

  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const {
    data: approvalStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["approval-status", address],
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch(`/api/approval/status?author=${address}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch status" }));
        throw new Error(errorData.error || "Failed to fetch approval status");
      }

      const data = await response.json();
      return data;
    },
    enabled: !!address,
    refetchInterval: APPROVAL_STATUS_REFETCH_INTERVAL,
    staleTime: APPROVAL_STATUS_STALE_TIME,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const addApprovalMutation = useMutation({
    mutationFn: async (durationDays: number) => {
      if (!address || !approvalStatus?.appAddress) {
        throw new Error("Wallet not connected or app address not available");
      }

      const toastId = "add-approval";
      const defaultChainId = getDefaultChainId();

      try {
        const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];

        if (!currentChainSupported) {
          toast.loading("Switching to supported network...", { id: toastId });
          try {
            await switchChainAsync({ chainId: defaultChainId });
          } catch (switchError) {
            console.error("Failed to switch chain:", switchError);
            throw new Error("Please switch to a supported network");
          }
        }

        toast.loading("Adding approval...", { id: toastId });

        const expiryTimestamp = Math.floor((Date.now() + durationDays * 24 * 60 * 60 * 1000) / 1000);

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS,
          functionName: "addApproval",
          args: [approvalStatus.appAddress, BigInt(expiryTimestamp)],
          chain: getDefaultChain(),
          account: address,
        });

        setTxHash(hash);
        toast.success("Approval transaction sent!", { id: toastId });
        return { hash, expiryTimestamp };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add approval";
        toast.error(message, { id: toastId });
        throw error;
      }
    },
    onMutate: async (durationDays: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["approval-status", address] });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(["approval-status", address]);

      // Optimistically update to approved
      const expiryTimestamp = Math.floor((Date.now() + durationDays * 24 * 60 * 60 * 1000) / 1000);
      queryClient.setQueryData(["approval-status", address], (old: any) => ({
        ...old,
        isApproved: true,
        expiry: expiryTimestamp,
      }));

      // Return a context object with the snapshotted value
      return { previousStatus };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStatus) {
        queryClient.setQueryData(["approval-status", address], context.previousStatus);
      }
      console.error("Approval error:", err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["approval-status"] });
    },
  });

  const revokeApprovalMutation = useMutation({
    mutationFn: async () => {
      if (!address || !approvalStatus?.appAddress) {
        throw new Error("Wallet not connected or app address not available");
      }

      const toastId = "revoke-approval";
      const defaultChainId = getDefaultChainId();

      try {
        const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];

        if (!currentChainSupported) {
          toast.loading("Switching to supported network...", { id: toastId });
          try {
            await switchChainAsync({ chainId: defaultChainId });
          } catch (switchError) {
            console.error("Failed to switch chain:", switchError);
            throw new Error("Please switch to a supported network");
          }
        }

        toast.loading("Revoking approval...", { id: toastId });

        const hash = await writeContractAsync({
          abi: CommentManagerABI,
          address: COMMENT_MANAGER_ADDRESS,
          functionName: "revokeApproval",
          args: [approvalStatus.appAddress],
          chain: getDefaultChain(),
          account: address,
        });

        setTxHash(hash);
        toast.success("Revoke transaction sent!", { id: toastId });
        return hash;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to revoke approval";
        toast.error(message, { id: toastId });
        throw error;
      }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["approval-status", address] });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(["approval-status", address]);

      // Optimistically update to not approved
      queryClient.setQueryData(["approval-status", address], (old: any) => ({
        ...old,
        isApproved: false,
        expiry: null,
      }));

      // Return a context object with the snapshotted value
      return { previousStatus };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStatus) {
        queryClient.setQueryData(["approval-status", address], context.previousStatus);
      }
      console.error("Revoke error:", err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["approval-status"] });
    },
  });

  useEffect(() => {
    if (txSuccess && txHash) {
      setTxHash(undefined);
      setTimeout(() => {
        refetchStatus();
      }, 2000);
    }
  }, [txSuccess, txHash, refetchStatus]);

  const isApproved = approvalStatus?.isApproved || false;
  const expiryDate = approvalStatus?.expiry ? new Date(approvalStatus.expiry * 1000) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  const isProcessing = addApprovalMutation.isPending || revokeApprovalMutation.isPending || isConfirming;

  const handleRefresh = async () => {
    await refetchStatus();
    toast.success("Approval status refreshed");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" strokeWidth={2.5} />
            Gasless Posting
          </CardTitle>
          <CardDescription>
            Approve Paper to post on your behalf without gas fees. You maintain full control and can revoke access
            anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {statusError && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-400">
                  Failed to load approval status. Please try refreshing.
                  <Button variant="link" size="sm" onClick={handleRefresh} className="ml-2 p-0 h-auto">
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isLoadingStatus && !approvalStatus ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10 col-span-2" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    {isApproved && !isExpired ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">Active</span>
                        {expiryDate && (
                          <span className="text-sm text-muted-foreground">
                            · Expires {format(expiryDate, "PPP 'at' p")}
                          </span>
                        )}
                        {!expiryDate && (
                          <span className="text-sm text-muted-foreground">
                            · Active until manually revoked
                          </span>
                        )}
                      </>
                    ) : isExpired ? (
                      <>
                        <XCircle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-600 dark:text-orange-400">Expired</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Not Approved</span>
                      </>
                    )}
                  </div>
                </div>

                {(!isApproved || isExpired) && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Approve for...</div>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_DURATIONS.map((duration) => (
                        <Button
                          key={duration.value}
                          variant={selectedDuration === duration.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedDuration(duration.value);
                            addApprovalMutation.mutate(duration.value);
                          }}
                          disabled={isProcessing || !address}
                          className="w-full"
                        >
                          {isProcessing && selectedDuration === duration.value ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            duration.label
                          )}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCustomDialogOpen(true)}
                        disabled={isProcessing || !address}
                        className="w-full"
                      >
                        Custom
                      </Button>
                    </div>
                  </div>
                )}

                {!address && (
                  <div className="rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 dark:border-muted-foreground/20 dark:bg-muted-foreground/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        Please connect your wallet to manage approvals.
                      </div>
                    </div>
                  </div>
                )}

                {isApproved && !isExpired && (
                  <Button
                    onClick={() => revokeApprovalMutation.mutate()}
                    disabled={isProcessing || !address}
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Revoke"
                    )}
                  </Button>
                )}
              </div>

            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Approval Duration</DialogTitle>
            <DialogDescription>
              Enter the number of days you want to approve Paper for gasless posting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={customDaysInputId}>Duration (days)</Label>
              <Input
                id={customDaysInputId}
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Enter number of days"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomDialogOpen(false);
                setCustomDays("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const days = Number.parseInt(customDays, 10);
                if (days > 0 && days <= 365) {
                  setSelectedDuration(days);
                  addApprovalMutation.mutate(days);
                  setIsCustomDialogOpen(false);
                  setCustomDays("");
                } else {
                  toast.error("Please enter a valid number of days (1-365)");
                }
              }}
              disabled={
                !customDays ||
                Number.parseInt(customDays, 10) <= 0 ||
                Number.parseInt(customDays, 10) > 365 ||
                isProcessing
              }
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}