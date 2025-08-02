export function getScanUrl(chainId: number, type: "address" | "token" | "tx", identifier: string): string {
  const scanners: Record<number, string> = {
    1: "https://etherscan.io", // Ethereum Mainnet
    8453: "https://basescan.org", // Base
    10: "https://optimistic.etherscan.io", // Optimism
    137: "https://polygonscan.com", // Polygon
    42161: "https://arbiscan.io", // Arbitrum
  };

  const baseUrl = scanners[chainId] || scanners[1]; // Default to Etherscan

  switch (type) {
    case "address":
      return `${baseUrl}/address/${identifier}`;
    case "token":
      return `${baseUrl}/token/${identifier}`;
    case "tx":
      return `${baseUrl}/tx/${identifier}`;
    default:
      return `${baseUrl}/address/${identifier}`;
  }
}
