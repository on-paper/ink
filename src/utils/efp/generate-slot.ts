import { keccak256, toHex } from "viem/utils";

export function generateListStorageLocationSlot() {
  const hash = keccak256(toHex(Date.now() * Math.floor(Math.random() * 1000)));
  return BigInt(hash.slice(0, 66)) & ((BigInt(1) << BigInt(255)) - BigInt(1));
}
