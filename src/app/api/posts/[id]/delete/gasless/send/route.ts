import { deleteCommentWithSig } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import {
  BadRequestResponseSchema,
  ErrorResponseSchema,
  GaslessDeleteCommentRequestBodySchema,
  GaslessDeleteCommentResponseSchema,
} from "~/types/gasless";
import { GaslessNotAvailableError, getGaslessSigner, getGaslessSubmitter, JSONResponse } from "~/utils/gasless";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { address: currentUserAddress } = await getServerAuth();
    if (!currentUserAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedBodyResult = GaslessDeleteCommentRequestBodySchema.safeParse(await req.json());

    if (!parsedBodyResult.success) {
      return new JSONResponse(BadRequestResponseSchema, parsedBodyResult.error.flatten().fieldErrors, { status: 400 });
    }

    const { signTypedDataParams, appSignature, authorSignature, chainConfig } = parsedBodyResult.data;

    // Check that signature is from the app signer
    const signer = await getGaslessSigner();

    // Can be any account with funds for gas on desired chain
    const submitterAccount = await getGaslessSubmitter();

    const walletClient = createWalletClient({
      account: submitterAccount,
      chain: chainConfig.chain,
      transport: http(),
    }).extend(publicActions);

    const isAppSignatureValid = await walletClient.verifyTypedData({
      ...signTypedDataParams,
      signature: appSignature,
      address: signer.address,
    });

    if (!isAppSignatureValid) {
      return new JSONResponse(BadRequestResponseSchema, { appSignature: ["Invalid app signature"] }, { status: 400 });
    }

    const { txHash } = await deleteCommentWithSig({
      ...signTypedDataParams.message,
      appSignature,
      authorSignature,
      writeContract: walletClient.writeContract as any,
    });

    return new JSONResponse(GaslessDeleteCommentResponseSchema, { txHash });
  } catch (error) {
    if (error instanceof GaslessNotAvailableError) {
      return new JSONResponse(ErrorResponseSchema, { error: "Gasless not available" }, { status: 404 });
    }

    console.error("[DELETE-COMMENT-GASLESS-SEND] Error:", error);
    return new JSONResponse(ErrorResponseSchema, { error: "Failed to delete comment" }, { status: 500 });
  }
}
