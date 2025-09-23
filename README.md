## Overview

**what?**

clarity paves the way for brilliance. [paper](https://paper.ink) is a minimalistic decentralized social platform, focusing on clear and efficient solutions.

**how?**

built on top of ENS, EFP & ECP

## Contributing

### Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/on-paper/ink.git && cd ink
   ```

2. Create a `.env` file:

   ```sh
   cp .env.example .env
   ```

   Replace the variables with your own values.

3. Install dependencies:
   - Make sure you're running **Node.js 22** (the project targets `>=22 <23`).
   - Install [Bun](https://bun.sh) **1.2.5 or newer**:

     ```sh
     curl -fsSL https://bun.sh/install | bash
     ```

   - Install project packages:

     ```sh
     bun install
     ```

4. Run the dev server:
   ```sh
   bun run dev
   ```
   Navigate to [https://localhost:3010/home](https://localhost:3010/home) and accept the self-signed certificate prompt from your browser.

### Next Steps

Now you're all set to start contributing! Read **[contributing.md](CONTRIBUTING.md)** for guidelines.

### Code Quality

Biome is used for formatting and linting. Install it via [Zed/VSCode extensions](https://biomejs.dev/guides/getting-started/) or run:

```sh
bun run check
```

For type safety, also run:

```sh
bunx tsc --noEmit
```
