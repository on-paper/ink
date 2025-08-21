import { deleteCommentWithSig, isApproved } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, hashTypedData, http, publicActions } from "viem";
import {
  createDeleteDataWithValidation,
  createTypedDeleteData,
  serializeBigInt,
  validateAndNormalizeChain,
} from "~/utils/ecp/postingUtils";
import { getGaslessSubmitter } from "~/utils/gasless";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

interface PrepareDeleteRequest {
  author: string;
  chainId?: number;
  mode?: "auto" | "gasless" | "regular";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { address: currentUserAddress } = await getServerAuth();
    if (!currentUserAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PrepareDeleteRequest = await req.json();
    const { author, chainId, mode = "auto" } = body;
    const commentId = params.id;

    if (!author || !commentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { chain } = validateAndNormalizeChain(chainId);
    const { deleteData, app } = createDeleteDataWithValidation({
      commentId,
      author,
    });

    const typedDeleteData = createTypedDeleteData({
      author: author as `0x${string}`,
      commentId: deleteData.commentId,
      app: deleteData.app,
      deadline: deleteData.deadline,
      chainId: chain.chain.id,
    });

    const appSignature = await app.signTypedData(typedDeleteData);
    const hash = hashTypedData(typedDeleteData);

    // Check if we should attempt gasless (auto mode or explicit gasless mode)
    if (mode === "auto" || mode === "gasless") {
      try {
        const submitter = getGaslessSubmitter();
        const submitterWalletClient = createWalletClient({
          account: submitter,
          chain: chain.chain,
          transport: http(),
        }).extend(publicActions);

        // Check if user has approved the app
        const hasApproval = await isApproved({
          app: app.address,
          author: author as `0x${string}`,
          readContract: submitterWalletClient.readContract,
        });

        if (hasApproval) {
          // Submit gasless transaction directly
          try {
            const { txHash } = await deleteCommentWithSig({
              commentId: deleteData.commentId,
              app: deleteData.app,
              deadline: deleteData.deadline,
              appSignature: appSignature as `0x${string}`,
              writeContract: submitterWalletClient.writeContract as any,
            });

            return NextResponse.json({
              mode: "gasless_submitted",
              txHash,
              success: true,
            });
          } catch (submitError) {
            const errorMessage = submitError instanceof Error ? submitError.message : "Unknown error";
            const isInsufficientFunds =
              errorMessage.includes("insufficient funds") ||
              errorMessage.includes("exceeds the balance") ||
              errorMessage.includes("not enough funds");

            if (isInsufficientFunds) {
              console.warn("[DELETE-PREPARE] Gasless funds insufficient, falling back to regular mode");
              // Fall through to regular mode
            } else {
              throw submitError;
            }
          }
        }

        // User has not approved, return pending response
        if (mode === "gasless") {
          return NextResponse.json({
            mode: "gasless_pending",
            signTypedDataParams: typedDeleteData,
            appSignature,
            hash,
            data: serializeBigInt(deleteData),
          });
        }
      } catch (gaslessError) {
        if (mode === "gasless") {
          // Explicit gasless mode failed
          console.error("[DELETE-PREPARE] Gasless error:", gaslessError);
          return NextResponse.json(
            {
              error: "Gasless not available",
              details: gaslessError instanceof Error ? gaslessError.message : "Unknown error",
            },
            { status: 500 },
          );
        }
        // Auto mode: fall through to regular
      }
    }

    // Regular mode: return signature for user to sign
    return NextResponse.json({
      mode: "regular",
      signature: appSignature,
      hash,
      data: serializeBigInt(deleteData),
    });
  } catch (error) {
    console.error("[DELETE-PREPARE] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to prepare delete",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
