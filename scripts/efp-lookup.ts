#!/usr/bin/env bun
import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";
import { EFP_CONTRACTS } from "../src/lib/efp/config";
import { efpAccountMetadataAbi, efpListRegistryAbi, efpListRecordsAbi } from "../src/lib/efp/abi";
import { decodeListOp } from "../src/lib/efp/operations";

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("EFP Lookup Tool");
  console.log("===============");
  console.log("\nUsage:");
  console.log("  bun scripts/efp-lookup.ts <command> [options]");
  console.log("\nCommands:");
  console.log("  user <address>          - Get user's primary list and metadata");
  console.log("  list <id>               - Get list details and storage location");
  console.log("  following <list-id>     - Show all addresses followed by a list");
  console.log("  follows <list-id> <address> - Check if list follows an address");
  console.log("  storage <list-id>       - Decode storage location for a list");
  console.log("  operations <list-id>    - Show all operations for a list");
  console.log("\nExamples:");
  console.log("  bun scripts/efp-lookup.ts user 0x82ad2f310831d6d7d1f95B08c96EF0771cdC94B2");
  console.log("  bun scripts/efp-lookup.ts list 43802");
  console.log("  bun scripts/efp-lookup.ts following 43802");
  console.log("  bun scripts/efp-lookup.ts follows 43802 0x860bd5121068724e600c719380b87e093ff3bdb8");
  console.log("  bun scripts/efp-lookup.ts operations 43802");
  process.exit(0);
}

const command = args[0];

