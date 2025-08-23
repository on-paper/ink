import { postCommentWithSig } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import { validateAndNormalizeChain } from "~/utils/ecp/postingUtils";
import { getGaslessSubmitter } from "~/utils/gasless";

export const dynamic = "force-dynamic";

interface SubmitRequest {
  signTypedDataParams: any;
  appSignature: string;
  authorSignature: string;
  commentData: any;
  chainId?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json();
    const { signTypedDataParams, appSignature, authorSignature, commentData, chainId } = body;

    if (!signTypedDataParams || !appSignature || !authorSignature || !commentData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { chain } = validateAndNormalizeChain(chainId);

    const submitter = getGaslessSubmitter();
    const submitterWalletClient = createWalletClient({
      account: submitter,
      chain: chain.chain,
      transport: http(),
    }).extend(publicActions);

    // Verify author signature
    const isAuthorSignatureValid = await submitterWalletClient.verifyTypedData({
      ...signTypedDataParams,
      signature: authorSignature as `0x${string}`,
      address: commentData.author as `0x${string}`,
    });

    if (!isAuthorSignatureValid) {
      return NextResponse.json({ error: "Invalid author signature" }, { status: 400 });
    }

    // Verify app signature
    const isAppSignatureValid = await submitterWalletClient.verifyTypedData({
      ...signTypedDataParams,
      signature: appSignature as `0x${string}`,
      address: commentData.app as `0x${string}`,
    });

    if (!isAppSignatureValid) {
      return NextResponse.json({ error: "Invalid app signature" }, { status: 400 });
    }

    // Submit transaction
    const { txHash } = await postCommentWithSig({
      comment: signTypedDataParams.message,
      appSignature: appSignature as `0x${string}`,
      authorSignature: authorSignature as `0x${string}`,
      writeContract: submitterWalletClient.writeContract as any,
    });

    return NextResponse.json({
      txHash,
      success: true,
    });
  } catch (error) {
    console.error("[SUBMIT] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isInsufficientFunds =
      errorMessage.includes("insufficient funds") ||
      errorMessage.includes("exceeds the balance") ||
      errorMessage.includes("not enough funds");

    if (isInsufficientFunds) {
      return NextResponse.json(
        {
          error: "Paper is out of funds",
          code: "INSUFFICIENT_FUNDS",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to submit comment",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
