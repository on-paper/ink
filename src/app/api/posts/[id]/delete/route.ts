import { SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { createDeleteCommentTypedData } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { hashTypedData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getDefaultChainId } from "~/config/chains";
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
    const { author, chainId } = body;
    const commentId = params.id;

    if (!author || !commentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appPrivateKey = process.env.APP_SIGNER_PRIVATE_KEY;
    if (!appPrivateKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
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

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24);

    const typedDeleteData = createDeleteCommentTypedData({
      author,
      commentId: commentId as `0x${string}`,
      app: app.address,
      deadline,
      chainId: chain.chain.id,
    });

    const signature = await app.signTypedData(typedDeleteData);
    const hash = hashTypedData(typedDeleteData);

    const deleteData = {
      commentId,
      app: app.address,
      deadline: deadline.toString(),
    };

    return NextResponse.json({
      signature,
      hash,
      data: deleteData,
    });
  } catch (error) {
    console.error("[DELETE-COMMENT] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to sign delete comment",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
