import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";

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
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

// Cache token metadata fetching with Next.js cache
const getTokenMetadata = unstable_cache(
  async (chainId: string, address: string) => {
    // Find the chain configuration
    const chainIdNum = Number.parseInt(chainId, 10);
    const chain = Object.values(chains).find((c) => c.id === chainIdNum);

    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    // Create public client with the chain's default RPC
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Fetch token metadata
    const [symbol, name, decimals] = await Promise.all([
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
      publicClient
        .readContract({
          address: address as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        })
        .catch(() => null),
    ]);

    if (!symbol) {
      throw new Error("Failed to fetch token metadata");
    }

    return {
      symbol: symbol as string,
      name: (name as string) || (symbol as string),
      decimals: decimals as number,
      address: address.toLowerCase(),
      chainId: chainIdNum,
    };
  },
  ["token-metadata"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["token-metadata"],
  },
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get("chainId");
    const address = searchParams.get("address");

    if (!chainId || !address) {
      return NextResponse.json({ error: "Missing chainId or address" }, { status: 400 });
    }

    // Use Next.js cached function
    const metadata = await getTokenMetadata(chainId, address.toLowerCase());

    // Set cache headers for browser caching
    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Error fetching token metadata:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes("Unsupported chain")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("Failed to fetch")) {
        return NextResponse.json({ error: "Token not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
