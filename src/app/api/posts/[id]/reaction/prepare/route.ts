import { isApproved, postCommentWithSig } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, hashTypedData, http, publicActions } from "viem";
import {
  createReactionDataWithValidation,
  createTypedCommentData,
  serializeBigInt,
  validateAndNormalizeChain,
} from "~/utils/ecp/postingUtils";
import { getGaslessSubmitter } from "~/utils/gasless";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

interface PrepareReactionRequest {
  reactionType: "like" | "repost";
  author: string;
  chainId?: number;
  channelId?: string | number;
  mode?: "auto" | "gasless" | "regular";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { address: currentUserAddress } = await getServerAuth();
    if (!currentUserAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PrepareReactionRequest = await req.json();
    const { reactionType, author, chainId, channelId, mode = "auto" } = body;
    const parentId = params.id;

    if (!reactionType || !author || !parentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { chain } = validateAndNormalizeChain(chainId);

    const { commentData, app } = createReactionDataWithValidation({
      reactionType,
      parentId,
      author,
      channelId,
    });

    const typedCommentData = createTypedCommentData(commentData, chain.chain.id);
    const appSignature = await app.signTypedData(typedCommentData);
    const hash = hashTypedData(typedCommentData);

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
            const { txHash } = await postCommentWithSig({
              comment: typedCommentData.message,
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
              console.warn("[REACTION-PREPARE] Gasless funds insufficient, falling back to regular mode");
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
            signTypedDataParams: typedCommentData,
            appSignature,
            hash,
            commentData: serializeBigInt(commentData),
          });
        }
      } catch (gaslessError) {
        if (mode === "gasless") {
          // Explicit gasless mode failed
          console.error("[REACTION-PREPARE] Gasless error:", gaslessError);
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
      commentData: serializeBigInt(commentData),
    });
  } catch (error) {
    console.error("[REACTION-PREPARE] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to prepare reaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
