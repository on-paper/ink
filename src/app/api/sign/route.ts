import { SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { createCommentData, createCommentTypedData } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { getDefaultChainId } from "~/config/chains";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, targetUri, parentId, author, chainId, channelId } = body;

    if (!content || !author) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appPrivateKey = process.env.APP_SIGNER_PRIVATE_KEY;
    if (!appPrivateKey) {
      console.error("[SIGN-COMMENT] APP_SIGNER_PRIVATE_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: APP_SIGNER_PRIVATE_KEY not configured" },
        { status: 500 },
      );
    }

    const formattedPrivateKey = appPrivateKey.startsWith("0x") ? appPrivateKey : `0x${appPrivateKey}`;
    const app = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    const defaultChainId = getDefaultChainId();
    let chainIdToUse = chainId || defaultChainId;
    let chain = SUPPORTED_CHAINS[chainIdToUse];

    if (!chain) {
      // If the chain is not supported, use the default chain instead of throwing an error
      console.warn(`Unsupported chain ID: ${chainIdToUse}, falling back to default chain ${defaultChainId}`);
      chainIdToUse = defaultChainId;
      chain = SUPPORTED_CHAINS[defaultChainId];
      if (!chain) {
        return NextResponse.json({ error: `Default chain ${defaultChainId} is not supported` }, { status: 500 });
      }
    }

    // Only include channelId if it's not "0" or empty
    const channelIdBigInt = channelId && channelId !== "0" ? BigInt(channelId) : null;

    const commentData = createCommentData({
      content,
      author,
      app: app.address,
      ...(parentId
        ? {
            parentId,
            // Include channelId for replies in channels
            ...(channelIdBigInt ? { channelId: channelIdBigInt } : {}),
          }
        : {
            targetUri: channelIdBigInt ? "" : targetUri || "app://paper.ink",
            ...(channelIdBigInt ? { channelId: channelIdBigInt } : {}),
          }),
    } as any);

    const typedCommentData = createCommentTypedData({
      commentData,
      chainId: chain.chain.id,
    });

    const signature = await app.signTypedData(typedCommentData);

    const serializedCommentData = JSON.parse(
      JSON.stringify(commentData, (_key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      }),
    );

    return NextResponse.json({
      signature,
      commentData: serializedCommentData,
    });
  } catch (error) {
    console.error("[SIGN-COMMENT] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to sign comment",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
