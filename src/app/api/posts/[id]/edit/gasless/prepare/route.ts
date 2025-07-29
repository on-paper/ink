import {
  createEditCommentData,
  createEditCommentTypedData,
  editCommentWithSig,
  getNonce,
  isApproved,
} from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, publicActions } from "viem";
import {
  BadRequestResponseSchema,
  ErrorResponseSchema,
  PreparedGaslessEditCommentApprovedResponseSchema,
  PreparedGaslessEditCommentNotApprovedResponseSchema,
  PrepareGaslessEditCommentRequestSchema,
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

    const signer = await getGaslessSigner();
    const body = await req.json();
    body.commentId = params.id;

    const parsedBodyResult = PrepareGaslessEditCommentRequestSchema.safeParse(body);

    if (!parsedBodyResult.success) {
      return new JSONResponse(BadRequestResponseSchema, parsedBodyResult.error.flatten().fieldErrors, { status: 400 });
    }

    const { commentId, content, author, metadata, submitIfApproved, chainConfig } = parsedBodyResult.data;

    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http(),
    });

    const nonce = await getNonce({
      author,
      app: signer.address,
      readContract: publicClient.readContract,
    });

    const edit = createEditCommentData({
      commentId,
      content,
      app: signer.address,
      nonce,
      metadata,
    });

    const typedCommentData = createEditCommentTypedData({
      edit,
      chainId: chainConfig.chain.id,
      author,
    });

    const signature = await signer.signTypedData(typedCommentData);

    if (submitIfApproved) {
      const submitter = await getGaslessSubmitter();

      const submitterWalletClient = createWalletClient({
        account: submitter,
        chain: chainConfig.chain,
        transport: http(),
      }).extend(publicActions);

      // Check approval on chain
      const hasApproval = await isApproved({
        app: signer.address,
        author,
        readContract: submitterWalletClient.readContract,
      });

      if (hasApproval) {
        // Verify app signature
        const isAppSignatureValid = await submitterWalletClient.verifyTypedData({
          ...typedCommentData,
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

        const { txHash } = await editCommentWithSig({
          edit: typedCommentData.message,
          appSignature: signature,
          writeContract: submitterWalletClient.writeContract as any,
        });

        return new JSONResponse(
          PreparedGaslessEditCommentApprovedResponseSchema,
          {
            txHash,
            appSignature: signature,
            chainId: chainConfig.chain.id,
            edit,
          },
          {
            jsonReplacer: bigintReplacer,
          },
        );
      }
    }

    return new JSONResponse(
      PreparedGaslessEditCommentNotApprovedResponseSchema,
      {
        signTypedDataParams: typedCommentData,
        appSignature: signature,
        chainId: chainConfig.chain.id,
        edit,
      },
      {
        jsonReplacer: bigintReplacer,
      },
    );
  } catch (error) {
    if (error instanceof GaslessNotAvailableError) {
      return new JSONResponse(ErrorResponseSchema, { error: "Gasless not available" }, { status: 404 });
    }

    console.error("[EDIT-COMMENT-GASLESS-PREPARE] Error:", error);
    return new JSONResponse(ErrorResponseSchema, { error: "Failed to prepare gasless edit comment" }, { status: 500 });
  }
}
