import { SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import {
  DeleteCommentTypedDataSchema,
  EditCommentDataSchema,
  EditCommentTypedDataSchema,
  MetadataArraySchema,
} from "@ecp.eth/sdk/comments/schemas";
import { HexSchema } from "@ecp.eth/sdk/core/schemas";
import { z } from "zod";

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
    chainId: z.number().optional().default(8453), // Base mainnet
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId],
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
    chainId: z.number().optional().default(8453),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId],
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
    chainId: z.number().optional().default(8453),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId],
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
    chainId: z.number().optional().default(8453),
  })
  .transform((val) => {
    return {
      ...val,
      chainConfig: SUPPORTED_CHAINS[val.chainId],
    };
  });

export const GaslessDeleteCommentResponseSchema = z.object({
  txHash: HexSchema,
});
