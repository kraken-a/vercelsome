# Architecture — C4 Model

Diagrams-as-code in Mermaid. Renders natively in GitHub, VS Code, and Obsidian.

| Level | File | Zoom |
|---|---|---|
| **C1** | [c1-context.md](c1-context.md) | System Context — actors + external systems around Oaksome |
| **C2** | [c2-container.md](c2-container.md) | Containers — Next.js + Odoo + Postgres + edge, with data flows |
| **C3** | [c3-component.md](c3-component.md) | Components — inside Next.js app and inside `oaksome_nextjs_api` addon |

**C4 = Code** is intentionally out of scope — the code itself is the source of truth at that level.

## How to update

1. Edit the relevant `c{N}-*.md` file.
2. Keep diagrams in plain Mermaid `flowchart LR` (no theme-specific syntax — renders everywhere).
3. Keep the "Open Questions / Backlog" sections at the bottom of each file; clear them as items get resolved.
4. Cross-link to source docs (`../System-Design.md`, `../frontend-spec.md`, etc.) rather than duplicating facts.
