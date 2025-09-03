import { COMMENT_MANAGER_ADDRESS, CommentManagerABI } from "@ecp.eth/sdk";
import { isApproved } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { getDefaultChain } from "~/config/chains";
import { getPublicClient } from "~/lib/viem";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY,
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`[APPROVAL-STATUS] Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        await sleep(delay * 2 ** attempt);
      }
    }
  }

  throw lastError;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const author = searchParams.get("author");

    if (!author || !author.startsWith("0x") || author.length !== 42) {
      return NextResponse.json({ error: "Valid author address is required" }, { status: 400 });
    }

    const appPrivateKey = process.env.APP_SIGNER_PRIVATE_KEY;
    if (!appPrivateKey) {
      return NextResponse.json({ error: "App signer not configured" }, { status: 500 });
    }

    const formattedPrivateKey = appPrivateKey.startsWith("0x") ? appPrivateKey : `0x${appPrivateKey}`;
    const app = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    const publicClient = getPublicClient(getDefaultChain());

    const authorAddress = author as `0x${string}`;
    const appAddress = app.address;

    const approved = await retryOperation(async () => {
      return await isApproved({
        app: appAddress,
        author: authorAddress,
        readContract: publicClient.readContract,
      });
    });

    if (!approved) {
      return NextResponse.json(
        {
          isApproved: false,
          expiry: null,
          appAddress: appAddress,
          author: authorAddress,
          timestamp: Date.now(),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    let expiry: bigint | null = null;
    try {
      expiry = await retryOperation(async () => {
        const result = await publicClient.readContract({
          address: COMMENT_MANAGER_ADDRESS as `0x${string}`,
          abi: CommentManagerABI,
          functionName: "getApprovalExpiry",
          args: [authorAddress, appAddress],
        });
        return result as bigint;
      });
    } catch (error) {
      console.warn("[APPROVAL-STATUS] Failed to get expiry after retries:", error);
    }

    const expiryNumber = expiry ? Number(expiry) : null;
    const isExpired = expiryNumber ? expiryNumber * 1000 < Date.now() : false;

    return NextResponse.json(
      {
        isApproved: !isExpired,
        expiry: expiryNumber,
        appAddress: appAddress,
        author: authorAddress,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("[APPROVAL-STATUS] Critical error:", error);
    return NextResponse.json(
      {
        error: "Failed to check approval status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
