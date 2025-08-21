import { SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { createCommentData, createCommentTypedData, getNonce } from "@ecp.eth/sdk/comments";
import { privateKeyToAccount } from "viem/accounts";
import { getDefaultChainId } from "~/config/chains";
import { getPublicClient } from "~/lib/viem";

/**
 * Validates and normalizes chain configuration
 */
export function validateAndNormalizeChain(chainId?: number) {
  const defaultChainId = getDefaultChainId();
  let chainIdToUse = chainId || defaultChainId;
  let chain = SUPPORTED_CHAINS[chainIdToUse as keyof typeof SUPPORTED_CHAINS];

  if (!chain) {
    console.warn(`Unsupported chain ID: ${chainIdToUse}, falling back to default chain ${defaultChainId}`);
    chainIdToUse = defaultChainId;
    chain = SUPPORTED_CHAINS[defaultChainId as keyof typeof SUPPORTED_CHAINS];
    if (!chain) {
      throw new Error(`Default chain ${defaultChainId} is not supported`);
    }
  }

  return { chainIdToUse, chain };
}

/**
 * Gets the app signer account from environment variable
 */
export function getAppSigner() {
  const appPrivateKey = process.env.APP_SIGNER_PRIVATE_KEY;
  if (!appPrivateKey) {
    throw new Error("APP_SIGNER_PRIVATE_KEY is not configured");
  }

  const formattedPrivateKey = appPrivateKey.startsWith("0x") ? appPrivateKey : `0x${appPrivateKey}`;
  return privateKeyToAccount(formattedPrivateKey as `0x${string}`);
}

/**
 * Serializes BigInt values in an object to strings for JSON serialization
 */
export function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    }),
  );
}

export interface CreateCommentDataParams {
  content: string;
  author: string;
  parentId?: string;
  channelId?: string | number;
  targetUri?: string;
  requireNonce?: boolean;
}

/**
 * Creates comment data with proper validation and formatting
 */
export async function createCommentDataWithValidation({
  content,
  author,
  parentId,
  channelId,
  targetUri,
  requireNonce = false,
}: CreateCommentDataParams) {
  if (!content || !author) {
    throw new Error("Missing required fields: content and author");
  }

  const app = getAppSigner();
  const channelIdBigInt = channelId && channelId !== "0" ? BigInt(channelId) : null;

  let nonce: bigint | undefined;
  if (requireNonce) {
    const { chain } = validateAndNormalizeChain();
    const publicClient = getPublicClient(chain.chain);
    nonce = await getNonce({
      author: author as `0x${string}`,
      app: app.address,
      readContract: publicClient.readContract,
    });
  }

  const commentData = createCommentData({
    content,
    author: author as `0x${string}`,
    app: app.address,
    ...(nonce !== undefined ? { nonce } : {}),
    ...(parentId
      ? {
          parentId: parentId as `0x${string}`,
          ...(channelIdBigInt ? { channelId: channelIdBigInt } : {}),
        }
      : {
          targetUri: channelIdBigInt ? "" : targetUri || "app://paper.ink",
          ...(channelIdBigInt ? { channelId: channelIdBigInt } : {}),
        }),
  } as any);

  return { commentData, app };
}

/**
 * Creates typed comment data for signing
 */
export function createTypedCommentData(commentData: any, chainId: number) {
  return createCommentTypedData({
    commentData,
    chainId,
  });
}