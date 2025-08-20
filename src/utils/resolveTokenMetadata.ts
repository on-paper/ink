import { unstable_cache } from "next/cache";
import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";
import { parseCAIP19URI } from "./caip19";

const erc20Abi = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
] as const;

export interface TokenData {
  symbol: string;
  name: string;
  address: string;
  chainId: number;
}

const fetchTokenMetadata = unstable_cache(
  async (chainId: number, address: string): Promise<TokenData | null> => {
    try {
      const chain = Object.values(chains).find((c) => c.id === chainId);
      if (!chain) return null;

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const [symbol, name] = await Promise.all([
        publicClient
          .readContract({
            address: address as `0x${string}`,
            abi: erc20Abi,
            functionName: "symbol",
          })
          .catch(() => null),
        publicClient
          .readContract({
            address: address as `0x${string}`,
            abi: erc20Abi,
            functionName: "name",
          })
          .catch(() => null),
      ]);

      if (!symbol) return null;

      return {
        symbol: symbol as string,
        name: (name as string) || (symbol as string),
        address: address.toLowerCase(),
        chainId,
      };
    } catch {
      return null;
    }
  },
  ["token-metadata-server"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["token-metadata"],
  },
);

export function extractCAIP19URIs(content: string): string[] {
  const caipRegex = /\b(eip155:\d+\/erc[a-z0-9]{2,5}:0x[a-fA-F0-9]{40}(?:\/\d{1,78})?)\b/gi;
  const uris: string[] = [];
  let match;

  while ((match = caipRegex.exec(content)) !== null) {
    uris.push(match[1]);
  }

  return [...new Set(uris)]; // Remove duplicates
}

export async function resolveTokenMetadataFromContent(content: string): Promise<Record<string, TokenData>> {
  const uris = extractCAIP19URIs(content);
  const metadata: Record<string, TokenData> = {};

  await Promise.all(
    uris.map(async (uri) => {
      const components = parseCAIP19URI(uri);

      if (components?.assetNamespace === "erc20" && components.assetReference && components.chainId) {
        const chainId =
          typeof components.chainId === "string" ? Number.parseInt(components.chainId, 10) : components.chainId;

        const tokenMetadata = await fetchTokenMetadata(chainId, components.assetReference);

        if (tokenMetadata) {
          metadata[uri] = tokenMetadata;
        }
      }
    }),
  );

  return metadata;
}
