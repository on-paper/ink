import { base } from "wagmi/chains";
import { API_URLS } from "~/config/api";

// Base mainnet EFP contracts
export const EFP_CONTRACTS = {
  EFPAccountMetadata: "0x5289fE5daBC021D02FDDf23d4a4DF96F4E0F17EF" as const,
  EFPListRecords: "0x41Aa48Ef3c0446b46a5b1cc6337FF3d3716E2A33" as const,
  EFPListRegistry: "0x0E688f5DCa4a0a4729946ACbC44C792341714e08" as const,
  EFPListMinter: "0xDb17Bfc64aBf7B7F080a49f0Bbbf799dDbb48Ce5" as const,
  TokenURIProvider: "0xC8BA343aeaF2b3b3EC79C25f05F4Ef459D9c7eFB" as const,
} as const;

export const EFP_API_BASE_URL = API_URLS.EFP;
export const EFP_CHAIN_ID = base.id;
export const SUPPORTED_CHAIN_IDS = [8453, 1];
