import { isApproved, postCommentWithSig } from "@ecp.eth/sdk/comments";
import { type NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import { getPublicClient } from "~/lib/viem";
import {
  createCommentDataWithValidation,
  createTypedCommentData,
  getAppSigner,
  serializeBigInt,
  validateAndNormalizeChain,
} from "~/utils/ecp/postingUtils";
import { getGaslessSubmitter } from "~/utils/gasless";

export const dynamic = "force-dynamic";

type PostingMode = "auto" | "gasless" | "regular";
type ResponseMode = "gasless_submitted" | "gasless_pending" | "regular";

interface PrepareRequest {
  content: string;
  author: string;
  parentId?: string;
  channelId?: string | number;
  targetUri?: string;
  chainId?: number;
  mode?: PostingMode;
  submitIfApproved?: boolean;
}

interface PrepareResponse {
  mode: ResponseMode;
  txHash?: string;
  appSignature: string;
  commentData: any;
  signTypedDataParams?: any;
  requiresUserSignature: boolean;
  requiresUserTransaction: boolean;
  chainId: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: PrepareRequest = await req.json();
    const { content, author, parentId, channelId, targetUri, chainId, mode = "auto", submitIfApproved = true } = body;

    // Validate chain
    const { chainIdToUse, chain } = validateAndNormalizeChain(chainId);

    // Determine actual mode based on approval status if auto
    let actualMode: PostingMode = mode;
    if (mode === "auto") {
      try {
        const app = getAppSigner();
        const publicClient = getPublicClient(chain.chain);
        const hasApproval = await isApproved({
          app: app.address,
          author: author as `0x${string}`,
          readContract: publicClient.readContract,
        });
        actualMode = hasApproval ? "gasless" : "regular";
      } catch (error) {
        console.warn("[PREPARE] Failed to check approval, falling back to regular:", error);
        actualMode = "regular";
      }
    }

    // Create comment data based on mode
    const requireNonce = actualMode === "gasless";
    const { commentData, app } = await createCommentDataWithValidation({
      content,
      author,
      parentId,
      channelId,
      targetUri,
      requireNonce,
    });

    // Create typed data for signing
    const typedCommentData = createTypedCommentData(commentData, chain.chain.id);

    // Sign with app key
    const appSignature = await app.signTypedData(typedCommentData);

    // Handle gasless mode
    if (actualMode === "gasless") {
      // Check if we should auto-submit
      if (submitIfApproved) {
        try {
          const publicClient = getPublicClient(chain.chain);
          const hasApproval = await isApproved({
            app: app.address,
            author: author as `0x${string}`,
            readContract: publicClient.readContract,
          });

          if (hasApproval) {
            // Auto-submit the transaction
            const submitter = getGaslessSubmitter();
            const submitterWalletClient = createWalletClient({
              account: submitter,
              chain: chain.chain,
              transport: http(),
            }).extend(publicActions);

            // Verify app signature
            const isAppSignatureValid = await submitterWalletClient.verifyTypedData({
              ...typedCommentData,
              signature: appSignature,
              address: app.address,
            });

            if (!isAppSignatureValid) {
              throw new Error("Invalid app signature");
            }

            // Submit transaction
            const { txHash } = await postCommentWithSig({
              comment: typedCommentData.message,
              appSignature,
              writeContract: submitterWalletClient.writeContract as any,
            });

            // Return success response
            const response: PrepareResponse = {
              mode: "gasless_submitted",
              txHash,
              appSignature,
              commentData: serializeBigInt(commentData),
              chainId: chain.chain.id,
              requiresUserSignature: false,
              requiresUserTransaction: false,
            };

            return NextResponse.json(response);
          }
        } catch (error) {
          console.error("[PREPARE] Failed to auto-submit gasless:", error);

          // Check for insufficient funds
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
                fallbackMode: "regular",
              },
              { status: 503 },
            );
          }

          // For other errors, continue to gasless_pending mode
        }
      }

      // Return gasless_pending response
      const response: PrepareResponse = {
        mode: "gasless_pending",
        appSignature,
        commentData: serializeBigInt(commentData),
        signTypedDataParams: typedCommentData,
        chainId: chain.chain.id,
        requiresUserSignature: true,
        requiresUserTransaction: false,
      };

      return NextResponse.json(response);
    }

    // Regular mode response
    const response: PrepareResponse = {
      mode: "regular",
      appSignature,
      commentData: serializeBigInt(commentData),
      chainId: chain.chain.id,
      requiresUserSignature: false,
      requiresUserTransaction: true,
    };

    // For backward compatibility with /api/sign
    if (req.headers.get("X-Legacy-Client") === "true") {
      return NextResponse.json({
        signature: appSignature,
        commentData: serializeBigInt(commentData),
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PREPARE] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to prepare comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
