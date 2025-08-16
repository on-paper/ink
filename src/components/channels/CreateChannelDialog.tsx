"use client";

import { CHANNEL_MANAGER_ADDRESS, ChannelManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { keccak256, stringToHex, toHex } from "viem";
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface CreateChannelDialogProps {
  onChannelCreated?: (channelId: string) => void;
}

export function CreateCommunityDialog({ onChannelCreated }: CreateChannelDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [category, setCategory] = useState("");
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const defaultChainId = getDefaultChainId();

  const nameId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const rulesId = useId();

  const {
    data: channelCreationFee,
    error: feeError,
    isLoading: isFeeLoading,
  } = useReadContract({
    address: CHANNEL_MANAGER_ADDRESS as `0x${string}`,
    abi: ChannelManagerABI,
    functionName: "getChannelCreationFee",
    chainId: defaultChainId,
  });

  // Show error toast when fee fetching fails
  if (feeError) {
    console.error("Error fetching channel creation fee:", feeError);
  }

  const createChannel = useMutation({
    mutationFn: async () => {
      if (!address) {
        toast.error("Please connect your wallet");
        throw new Error("Wallet not connected");
      }

      if (!name.trim()) {
        toast.error("Community name is required");
        throw new Error("Community name is required");
      }

      const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId];

      if (!currentChainSupported) {
        toast.info("Switching to supported network...");
        await switchChainAsync({ chainId: defaultChainId });
      }

      // Create metadata array with proper encoding
      // The contract expects an array of { key: bytes32, value: bytes }
      // We'll store the metadata as a single JSON entry
      const metadata: Array<{ key: `0x${string}`; value: `0x${string}` }> = [];

      const metadataObj: any = {};

      if (category.trim()) {
        metadataObj.category = category.trim();
      }

      if (rules.trim()) {
        const rulesArray = rules
          .split("\n")
          .filter((r) => r.trim())
          .map((r) => r.trim());
        if (rulesArray.length > 0) {
          metadataObj.rules = rulesArray;
        }
      }

      // If we have metadata, add it as a single entry with key "metadata"
      if (Object.keys(metadataObj).length > 0) {
        // Create a bytes32 key by hashing "metadata" and padding
        const key = keccak256(toHex("metadata"));
        // Convert the JSON object to hex-encoded bytes
        const value = stringToHex(JSON.stringify(metadataObj));
        metadata.push({ key, value });
      }

      const channelManagerAddress = CHANNEL_MANAGER_ADDRESS as `0x${string}`;
      if (!channelCreationFee) {
        toast.error("Unable to fetch creation fee");
        throw new Error("Channel creation fee not available");
      }

      const fee = channelCreationFee;

      const hash = await writeContractAsync({
        address: channelManagerAddress,
        abi: ChannelManagerABI,
        functionName: "createChannel",
        args: [
          name,
          description || "",
          metadata,
          "0x0000000000000000000000000000000000000000" as `0x${string}`, // No hook
        ],
        value: fee,
        chain: getDefaultChain(),
        account: address,
      });

      setIsWaitingForTx(true);
      toast.info("Transaction submitted. Waiting for confirmation...");

      // Wait for transaction receipt
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          toast.success("Community created successfully!");
          queryClient.invalidateQueries({ queryKey: ["channels"] });

          // Extract channel ID from logs if available
          // The Transfer event for NFT minting typically has the token ID as the third topic
          if (receipt.logs && receipt.logs.length > 0) {
            for (const log of receipt.logs) {
              // Check if this is a Transfer event (topic[0] is the event signature)
              // Transfer event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
              if ("topics" in log && log.topics && Array.isArray(log.topics) && log.topics.length >= 4) {
                const channelIdFromLog = log.topics[3] as `0x${string}`; // tokenId is the 4th topic (index 3)
                if (channelIdFromLog && onChannelCreated) {
                  // Convert from hex to decimal string for the route
                  const channelId = BigInt(channelIdFromLog).toString();
                  onChannelCreated(channelId);
                  break;
                }
              }
            }
          }

          setOpen(false);
          resetForm();
        } else {
          toast.error("Transaction failed");
        }
      }

      setIsWaitingForTx(false);
    },
    onError: (error) => {
      console.error("Error creating community:", error);
      toast.error(error.message || "Failed to create community");
      setIsWaitingForTx(false);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setRules("");
    setCategory("");
  };

  const formattedFee = channelCreationFee ? (Number(channelCreationFee) / 1e18).toFixed(3) : "...";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Community</DialogTitle>
          <DialogDescription>
            Create a new community on-chain.{" "}
            {feeError ? (
              "Unable to fetch fee. Please try again."
            ) : isFeeLoading ? (
              "Loading fee..."
            ) : channelCreationFee ? (
              <>
                This will cost{" "}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="underline decoration-dashed decoration-1.5 underline-offset-4 cursor-help">
                        {formattedFee} ETH
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="mb-2">Determined by ECP. Goes into ECP treasury.</p>
                      <a
                        href="https://docs.ethcomments.xyz/channels#creating-a-channel"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:no-underline"
                      >
                        Learn more
                      </a>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                .
              </>
            ) : (
              "Unable to determine fee."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor={nameId}>Community Name *</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Awesome Community"
              disabled={createChannel.isPending || isWaitingForTx}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              rows={3}
              disabled={createChannel.isPending || isWaitingForTx}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={categoryId}>Category</Label>
            <Input
              id={categoryId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., blog, forum, social"
              disabled={createChannel.isPending || isWaitingForTx}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={rulesId}>Rules (one per line)</Label>
            <Textarea
              id={rulesId}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Be respectful&#10;No spam&#10;Stay on topic"
              rows={3}
              disabled={createChannel.isPending || isWaitingForTx}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => createChannel.mutate()}
            disabled={!address || !name.trim() || !channelCreationFee || createChannel.isPending || isWaitingForTx}
            className="w-full"
          >
            {createChannel.isPending || isWaitingForTx ? "Creating..." : `Create (${formattedFee} ETH)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
