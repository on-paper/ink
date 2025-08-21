import { COMMENT_TYPE_REACTION, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import {
  createCommentData,
  createCommentTypedData,
  createDeleteCommentTypedData,
  createEditCommentData,
  createEditCommentTypedData,
  getNonce,
} from "@ecp.eth/sdk/comments";
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

export interface CreateEditDataParams {
  commentId: string;
  content: string;
  author: string;
  metadata?: any[];
  requireNonce?: boolean;
}

/**
 * Creates edit data with proper validation and formatting
 */
export async function createEditDataWithValidation({
  commentId,
  content,
  author,
  metadata = [],
  requireNonce = false,
}: CreateEditDataParams) {
  if (!commentId || !content || !author) {
    throw new Error("Missing required fields: commentId, content, and author");
  }

  const app = getAppSigner();

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

  const editData = createEditCommentData({
    commentId: commentId as `0x${string}`,
    content,
    app: app.address,
    nonce: nonce!,
    metadata,
  });

  return { editData, app };
}

/**
 * Creates typed edit data for signing
 */
export function createTypedEditData(editData: any, author: string, chainId: number) {
  return createEditCommentTypedData({
    edit: editData,
    author: author as `0x${string}`,
    chainId,
  });
}

export interface CreateDeleteDataParams {
  commentId: string;
  author: string;
}

/**
 * Creates delete data with proper validation
 */
export function createDeleteDataWithValidation({ commentId, author }: CreateDeleteDataParams) {
  if (!commentId || !author) {
    throw new Error("Missing required fields: commentId and author");
  }

  const app = getAppSigner();
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24);

  return {
    deleteData: {
      commentId: commentId as `0x${string}`,
      app: app.address,
      deadline,
    },
    app,
  };
}

/**
 * Creates typed delete data for signing
 */
export function createTypedDeleteData(params: {
  author: string;
  commentId: string;
  app: string;
  deadline: bigint;
  chainId: number;
}) {
  return createDeleteCommentTypedData({
    ...params,
    author: params.author as `0x${string}`,
    commentId: params.commentId as `0x${string}`,
    app: params.app as `0x${string}`,
  });
}

export interface CreateReactionDataParams {
  reactionType: "like" | "repost";
  parentId: string;
  author: string;
  channelId?: string | number;
}

/**
 * Creates reaction data with proper validation
 */
export function createReactionDataWithValidation({
  reactionType,
  parentId,
  author,
  channelId,
}: CreateReactionDataParams) {
  if (!reactionType || !parentId || !author) {
    throw new Error("Missing required fields: reactionType, parentId, and author");
  }

  const app = getAppSigner();
  const channelIdBigInt = channelId && channelId !== "0" ? BigInt(channelId) : null;

  const commentData = createCommentData({
    content: reactionType,
    author: author as `0x${string}`,
    app: app.address,
    parentId: parentId as `0x${string}`,
    commentType: COMMENT_TYPE_REACTION,
    ...(channelIdBigInt ? { channelId: channelIdBigInt } : {}),
  });

  return { commentData, app };
}
