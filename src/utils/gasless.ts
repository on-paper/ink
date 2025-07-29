import { privateKeyToAccount } from "viem/accounts";
import type { z } from "zod";

export class GaslessNotAvailableError extends Error {
  constructor() {
    super("Gasless is not available");
  }
}

export function getGaslessSigner() {
  const signerPrivateKey = process.env.GASLESS_APP_SIGNER_PRIVATE_KEY || process.env.APP_SIGNER_PRIVATE_KEY;

  if (!signerPrivateKey) {
    throw new GaslessNotAvailableError();
  }

  const formattedPrivateKey = signerPrivateKey.startsWith("0x") ? signerPrivateKey : `0x${signerPrivateKey}`;
  return privateKeyToAccount(formattedPrivateKey as `0x${string}`);
}

export function getGaslessSubmitter() {
  const submitterPrivateKey = process.env.GASLESS_SUBMITTER_PRIVATE_KEY;

  if (!submitterPrivateKey) {
    // Fall back to app signer if no separate submitter is configured
    return getGaslessSigner();
  }

  const formattedPrivateKey = submitterPrivateKey.startsWith("0x") ? submitterPrivateKey : `0x${submitterPrivateKey}`;
  return privateKeyToAccount(formattedPrivateKey as `0x${string}`);
}

export function bigintReplacer(_key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export class JSONResponse<TSchema extends z.ZodType> extends Response {
  private __outputType!: z.output<TSchema>;

  constructor(
    parser: TSchema,
    data: z.input<TSchema>,
    init?: ResponseInit & {
      jsonReplacer?: (key: string, value: unknown) => unknown;
    },
  ) {
    const { jsonReplacer, ...responseInit } = init || {};

    super(JSON.stringify(parser.parse(data), jsonReplacer), {
      ...responseInit,
      headers: {
        ...responseInit?.headers,
        "Content-Type": "application/json",
      },
    });
  }
}
