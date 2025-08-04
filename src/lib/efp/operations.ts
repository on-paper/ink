import { type Address } from "viem";

export const EFP_LIST_OP_CODES = {
  ADD_RECORD: 0x01,
  REMOVE_RECORD: 0x02,
  TAG_RECORD: 0x03,
  UNTAG_RECORD: 0x04,
} as const;

export const EFP_RECORD_TYPES = {
  ADDRESS_RECORD: 0x01,
} as const;

export const EFP_VERSION = 0x01;

export interface AddressRecord {
  version: number;
  recordType: number;
  address: Address;
}

export function encodeAddressRecord(address: Address): Uint8Array {
  const record = new Uint8Array(22);
  record[0] = EFP_VERSION;
  record[1] = EFP_RECORD_TYPES.ADDRESS_RECORD;

  const addressBytes = Buffer.from(address.slice(2), "hex");
  record.set(addressBytes, 2);

  return record;
}

export function encodeFollowOperation(address: Address): `0x${string}` {
  const addressRecord = encodeAddressRecord(address);
  const operation = new Uint8Array(2 + addressRecord.length);

  operation[0] = EFP_VERSION;
  operation[1] = EFP_LIST_OP_CODES.ADD_RECORD;
  operation.set(addressRecord, 2);

  return `0x${Buffer.from(operation).toString("hex")}` as `0x${string}`;
}

export function encodeUnfollowOperation(address: Address): `0x${string}` {
  const addressRecord = encodeAddressRecord(address);
  const operation = new Uint8Array(2 + addressRecord.length);

  operation[0] = EFP_VERSION;
  operation[1] = EFP_LIST_OP_CODES.REMOVE_RECORD;
  operation.set(addressRecord, 2);

  return `0x${Buffer.from(operation).toString("hex")}` as `0x${string}`;
}

export function encodeBatchOperations(
  operations: Array<{ action: "follow" | "unfollow"; address: Address }>,
): `0x${string}`[] {
  return operations.map(({ action, address }) =>
    action === "follow" ? encodeFollowOperation(address) : encodeUnfollowOperation(address),
  );
}

export function decodeListOp(data: `0x${string}`): { version: number; opcode: number; record: AddressRecord } | null {
  try {
    const bytes = Buffer.from(data.slice(2), "hex");
    if (bytes.length < 24) return null;

    const version = bytes[0];
    const opcode = bytes[1];
    const recordVersion = bytes[2];
    const recordType = bytes[3];
    const address = `0x${bytes.slice(4, 24).toString("hex")}` as Address;

    return {
      version,
      opcode,
      record: {
        version: recordVersion,
        recordType,
        address,
      },
    };
  } catch (error) {
    console.error("Error decoding list op:", error);
    return null;
  }
}
