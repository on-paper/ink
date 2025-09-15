# Repository Guidelines

## Project Structure & Module Organization
- Source code lives in `src/`.
  - Routes and pages: `src/app/` (Next.js app router)
  - UI: `src/components/`, state: `src/atoms/`, hooks: `src/hooks/`
  - Utilities: `src/lib/`, `src/utils/`, types: `src/types/`, styles: `src/styles/`
- Public assets: `public/`
- Documentation: `docs/` (localized content under `docs/en`, `docs/zh`, etc.)
- Scripts: `scripts/` (e.g., `scripts/generate-app-key.ts`)
- Configuration: `env.mjs`, `source.config.ts`, `biome.json`, `tsconfig.json`, `next.config.mjs`
 - Notable routes: `src/app/(feed)/`, `src/app/(title)/`, `src/app/api/`, `src/app/p/[slug]/`, `src/app/u/[user]/`

## Build, Test, and Development Commands
- `bun run dev` — Start Next.js dev server on port 3010 with HTTPS.
- `bun run start` — Start built app.
- `bun run check` — Lint and format with Biome (auto-fixes where safe).
- `bun scripts/generate-app-key.ts` — Generate an application key (see `.env.example`).
 - `bun install` — Install dependencies (Bun v1.2.5).
 - `bunx tsc --noEmit` — Type-check only; fix all errors before pushing.

## Common Development Commands

```bash
# Install dependencies
bun install

# Format and lint code (required after changes)
bun x @biomejs/biome check --write --unsafe ./src/*
# or
npm run check
```

## Coding Style & Naming Conventions
- TypeScript, React (Next 15), Bun. Prefer functional components and hooks.
- Formatting and linting: Biome (`biome.json`), 2-space indent, 120-char line width.
- Naming: `PascalCase` components (`MyComponent.tsx`), `camelCase` functions/vars, `kebab-case` files not exporting components.
- Keep modules small; colocate related files. Prefer fewer files; create new files only when necessary.
- Use individual exports only; avoid barrel `index.ts` files.
- Avoid non-null assertions; use narrowing and `zod` validation where applicable.
- UI/Styling stack: Tailwind CSS + Radix UI (via Shadcn); Animations via Motion.
- State: Jotai for client state, React Query for server state.

## Testing Guidelines
- No formal test suite is present. If adding tests:
  - Unit: Vitest + React Testing Library; colocate as `*.test.ts(x)` next to source or under `src/__tests__/`.
  - E2E: Playwright; store under `e2e/`.
  - Aim for critical-path coverage (routing, forms, auth, rendering of docs pages).

## Commit & Pull Request Guidelines
- Prefer short, lowercase messages; Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, etc.) are welcome when helpful.
- Do not add authors in commit messages.
- Keep PRs focused; include description, linked issues, and screenshots for UI changes.
- Run `bunx tsc --noEmit` and `bun run check` before pushing; ensure `bun run build` passes.
- Branch naming: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; do not commit secrets.
- Environment parsing happens in `env.mjs`; update types safely and validate.
- Certificates for local HTTPS live under `certificates/`.

## Agent-Specific Instructions
- Prefer minimal, targeted diffs; align with existing patterns and naming.
- Run `bunx tsc --noEmit` and address all type errors; avoid starting/stopping the dev server (assume it is running).
- Do not introduce new tooling without discussion.
- Avoid adding barrel files; prefer individual exports and fewer files when possible.
- Update docs when changing behavior (routes, env, scripts).

## Protocol & Integration Docs
- EFP (Ethereum Follow Protocol): https://docs.efp.app/intro/ (LLM: /llms.txt, /llms-full.txt)
- ECP (Ethereum Comments Protocol): https://docs.ethcomments.xyz/ (LLM: /llms.txt, /llms-full.txt)
- Ethereum Identity Kit: https://ethidentitykit.com/docs (LLM: /llms/complete/llms.txt, /llms/complete/llms-full.txt)
