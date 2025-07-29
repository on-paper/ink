#!/usr/bin/env bun

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

console.log("🔑 Generating App Signer Key for ECP Integration\n");

// Generate a new private key
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("Generated App Signer Details:");
console.log("============================");
console.log(`Private Key: ${privateKey}`);
console.log(`Address: ${account.address}`);
console.log("\n⚠️  IMPORTANT:");
console.log("1. Add this private key to your .env file as APP_SIGNER_PRIVATE_KEY");
console.log("2. Keep this key secure - it represents your app's identity");
console.log("3. Never commit this key to version control");
console.log("4. Consider funding this address with a small amount of ETH for gas (if needed)");
console.log("\nExample .env entry:");
console.log(`APP_SIGNER_PRIVATE_KEY=${privateKey}`);