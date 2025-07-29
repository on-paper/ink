# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paper is a minimalistic decentralized social platform built on:
- **ENS, EFP, ECP** - Ethereum integration protocols
- **Next.js 14** (App Router) - Web framework
- **TypeScript** - Primary language
- **Bun** - Package manager (v1.2.5)

## Common Development Commands

```bash
# Install dependencies
bun install

# Format and lint code (required before commits)
bun x @biomejs/biome check --write --unsafe ./src/*
# or
npm run check
```

## Architecture Overview

### Directory Structure
- `/src/app/` - Next.js App Router pages and API routes
  - `(feed)/` - Feed-related pages with shared layout
  - `(title)/` - Pages with title header layout
  - `api/` - RESTful API endpoints for posts, users, notifications
  - `p/[slug]/` - Individual post pages
  - `u/[user]/` - User profile pages

- `/src/components/` - React components organized by domain
  - `auth/` - Authentication components
  - `communities/` - Community-related components
  - `notifications/` - Notification system
  - `menu/` - Navigation and menu components
  - `post/` - Post-related components (PostView, PostWizard, etc.)
  - `ui/` - Shadcn/UI base components
  - `user/` - User profile and avatar components
  - `web3/` - Web3 wallet connection components

### Key Technologies

**Web3 Integration:**
- ENS (Ethereum Name Service) - for name resolution
- ECP (Ethereum Comments Protocol) - for decentralized comments
- EFP (Ethereum Follow Protocol) - for social graph management
- Ethereum Identity Kit - for interactions with EFP
- Wagmi for Ethereum interactions
- Viem for blockchain utilities

**UI/Styling:**
- Tailwind CSS with custom theme configuration
- Radix UI primitives wrapped in Shadcn/UI components
- Framer Motion for animations
- Custom background gradient system (recent feature)

**State Management:**
- Redux Toolkit for global state
- React Query (TanStack Query) for server state
- React Hook Form for forms

### Code Style and Quality

- **Biome** is used for formatting and linting (replaces ESLint/Prettier)
- Run `bun x @biomejs/biome check --write --unsafe ./src/*` before committing

### Important Patterns

1. **API Routes**: Follow RESTful conventions in `/src/app/api/`
2. **Components**: Use domain-based organization (post/, user/, etc.)

### Commit Message Guidelines
- Use lowercase commit messages
- Keep commit messages short
- Do not add authors
- Example format: "add x, fix y, update z"

## Development Workflow Reminders
- Whenever we make a change run `bunx tsc --noEmit` and fix errors until there's none left. do not run `bun run dev` or `bun run build`. assume dev server is always runinng.

## Code Style
Prioritize having fewer files. Only create new files when absolutely necessary. Only use individual exports in files, do not create index files.

## External Protocol Documentation

### EFP (Ethereum Follow Protocol)
- **Documentation**: https://docs.efp.app/intro/
- **LLM-optimized docs**:
  - Minimal: https://docs.efp.app/llms.txt - Quick reference for basic EFP concepts
  - Full: https://docs.efp.app/llms-full.txt - Comprehensive documentation
  
**Using EFP docs**: When working with EFP integration, first check the minimal LLM docs for quick answers. For detailed implementation, use the full LLM docs which contain complete API references, examples, and integration patterns.

### ECP (Ethereum Comments Protocol)
- **Documentation**: https://docs.ethcomments.xyz/
- **LLM-optimized docs**:
  - Minimal: https://docs.ethcomments.xyz/llms.txt - Core ECP concepts and basic usage
  - Full: https://docs.ethcomments.xyz/llms-full.txt - Complete protocol specification
  
**Using ECP docs**: Start with the minimal LLM docs to understand basic comment operations. Reference the full docs for advanced features like moderation, threading, and custom implementations.

### Ethereum Identity Kit
- **Documentation**: https://ethidentitykit.com/docs
- **LLM-optimized docs**:
  - Minimal: https://ethidentitykit.com/llms/complete/llms.txt 
  - Full: https://ethidentitykit.com/llms/complete/llms-full.txt - Complete specification

**Using Ethereum Identity Kit docs**: Start with the minimal LLM docs to understand basic comment operations. Reference the full docs for advanced features like moderation, threading, and custom implementations.

### ENS (Ethereum Name Service)
ENS is used for resolving human-readable names to Ethereum addresses and other resources. Key integration points:
- Name resolution for user profiles
- Avatar and metadata retrieval
- Integration with social features