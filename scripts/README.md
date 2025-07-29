# Scripts

This directory contains utility scripts for the Paper project.

## generate-app-key.ts

Generates a new private key and address for the app signer used in ECP (Ethereum Comments Protocol) integration.

### Usage

```bash
bun run generate-app-key
# or
bun scripts/generate-app-key.ts
```

### Purpose

The app signer key is used server-side to sign ECP comments on behalf of the Paper application. This allows users to post comments without paying gas fees directly, as the app signature validates the comment data.

### Important Notes

- The generated private key should be added to your `.env` file as `APP_SIGNER_PRIVATE_KEY`
- Never commit the private key to version control
- Keep the key secure as it represents your app's identity in the ECP protocol
- The corresponding address may need to be funded with ETH if you implement server-side posting