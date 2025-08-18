import * as chains from "viem/chains";

export function getScanUrl(chainId: number, type: "address" | "token" | "tx", identifier: string): string {
  const chain = Object.values(chains).find((c) => c.id === chainId);
  const explorer = chain?.blockExplorers?.default;

  if (!explorer?.url) {
    const baseUrl = "https://etherscan.io";
    return `${baseUrl}/${type}/${identifier}`;
  }

  switch (type) {
    case "address":
      return `${explorer.url}/address/${identifier}`;
    case "token":
      return `${explorer.url}/token/${identifier}`;
    case "tx":
      return `${explorer.url}/tx/${identifier}`;
    default:
      return `${explorer.url}/address/${identifier}`;
  }
}
