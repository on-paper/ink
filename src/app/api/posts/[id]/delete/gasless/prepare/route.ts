import { createDeleteCommentTypedData, deleteCommentWithSig, isApproved } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import {
  BadRequestResponseSchema,
  ErrorResponseSchema,
  PreparedGaslessDeleteCommentApprovedResponseSchema,
  PreparedGaslessDeleteCommentNotApprovedResponseSchema,
  PrepareGaslessDeleteCommentRequestSchema,
} from "~/types/gasless";
import {
  bigintReplacer,
  GaslessNotAvailableError,
  getGaslessSigner,
  getGaslessSubmitter,
  JSONResponse,
} from "~/utils/gasless";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { address: currentUserAddress } = await getServerAuth();
    if (!currentUserAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    body.commentId = params.id;

    const parsedBodyResult = PrepareGaslessDeleteCommentRequestSchema.safeParse(body);

    if (!parsedBodyResult.success) {
      return new JSONResponse(BadRequestResponseSchema, parsedBodyResult.error.flatten().fieldErrors, { status: 400 });
    }

    const { author, commentId, submitIfApproved, chainConfig } = parsedBodyResult.data;

    const signer = await getGaslessSigner();

    // Construct deletion signature data
    const typedDeleteCommentData = createDeleteCommentTypedData({
      commentId: commentId as `0x${string}`,
      chainId: chainConfig.chain.id,
      author,
      app: signer.address,
    });

    const signature = await signer.signTypedData(typedDeleteCommentData);

    if (submitIfApproved) {
      const submitter = await getGaslessSubmitter();
      const walletClient = createWalletClient({
        account: submitter,
        chain: chainConfig.chain,
        transport: http(),
      }).extend(publicActions);

      // Check approval on chain
      const hasApproval = await isApproved({
        app: signer.address,
        author,
        readContract: walletClient.readContract,
      });

      if (hasApproval) {
        // Verify app signature
        const isAppSignatureValid = await walletClient.verifyTypedData({
          ...typedDeleteCommentData,
          signature,
          address: signer.address,
        });

        if (!isAppSignatureValid) {
          return new JSONResponse(
            BadRequestResponseSchema,
            { appSignature: ["Invalid app signature"] },
            { status: 400 },
          );
        }

        const { txHash } = await deleteCommentWithSig({
          ...typedDeleteCommentData.message,
          appSignature: signature,
          writeContract: walletClient.writeContract as any,
        });

        return new JSONResponse(PreparedGaslessDeleteCommentApprovedResponseSchema, {
          txHash,
        });
      }
    }

    return new JSONResponse(
      PreparedGaslessDeleteCommentNotApprovedResponseSchema,
      {
        signTypedDataParams: typedDeleteCommentData,
        appSignature: signature,
      },
      {
        jsonReplacer: bigintReplacer,
      },
    );
  } catch (error) {
    if (error instanceof GaslessNotAvailableError) {
      return new JSONResponse(ErrorResponseSchema, { error: "Gasless not available" }, { status: 404 });
    }

    console.error("[DELETE-COMMENT-GASLESS-PREPARE] Error:", error);

    return new JSONResponse(
      ErrorResponseSchema,
      { error: "Failed to prepare gasless delete comment" },
      { status: 500 },
    );
  }
}
