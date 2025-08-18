"use client";

import { useState } from "react";
import { getOpenSeaUrl } from "~/utils/getOpenSeaUrl";

interface NFTLinkProps {
  chainId: number;
  contractAddress: string;
  tokenId?: string;
  assetNamespace: string;
  colorClasses?: string;
}

export function NFTLink({ chainId, contractAddress, tokenId, assetNamespace, colorClasses = "" }: NFTLinkProps) {
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Optional: Fetch collection name from our API or OpenSea API
  // For now, we'll just use a simple display

  const openSeaUrl = getOpenSeaUrl(chainId, contractAddress, tokenId);

  const displayText = tokenId ? `NFT #${tokenId}` : `${assetNamespace.toUpperCase()} Collection`;

  return (
    <a
      href={openSeaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`lexical-link ${colorClasses} inline-flex items-center gap-1`}
      title={`View on OpenSea: ${contractAddress}${tokenId ? `#${tokenId}` : ""}`}
    >
      <span className="inline-block">🖼️</span>
      <span>{collectionName || displayText}</span>
    </a>
  );
}
