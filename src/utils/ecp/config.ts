import { base, mainnet } from "viem/chains";

export const ECP_SUPPORTED_CHAINS = {
  [base.id]: base,
  [mainnet.id]: mainnet,
} as const;

export const DEFAULT_CHAIN_ID = base.id;
