# AGENTS.md

Canonical working instructions for coding agents in this repository.

`CLAUDE.md` is a compatibility include only and must point back to this file.
Update this file, not `CLAUDE.md`, when project agent instructions change.

## Agent Coding Rules

### Non-Negotiables
- Plan Mode First.
- Surgical Edits.
- Security Gates Always.
- Tests Before Done.
- Diff Review Required.
- No Architecture Drift.
- No Permission Bypass.
- Subagents for analysis only, final merge by one responsible agent.

### Workflow Principles
1. Plan Mode First
   - Use plan mode for any non-trivial task.
   - Write the target files, expected behavior, tests, and risks before editing.
   - Use a lightweight inline plan for smaller tasks.

2. Verify Relentlessly
   - Check assumptions, edge cases, and tradeoffs.
   - Run tests, review diffs, and verify behavior before final response.
   - Do not blindly accept generated output.

3. Keep It Simple
   - Avoid overengineering and bloated abstractions.
   - Prefer the smallest understandable change.
   - Remove dead code only when it is directly related to the task.

4. Surgical Edits Only
   - Change only what is necessary.
   - Do not touch unrelated code, comments, formatting, or public APIs.
   - Minimize side effects and churn.

5. Goal-Driven Execution
   - Define success criteria.
   - Use tools and executable checks in the loop.
   - Iterate until the goal is met or the blocker is explicit.

6. Parallelize with Subagents
   - Use subagents for research, exploration, and independent analysis only.
   - Give each subagent one focused task.
   - Merge final decisions and edits through one responsible agent.

### Core Principles
- Simplicity First: minimal code that solves the problem; nothing speculative.
- No Laziness: find root causes; no temporary fixes.
- Minimal Impact: only touch what is necessary; avoid new bugs.

## Project

Oaksome is a Belgian custom built-in furniture brand site. This repository contains the Next.js production frontend that consumes a custom Odoo 17 JSON REST API.

Main flow: browse -> configure -> quote request / add to cart -> checkout via Odoo.

Source of truth is `docs/`. Always open the relevant docs before implementation:

| Doc | Use |
|---|---|
| `docs/System-Design.md` | Architecture, hosting, domains, caching, CI/CD, auth, country/TVA |
| `docs/frontend-spec.md` | Routes, rendering strategy, components, design tokens, tracking, i18n |
| `docs/backend-spec.md` | Odoo modules, custom fields, workflows, automations, dashboard, emails |
| `docs/api-contract.md` | Endpoints, request/response schemas, CORS, auth mechanism |
| `docs/data-model.md` | Odoo models, fields, relations, access rules |
| `docs/user-flows.md` | User flows |
| `docs/Oaksome_sale_process.md` | CRM pipeline, SO1 -> SO2, invoicing, signatures, KPIs |
| `docs/architecture/` | C4 diagrams |

The active app is `oaksome-web/`.

## Stack

- Next.js 15 App Router, React 18, TypeScript strict mode.
- Tailwind CSS.
- `next-intl` with FR default and NL, locale prefix `/{locale}/...`.
- Odoo 17 custom REST API under `/api/oaksome/*`, not JSON-RPC.
- Local state uses `localStorage` for cart, wishlist, and country, then syncs to Odoo at checkout.
- Auth uses custom Next.js pages plus Odoo session cookies.

## Technology Notes
- Read existing docs and manifests before editing.
- Use `rg` to find existing patterns before creating new services or abstractions.
- React: keep components small and preserve existing UI/design-system patterns.
- React: avoid unnecessary state and effects; prefer derived values and existing data flow.

- Next.js: respect App Router boundaries, server/client component splits, routing, metadata, and i18n conventions.
- Next.js: `npm run build` is the production gate; keep fixing chained route/type/page-prop failures until green.
- React: preserve component boundaries, state ownership, accessibility, and existing design-system patterns.
- TypeScript: do not weaken types with `any` or broad casts unless the boundary is documented.
- Odoo integration: never bypass ACLs, record rules, or ORM security in backend changes that support this frontend.
- Odoo integration: use `sudo()` sparingly in related addons and document why it is safe when required.
- Odoo integration: update module README files when behavior, models, fields, security, views, reports, or dependencies change.

## Commands

Run from `oaksome-web/` unless stated otherwise:

```bash
npm run dev
npm run build
npm run lint
npm run type-check
npm test
npm run test:e2e
npm run i18n:check
```

Docker:

