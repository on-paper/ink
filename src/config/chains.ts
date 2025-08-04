import { base, baseSepolia } from "wagmi/chains";

export const DEFAULT_CHAIN_ID = 8453; // Base mainnet
export const DEFAULT_TESTNET_CHAIN_ID = 84532; // Base Sepolia

export const getDefaultChainId = () => {
  const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "mainnet";
  return networkMode === "testnet" ? DEFAULT_TESTNET_CHAIN_ID : DEFAULT_CHAIN_ID;
};

export const getDefaultChain = () => {
  const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "mainnet";
  return networkMode === "testnet" ? baseSepolia : base;
};
