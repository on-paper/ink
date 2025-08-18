export function getOpenSeaUrl(chainId: number, contractAddress: string, tokenId?: string): string {
  const chainMap: Record<number, string> = {
    1: "ethereum", // Ethereum Mainnet
    137: "matic", // Polygon
    42161: "arbitrum", // Arbitrum
    10: "optimism", // Optimism
    8453: "base", // Base
    43114: "avalanche", // Avalanche
    56: "bsc", // BNB Chain
    11155111: "sepolia", // Sepolia testnet
  };

  const chain = chainMap[chainId] || "ethereum";

  if (tokenId) {
    return `https://opensea.io/assets/${chain}/${contractAddress}/${tokenId}`;
  }
  return `https://opensea.io/assets/${chain}/${contractAddress}`;
}
