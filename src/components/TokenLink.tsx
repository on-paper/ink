"use client";

import { useEffect, useState } from "react";

interface TokenLinkProps {
  chainId: number;
  tokenAddress: string;
  scanUrl: string;
  colorClasses?: string;
}

interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
}

export function TokenLink({ chainId, tokenAddress, scanUrl, colorClasses = "" }: TokenLinkProps) {
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch token metadata from API
    fetch(`/api/token?chainId=${chainId}&address=${tokenAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.symbol) {
          setMetadata(data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch token metadata:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [chainId, tokenAddress]);

  const displayText = metadata?.symbol
    ? `$${metadata.symbol}`
    : `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;

  return (
    <a
      href={scanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`lexical-link ${colorClasses} ${isLoading ? "opacity-70" : ""}`}
      title={metadata?.name || tokenAddress}
    >
      {displayText}
    </a>
  );
}
