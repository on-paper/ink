import { type Chain, createPublicClient, http } from "viem";
import { getDefaultChain } from "~/config/networks";

export const getPublicClient = (chain?: Chain) => {
  const chainToUse = chain || getDefaultChain();
  return createPublicClient({
    chain: chainToUse,
    transport: http(),
  });
};
