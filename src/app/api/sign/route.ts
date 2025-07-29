import { SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { createCommentData, createCommentTypedData } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const formattedPrivateKey = appPrivateKey.startsWith("0x") ? appPrivateKey : `0x${appPrivateKey}`;
    const app = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    const chainIdToUse = chainId || 8453;
    const chain = SUPPORTED_CHAINS[chainIdToUse];
    if (!chain) {
      return NextResponse.json({ error: `Unsupported chain ID: ${chainIdToUse}` }, { status: 400 });
    }

    const commentData = createCommentData({
      content,
      author,
      app: app.address,
      ...(parentId
        ? { parentId }
        : {
            targetUri: channelId ? undefined : targetUri || "app://pingpad.io",
            ...(channelId ? { channelId } : {}),
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