```bash
docker compose --env-file .env.local up --build
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

`npm run build` is the production gate for frontend changes. Keep rebuilding through chained Next.js typed-route or page-prop failures until the build is green.

## Architecture and Docs

The C4 diagrams in `docs/architecture/` are a delivery gate.

- Update `docs/architecture/c1-context.md` when actors, external systems, public domains, payment/CMP/tracking providers, CDN, or internal user roles change.
- Update `docs/architecture/c2-container.md` when deployable units, data stores, top-level data flows, hosting/Nginx topology, or API route families change.
- Update `docs/architecture/c3-component.md` when route groups, feature modules, lib modules, addon controllers, or cross-component dependencies change.
- Keep Mermaid as `flowchart LR`.
- Link to source docs instead of duplicating facts.
- Resolve stale open questions when your change closes them.
- Do not touch diagrams for tiny bug fixes, renames, or one-line CSS tweaks that do not affect architecture.

## Implementation Rules

- Inspect the real project structure before editing; do not assume paths from docs if the tree differs.
- Reuse existing utilities and patterns before adding abstractions.
- Prefer server components unless client-side interactivity is required.
- Keep TypeScript strict; avoid `any` unless justified in code.
- Validate API shapes at boundaries and handle loading, empty, and error states explicitly.
- Do not hardcode undocumented API fields.
- No hardcoded user-facing strings in components; preserve FR/NL parity through the localization system.
- Preserve keyboard navigation, semantic labels, visible focus states, and contrast.
- Optimize images, avoid unnecessary client bundles, prevent duplicate fetches, and keep rendering strategy aligned with `docs/frontend-spec.md`.

## Routes and i18n

- Full route behavior lives in `docs/frontend-spec.md`.
- Verify route-sensitive or typed-link changes against `oaksome-web/src/i18n/routing.ts` before editing.
- All user-visible route behavior must work for FR and NL.
- For route, metadata, or funnel changes, run live checks for at least one FR route and one NL route. Include headings, metadata/canonical/alternate links, redirect behavior, and one Odoo-backed page or API path when relevant.

## Preserved Project Instructions
Migrated from `CLAUDE.md`.

The canonical agent instructions for this project are in `AGENTS.md`.

## context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

### BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

### REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

### Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

### Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

### Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

### ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |

## Verification Before Done
1. Run the relevant tests.
2. Run lint, type-check, and build commands when available.
3. Review the diff.
4. State what changed, what was not changed, and any skipped checks.

## Security

- Never expose secrets in client code.
- Treat all external/Odoo data as untrusted.
- Sanitize any dynamic HTML usage.
- Do not reintroduce legacy admin JSON-RPC credentials.
- Do not bypass permission, approval, sandbox, or environment rules.
- Normalize only Odoo auth redirects (`/web/login` or `/web/session`) to `401`; pass through other upstream `3xx` responses unless a checked contract says otherwise.

## Environment

Build-time public variables:

```bash
NEXT_PUBLIC_ODOO_URL=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
```

Runtime server variables:

```bash
META_CAPI_ACCESS_TOKEN=
ODOO_URL=
```

Use `docker-compose.prod.yml` with `.env.production` for production-like compose runs. Do not assume `--env-file` alone overrides compose entries still pointing at `.env.local`.

## Odoo Integration

Related backend addons live outside this repo at `/home/rachid/01_Workspace/odoo/custom/website`:

- `oaksome_nextjs_core`
- `oaksome_nextjs_api`
- `oaksome_sale_workflow`
- `oaksome_portal_tracker`
- `oaksome_fsm_access`

Use the documented REST contract in `docs/api-contract.md`. Frontend code should call the documented REST API surface.

## Design

Source: `docs/frontend-spec.md`.

- Yet Grotesk for body/nav.
- PP Air Mono for specs, prices, and dimensions.
- Border radius should be `0` or `4px`.
- No elevation box shadows.
- Prefer contrast and spacing for hierarchy.
- Keep animation subtle and intentional.

Prototype reference: `/home/rachid/01_Workspace/oaksome/oaksome-website-prototype`.

## Security Gates
- Never commit secrets, credentials, tokens, or production data.
- Never print secrets in logs, test output, or final messages.
- Never modify production config, deployment, auth, payments, permissions, migrations, or data-deletion paths blindly.
- Never run destructive database or filesystem commands without explicit approval.
- Treat migrations, auth, payments, permissions, and data deletion as high-risk.
- Security-sensitive changes require tests or an explicit review note.

- Never bypass ACLs, permissions, tenancy checks, or user/session scoping.
- Never expose records or data the user cannot read.
- All agent tools must receive user/session context when applicable.
- All retrieval must be scoped by permissions.

## Verification

Before done, run the checks relevant to the change:

```bash
npm run lint
npm run type-check
npm test
```

Run `npm run build` for production-impacting frontend work. Run `npm run test:e2e` for route, funnel, auth, cart, checkout, or other browser-flow behavior.

If checks are skipped, state exactly what was skipped and why.

Delivery checklist:

- Behavior matches `docs/` specs.
- FR/NL locale behavior is correct.
- Error states are handled.
- Tracking impact is considered when user events change.
- Tests are updated when behavior changes.
- Diff is reviewed before final response.

## Branch and Deploy

- Branch naming convention: `[IMP|FIX|ADD]-feature-name`.
- Push to `main` auto-deploys to Vercel test.
- Production deploy is manual through Docker in a protected environment.

## Context and Output Discipline

- Keep exploration targeted; prefer `rg`/`rg --files` and concise file reads.
- Avoid commands that dump large output into the conversation.
- If context-mode MCP tools are available, use them for large searches, HTTP fetches, and bulky command output instead of raw shell output.
- Do not use `curl`/`wget` from shell when context-mode provides fetch/index tools for the same job.
- Write large artifacts to files; summarize paths and outcomes in the response.
