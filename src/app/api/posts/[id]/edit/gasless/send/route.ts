import { editCommentWithSig } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import {
  BadRequestResponseSchema,
  ErrorResponseSchema,
  GaslessEditRequestBodySchema,
  GaslessEditResponseSchema,
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

    const parsedBodyResult = GaslessEditRequestBodySchema.safeParse(await req.json());

    if (!parsedBodyResult.success) {
      return new JSONResponse(BadRequestResponseSchema, parsedBodyResult.error.flatten().fieldErrors, { status: 400 });
    }

    const { signTypedDataParams, appSignature, authorSignature, edit, chainConfig } = parsedBodyResult.data;

    const signer = await getGaslessSigner();
    const submitter = await getGaslessSubmitter();

    const submitterWalletClient = createWalletClient({
      account: submitter,
      chain: chainConfig.chain,
      transport: http(),
    }).extend(publicActions);

    const isAppSignatureValid = await submitterWalletClient.verifyTypedData({
      ...signTypedDataParams,
      signature: appSignature,
      address: signer.address,
    });

    if (!isAppSignatureValid) {
      return new JSONResponse(BadRequestResponseSchema, { signature: ["Invalid app signature"] }, { status: 400 });
    }

    const { txHash } = await editCommentWithSig({
      appSignature,
      authorSignature,
      edit,
      writeContract: submitterWalletClient.writeContract as any,
    });

    return new JSONResponse(GaslessEditResponseSchema, { txHash });
  } catch (error) {
    if (error instanceof GaslessNotAvailableError) {
      return new JSONResponse(ErrorResponseSchema, { error: "Gasless not available" }, { status: 404 });
    }

    console.error("[EDIT-COMMENT-GASLESS-SEND] Error:", error);
    return new JSONResponse(ErrorResponseSchema, { error: "Failed to send gasless edit comment" }, { status: 500 });
  }
}
