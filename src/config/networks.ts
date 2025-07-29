import { base, baseSepolia, mainnet, optimism, optimismSepolia, sepolia } from "wagmi/chains";

export const NETWORK_MODE = process.env.NEXT_PUBLIC_NETWORK_MODE || "mainnet"; // "mainnet" | "testnet"

export const MAINNET_CHAINS = [mainnet, base, optimism] as const;
export const TESTNET_CHAINS = [sepolia, baseSepolia, optimismSepolia] as const;

export const getAvailableChains = () => {
  return NETWORK_MODE === "testnet" ? TESTNET_CHAINS : MAINNET_CHAINS;
};

export const getAllChains = () => {
  return [...MAINNET_CHAINS, ...TESTNET_CHAINS];
};

export const getDefaultChain = () => {
  return NETWORK_MODE === "testnet" ? baseSepolia : base;
};
