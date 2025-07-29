"use client";

import { CheckCircle2, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useEFPList } from "~/hooks/useEFPList";
import { useEFPListDetails } from "~/hooks/useEFPListDetails";
import { useMintEFP } from "~/hooks/useMintEFP";

export default function MintEFPPage() {
  const { address, chain } = useAccount();
  const router = useRouter();
  const { switchChainAsync } = useSwitchChain();
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [isMintingInProgress, setIsMintingInProgress] = useState(false);
  const { hasEFPList, lists, primaryListId, isLoading: isLoadingLists, refetch: refetchLists } = useEFPList();
  const { details, stats } = useEFPListDetails(primaryListId);
  const { mint, listHasBeenMinted, isSettingUser } = useMintEFP();

  const handleSwitchChain = async () => {
    if (chain?.id !== base.id) {
      setIsSwitchingChain(true);
      try {
        await switchChainAsync({ chainId: base.id });
        setIsSwitchingChain(false);
        return true;
      } catch (error) {
        toast.error("Failed to switch to Base network");
        console.error("Chain switch error:", error);
        setIsSwitchingChain(false);
        return false;
      }
    }
    return true;
  };

  const handleMintNFT = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    const switched = await handleSwitchChain();
    if (!switched) return;

    setIsMintingInProgress(true);
    try {
      await mint({
        selectedChainId: base.id,
        setNewListAsPrimary: true,
      });

      await refetchLists();
      toast.success("EFP List minted successfully!");
    } catch (error) {
      console.error("[MintEFPPage] Mint error:", error);
      toast.error("Failed to mint EFP List");
    } finally {
      setIsMintingInProgress(false);
    }
  };

  if (listHasBeenMinted && !isMintingInProgress && !isSettingUser) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold">Success!</h1>
            <p className="text-muted-foreground">
              Your EFP List has been minted successfully. You can now follow users on Paper.
            </p>
          </div>
          <Button onClick={() => router.push("/")} className="w-full sm:w-auto">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const getLoadingMessage = () => {
    if (isMintingInProgress && !isSettingUser) {
      return "Minting your EFP List NFT...";
    }
    if (isSettingUser) {
      return "Setting up your list...";
    }
    return "Processing...";
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">
            {hasEFPList ? "You Already Have an EFP List" : "Create Your Follow List"}
          </h1>
          <p className="text-muted-foreground">
            {hasEFPList
              ? "You already have an EFP List NFT and can follow users on Paper."
              : "To follow users on Paper, you need an EFP List NFT. This is a one-time setup that allows you to manage your social connections onchain."}
          </p>
        </div>

        {isLoadingLists && address ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasEFPList ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="font-medium text-green-900 dark:text-green-100">
                  You have {lists.length} EFP {lists.length === 1 ? "List" : "Lists"}
                </p>
              </div>
              {primaryListId && (
                <div className="space-y-1">
                  <p className="text-sm text-green-700 dark:text-green-300">Primary List ID: {primaryListId}</p>
                  {stats && (
                    <div className="flex gap-4 text-sm text-green-700 dark:text-green-300">
                      <span>{stats.followers_count} followers</span>
                      <span>{stats.following_count} following</span>
                    </div>
                  )}
                  {details?.ranks && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Rank #{details.ranks.followers_rank} by followers
                    </div>
                  )}
                </div>
              )}
              {lists.length > 1 && (
                <p className="text-sm text-green-700 dark:text-green-300">List IDs: {lists.join(", ")}</p>
              )}
            </div>
            <Button onClick={() => router.push("/")} className="w-full" size="lg">
              Return to Home
            </Button>
          </div>
        ) : (
          <>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold">What is an EFP List?</h2>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• A decentralized follow list stored onchain</li>
                  <li>• Free to mint (only pay gas fees)</li>
                  <li>• You own and control your social graph</li>
                  <li>• Works across all EFP-enabled apps</li>
                </ul>
              </div>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Minting will create your EFP List NFT and set it as your primary list
              </p>
            </div>
          </>
        )}

        {!hasEFPList && (
          <div className="space-y-3">
            {!address ? (
              <p className="text-center text-muted-foreground">Please connect your wallet to continue</p>
            ) : chain?.id !== base.id ? (
              <Button onClick={handleSwitchChain} disabled={isSwitchingChain} className="w-full" size="lg">
                {isSwitchingChain ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Switching to Base...
                  </>
                ) : (
                  "Switch to Base Network"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleMintNFT}
                disabled={isMintingInProgress || isLoadingLists}
                className="w-full"
                size="lg"
              >
                {isMintingInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {getLoadingMessage()}
                  </>
                ) : (
                  "Mint EFP List"
                )}
              </Button>
            )}

            <Link href="/">
              <Button variant="ghost" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