async function getUserData(address: Address) {
  console.log(`\nFetching EFP data for user: ${address}`);
  console.log("=".repeat(60));

  try {
    // Get primary list
    const primaryList = await client.readContract({
      address: EFP_CONTRACTS.EFPAccountMetadata,
      abi: efpAccountMetadataAbi,
      functionName: "getValue",
      args: [address, "primary-list"],
    });

    if (primaryList === "0x") {
      console.log("❌ No primary list set for this user");
      return;
    }

    const listId = BigInt(primaryList);
    console.log(`✓ Primary List ID: ${listId}`);

    // Get storage location first to get the slot
    const storageLocation = await getStorageLocation(listId.toString());
    
    // Get list metadata from ListRecords contract using the slot
    const manager = await client.readContract({
      address: storageLocation.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getListManager",
      args: [storageLocation.slot],
    });

    const user = await client.readContract({
      address: storageLocation.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getListUser",
      args: [storageLocation.slot],
    });

    console.log(`✓ List Manager: ${manager}`);
    console.log(`✓ List User: ${user}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getStorageLocation(listId: string, verbose = false) {
  const listIdBigInt = BigInt(listId);
  
  const storageLocationHex = await client.readContract({
    address: EFP_CONTRACTS.EFPListRegistry,
    abi: efpListRegistryAbi,
    functionName: "getListStorageLocation",
    args: [listIdBigInt],
  });

  const bytes = Buffer.from(storageLocationHex.slice(2), "hex");
  
  const version = bytes[0];
  const listType = bytes[1];
  const chainId = BigInt("0x" + bytes.subarray(2, 34).toString("hex"));
  const contractAddress = ("0x" + bytes.subarray(34, 54).toString("hex")) as Address;
  const slot = BigInt("0x" + bytes.subarray(54, 86).toString("hex"));

  console.log("\nStorage Location:");
  console.log(`  Raw: ${storageLocationHex}`);
  console.log(`  Version: ${version}`);
  console.log(`  List Type: ${listType} (${listType === 1 ? "onchain" : "unknown"})`);
  console.log(`  Chain ID: ${chainId} (${chainId === 8453n ? "Base" : "Unknown"})`);
  console.log(`  Contract: ${contractAddress}`);
  console.log(`  Slot: ${slot}`);
  console.log(`  Slot (hex): 0x${slot.toString(16)}`);
  
  if (verbose) {
    console.log("\nDecoded bytes:");
    console.log(`  Version (1 byte): 0x${bytes.subarray(0, 1).toString("hex")}`);
    console.log(`  Type (1 byte): 0x${bytes.subarray(1, 2).toString("hex")}`);
    console.log(`  Chain ID (32 bytes): 0x${bytes.subarray(2, 34).toString("hex")}`);
    console.log(`  Contract (20 bytes): 0x${bytes.subarray(34, 54).toString("hex")}`);
    console.log(`  Slot (32 bytes): 0x${bytes.subarray(54, 86).toString("hex")}`);
  }

  return { contractAddress, slot };
}

async function getListDetails(listId: string) {
  console.log(`\nFetching details for List ID: ${listId}`);
  console.log("=".repeat(60));

  try {
    // Get storage location first
    const storage = await getStorageLocation(listId);

    // Get list metadata from ListRecords contract using the slot
    const manager = await client.readContract({
      address: storage.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getListManager",
      args: [storage.slot],
    });

    const user = await client.readContract({
      address: storage.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getListUser",
      args: [storage.slot],
    });

    console.log(`✓ Manager: ${manager}`);
    console.log(`✓ User: ${user}`);

    // Get list operations count
    const listOps = await client.readContract({
      address: storage.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getAllListOps",
      args: [storage.slot],
    });

    console.log(`\n✓ Total Operations: ${listOps.length}`);

    // Count follows
    const addresses = new Set<string>();
    for (const opData of listOps) {
      const decoded = decodeListOp(opData);
      if (!decoded) continue;
      
      if (decoded.opcode === 0x01) {
        addresses.add(decoded.record.address.toLowerCase());
      } else if (decoded.opcode === 0x02) {
        addresses.delete(decoded.record.address.toLowerCase());
      }
    }

    console.log(`✓ Currently Following: ${addresses.size} addresses`);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getFollowing(listId: string) {
  console.log(`\nFetching addresses followed by List ID: ${listId}`);
  console.log("=".repeat(60));

  try {
    const storage = await getStorageLocation(listId);

    const listOps = await client.readContract({
      address: storage.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getAllListOps",
      args: [storage.slot],
    });

    const followMap = new Map<string, boolean>();
    
    for (const opData of listOps) {
      const decoded = decodeListOp(opData);
      if (!decoded) continue;
      
      const addr = decoded.record.address.toLowerCase();
      if (decoded.opcode === 0x01) {
        followMap.set(addr, true);
      } else if (decoded.opcode === 0x02) {
        followMap.set(addr, false);
      }
    }

    const following = Array.from(followMap.entries())
      .filter(([_, isFollowing]) => isFollowing)
      .map(([addr]) => addr);

    console.log(`\nCurrently following ${following.length} addresses:`);
    following.forEach((addr, i) => {
      console.log(`${i + 1}. ${addr}`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function checkFollows(listId: string, targetAddress: Address) {
  console.log(`\nChecking if List ${listId} follows ${targetAddress}`);
  console.log("=".repeat(60));

  try {
    const storage = await getStorageLocation(listId);

    const listOps = await client.readContract({
      address: storage.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getAllListOps",
      args: [storage.slot],
    });

    let isFollowing = false;
    const target = targetAddress.toLowerCase();

    for (const opData of listOps) {
      const decoded = decodeListOp(opData);
      if (!decoded) continue;
      
      if (decoded.record.address.toLowerCase() === target) {
        if (decoded.opcode === 0x01) {
          isFollowing = true;
          console.log(`✓ ADD operation found`);
        } else if (decoded.opcode === 0x02) {
          isFollowing = false;
          console.log(`✓ REMOVE operation found`);
        }
      }
    }

    console.log(`\nResult: ${isFollowing ? "✅ FOLLOWING" : "❌ NOT FOLLOWING"}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function showOperations(listId: string) {
  console.log(`\nFetching all operations for List ID: ${listId}`);
  console.log("=".repeat(60));

  try {
    const storage = await getStorageLocation(listId, true); // verbose storage info

    const listOps = await client.readContract({
      address: storage.contractAddress,
      abi: efpListRecordsAbi,
      functionName: "getAllListOps",
      args: [storage.slot],
    });

    console.log(`\nTotal Operations: ${listOps.length}`);
    console.log("-".repeat(60));

    listOps.forEach((opData, index) => {
      console.log(`\nOperation ${index + 1}:`);
      console.log(`  Raw: ${opData}`);
      
      const decoded = decodeListOp(opData);
      if (decoded) {
        console.log(`  Version: ${decoded.version}`);
        console.log(`  Opcode: 0x${decoded.opcode.toString(16).padStart(2, '0')} (${decoded.opcode === 0x01 ? "ADD" : decoded.opcode === 0x02 ? "REMOVE" : "UNKNOWN"})`);
        console.log(`  Record Version: ${decoded.record.version}`);
        console.log(`  Record Type: ${decoded.record.recordType} (${decoded.record.recordType === 1 ? "address" : decoded.record.recordType === 2 ? "list" : "unknown"})`);
        console.log(`  Address: ${decoded.record.address}`);
        
        // Show the decoded bytes
        const bytes = Buffer.from(opData.slice(2), "hex");
        console.log(`  Decoded bytes:`);
        console.log(`    Version: 0x${bytes.subarray(0, 1).toString("hex")}`);
        console.log(`    Opcode: 0x${bytes.subarray(1, 2).toString("hex")}`);
        console.log(`    Record data: 0x${bytes.subarray(2).toString("hex")}`);
      } else {
        console.log(`  Failed to decode operation`);
      }
    });

    // Show current state summary
    console.log("\n" + "=".repeat(60));
    console.log("Current State Summary:");
    
    const followMap = new Map<string, boolean>();
    for (const opData of listOps) {
      const decoded = decodeListOp(opData);
      if (!decoded) continue;
      
      const addr = decoded.record.address.toLowerCase();
      if (decoded.opcode === 0x01) {
        followMap.set(addr, true);
      } else if (decoded.opcode === 0x02) {
        followMap.set(addr, false);
      }
    }
    
    const following = Array.from(followMap.entries())
      .filter(([_, isFollowing]) => isFollowing);
    
    console.log(`Currently following ${following.length} addresses`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute command
switch (command) {
  case "user":
    if (!args[1]) {
      console.error("Error: Please provide a user address");
      process.exit(1);
    }
    await getUserData(args[1] as Address);
    break;

  case "list":
    if (!args[1]) {
      console.error("Error: Please provide a list ID");
      process.exit(1);
    }
    await getListDetails(args[1]);
    break;

  case "following":
    if (!args[1]) {
      console.error("Error: Please provide a list ID");
      process.exit(1);
    }
    await getFollowing(args[1]);
    break;

  case "follows":
    if (!args[1] || !args[2]) {
      console.error("Error: Please provide both list ID and target address");
      process.exit(1);
    }
    await checkFollows(args[1], args[2] as Address);
    break;

  case "storage":
    if (!args[1]) {
      console.error("Error: Please provide a list ID");
      process.exit(1);
    }
    await getStorageLocation(args[1], true); // verbose mode for storage command
    break;

  case "operations":
    if (!args[1]) {
      console.error("Error: Please provide a list ID");
      process.exit(1);
    }
    await showOperations(args[1]);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.log("Run without arguments to see usage");
    process.exit(1);
}