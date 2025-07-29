import { useMemo, useState } from "react";
import { encodePacked } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";

import { efpListMinterAbi, efpListRecordsAbi } from "~/lib/efp/abi";
import { EFP_CONTRACTS } from "~/lib/efp/config";
import { generateListStorageLocationSlot } from "~/utils/efp/generate-slot";

export function useMintEFP() {
  const [listHasBeenMinted, setListHasBeenMinted] = useState(false);
  const [isSettingUser, setIsSettingUser] = useState(false);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();
  const nonce = useMemo(() => generateListStorageLocationSlot(), []);

  const mint = async ({
    selectedChainId,
    setNewListAsPrimary = true,
  }: {
    selectedChainId?: number;
    setNewListAsPrimary?: boolean;
  } = {}) => {
    if (!accountAddress || !walletClient) return;

    const chainId = selectedChainId || base.id;
    const listRecordsContractAddress = EFP_CONTRACTS.EFPListRecords;

    try {
      // Step 1: Mint the NFT
      console.log("[useMintEFP] Minting NFT with nonce:", nonce);
      const mintHash = await walletClient.writeContract({
        chain: base,
        address: EFP_CONTRACTS.EFPListMinter,
        abi: efpListMinterAbi,
        functionName: setNewListAsPrimary ? "mintPrimaryListNoMeta" : "mintNoMeta",
        args: [
          encodePacked(
            ["uint8", "uint8", "uint256", "address", "uint"],
            [1, 1, BigInt(chainId), listRecordsContractAddress, nonce],
          ),
        ],
        account: accountAddress,
      });

      console.log("[useMintEFP] Mint transaction hash:", mintHash);

      // Wait for the mint transaction to be confirmed
      const mintReceipt = await publicClient.waitForTransactionReceipt({
        hash: mintHash,
      });

      console.log("[useMintEFP] Mint transaction confirmed:", mintReceipt);

      // Step 2: Set the user metadata
      setIsSettingUser(true);
      console.log("[useMintEFP] Setting user metadata for nonce:", nonce);

      const setUserHash = await walletClient.writeContract({
        chain: base,
        address: listRecordsContractAddress,
        abi: efpListRecordsAbi,
        functionName: "setMetadataValuesAndApplyListOps",
        args: [
          nonce,
          [{ key: "user", value: accountAddress }],
          [], // No list operations for initial creation
        ],
        account: accountAddress,
      });

      console.log("[useMintEFP] Set user transaction hash:", setUserHash);

      // Wait for the set user transaction to be confirmed
      const setUserReceipt = await publicClient.waitForTransactionReceipt({
        hash: setUserHash,
      });

      console.log("[useMintEFP] Set user transaction confirmed:", setUserReceipt);
      setIsSettingUser(false);
      setListHasBeenMinted(true);

      return mintHash;
    } catch (e: any) {
      console.error("[useMintEFP] Error:", e);
      setListHasBeenMinted(false);
      setIsSettingUser(false);
      throw new Error(e);
    }
  };

  return {
    mint,
    nonce,
    walletClient,
    listHasBeenMinted,
    isSettingUser,
  };
}
