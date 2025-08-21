import { SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import {
  DeleteCommentTypedDataSchema,
  EditCommentDataSchema,
  EditCommentTypedDataSchema,
  MetadataArraySchema,
} from "@ecp.eth/sdk/comments/schemas";
import { HexSchema } from "@ecp.eth/sdk/core/schemas";
import { z } from "zod";
import { getDefaultChainId } from "~/config/chains";

export const BadRequestResponseSchema = z.record(z.string(), z.string().array());

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export const PrepareGaslessEditCommentRequestSchema = z
  .object({
    commentId: HexSchema,
    content: z.string().trim().min(1),
    author: HexSchema,
    metadata: MetadataArraySchema.optional().default([]),
    submitIfApproved: z.boolean().optional().default(false),
    chainId: z
      .number()
      .optional()
      .default(() => getDefaultChainId()),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId as keyof typeof SUPPORTED_CHAINS],
    };
  });

export const PreparedGaslessEditCommentNotApprovedResponseSchema = z.object({
  signTypedDataParams: EditCommentTypedDataSchema,
  appSignature: HexSchema,
  chainId: z.number(),
  edit: EditCommentDataSchema,
});

export const PreparedGaslessEditCommentApprovedResponseSchema = z.object({
  txHash: HexSchema,
  appSignature: HexSchema,
  chainId: z.number(),
  edit: EditCommentDataSchema,
});

export const GaslessEditRequestBodySchema = z
  .object({
    signTypedDataParams: EditCommentTypedDataSchema,
    appSignature: HexSchema,
    authorSignature: HexSchema,
    edit: EditCommentDataSchema,
    chainId: z
      .number()
      .optional()
      .default(() => getDefaultChainId()),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId as keyof typeof SUPPORTED_CHAINS],
    };
  });

export const GaslessEditResponseSchema = z.object({
  txHash: HexSchema,
});

// Delete comment gasless schemas
export const PrepareGaslessDeleteCommentRequestSchema = z
  .object({
    author: HexSchema,
    commentId: HexSchema,
    submitIfApproved: z.boolean().optional().default(false),
    chainId: z
      .number()
      .optional()
      .default(() => getDefaultChainId()),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId as keyof typeof SUPPORTED_CHAINS],
    };
  });

export const PreparedGaslessDeleteCommentApprovedResponseSchema = z.object({
  txHash: HexSchema,
});

export const PreparedGaslessDeleteCommentNotApprovedResponseSchema = z.object({
  signTypedDataParams: DeleteCommentTypedDataSchema,
  appSignature: HexSchema,
});

export const GaslessDeleteCommentRequestBodySchema = z
  .object({
    signTypedDataParams: DeleteCommentTypedDataSchema,
    authorSignature: HexSchema,
    appSignature: HexSchema,
    chainId: z
      .number()
      .optional()
      .default(() => getDefaultChainId()),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId as keyof typeof SUPPORTED_CHAINS],
    };
  });

export const GaslessDeleteCommentResponseSchema = z.object({
  txHash: HexSchema,
});

export const PrepareGaslessCommentRequestSchema = z
  .object({
    content: z.string().trim().min(1),
    author: HexSchema,
    targetUri: z.string().optional(),
    parentId: HexSchema.optional(),
    channelId: z.union([z.string(), z.number()]).optional(),
    metadata: MetadataArraySchema.optional().default([]),
    submitIfApproved: z.boolean().optional().default(true),
    chainId: z
      .number()
      .optional()
      .default(() => getDefaultChainId()),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId as keyof typeof SUPPORTED_CHAINS],
    };
  });

export const PreparedGaslessCommentNotApprovedResponseSchema = z.object({
  signTypedDataParams: z.any(),
  appSignature: HexSchema,
  chainId: z.number(),
  commentData: z.any(),
  submitted: z.boolean(),
});

export const PreparedGaslessCommentApprovedResponseSchema = z.object({
  txHash: HexSchema,
  appSignature: HexSchema,
  chainId: z.number(),
  commentData: z.any(),
  submitted: z.boolean(),
});

export const GaslessCommentRequestBodySchema = z
  .object({
    signTypedDataParams: z.any(),
    appSignature: HexSchema,
    authorSignature: HexSchema,
    commentData: z.any(),
    chainId: z
      .number()
      .optional()
      .default(() => getDefaultChainId()),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId as keyof typeof SUPPORTED_CHAINS],
    };
  });

export const GaslessCommentResponseSchema = z.object({
  txHash: HexSchema,
  success: z.boolean(),
});
