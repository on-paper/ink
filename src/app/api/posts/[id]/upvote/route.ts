import { COMMENT_TYPE_REACTION, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { createCommentData, createCommentTypedData } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { getDefaultChainId } from "~/config/chains";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { author, chainId } = await req.json();

    if (!author) {
      return NextResponse.json({ error: "Missing author field" }, { status: 400 });
    }

    const appPrivateKey = process.env.APP_SIGNER_PRIVATE_KEY;
    if (!appPrivateKey) {
      console.error("[UPVOTE] APP_SIGNER_PRIVATE_KEY is not set");
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
      console.warn(`Unsupported chain ID: ${chainIdToUse}, falling back to default chain ${defaultChainId}`);
      chainIdToUse = defaultChainId;
      chain = SUPPORTED_CHAINS[defaultChainId];
      if (!chain) {
        return NextResponse.json({ error: `Default chain ${defaultChainId} is not supported` }, { status: 500 });
      }
    }

    const commentData = createCommentData({
      content: "like",
      author,
      app: app.address,
      parentId: params.id as `0x${string}`,
      commentType: COMMENT_TYPE_REACTION,
    });

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
    console.error("[UPVOTE] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create upvote",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest) {
  return NextResponse.json({ error: "Not implemented yet" }, { status: 501 });
}
