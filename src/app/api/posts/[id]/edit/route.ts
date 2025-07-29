import { SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { createEditCommentData, createEditCommentTypedData, getNonce } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createPublicClient, hashTypedData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

function bigintReplacer(_key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { address: currentUserAddress } = await getServerAuth();
    if (!currentUserAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, author, chainId, metadata } = body;
    const commentId = params.id;

    if (!content || !author || !commentId) {
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

    // Create public client to read nonce
    const publicClient = createPublicClient({
      chain: chain.chain,
      transport: http(),
    });

    // Get the nonce for this author-app pair
    const nonce = await getNonce({
      author,
      app: app.address,
      readContract: publicClient.readContract,
    });

    const editData = createEditCommentData({
      commentId: commentId as `0x${string}`,
      content,
      app: app.address,
      nonce,
      metadata: metadata || [],
    });

    const typedEditData = createEditCommentTypedData({
      author,
      edit: editData,
      chainId: chain.chain.id,
    });

    const signature = await app.signTypedData(typedEditData);
    const hash = hashTypedData(typedEditData);

    return NextResponse.json({
      signature,
      hash,
      data: JSON.parse(JSON.stringify(editData, bigintReplacer)),
    });
  } catch (error) {
    console.error("[EDIT-COMMENT] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to sign edit comment",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
