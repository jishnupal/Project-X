# BiyeFlow — Agent Guide

## Before any UI work

1. **Read [`DESIGN.md`](./DESIGN.md)** — source of truth for colors, type, components, and layout.
2. **Optional inspiration:** [`design-md/references/`](./design-md/references/) — curated extracts from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md).
3. **Redesign / new pages (spec first):** [`.agents/skills/web-design/`](./.agents/skills/web-design/) — [xiaopu-ai/web-design](https://github.com/xiaopu-ai/web-design): PRD → `DESIGN.md` → code. Includes quality checklist, motion library, 50+ design-system references, Playwright crawler scripts.
4. **Polish existing UI:** other skills in [`.agents/skills/`](./.agents/skills/) (e.g. `design-taste-frontend`, `redesign-existing-projects`, `high-end-visual-design` from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)).

## Design tooling stack

| Tool | Location | Use when |
|------|----------|----------|
| BiyeFlow spec | `DESIGN.md` | Every UI change — tokens & rules |
| awesome-design-md | `design-md/references/` | Brand inspiration (Airbnb, Stripe, …) |
| web-design skill | `.agents/skills/web-design/` | New pages / full redesigns — spec before code |
| taste-skill | `.agents/skills/design-taste-frontend/` etc. | Quick polish on existing components |

## Project structure

| Path | Purpose |
|------|---------|
| `src/styles/globals.css` | Tailwind `@theme` tokens — keep in sync with DESIGN.md |
| `src/domain/navigation.ts` | Sidebar (People) + header/mobile module nav |
| `src/components/access/` | Auth, profile, session |
| `functions/api/` | Cloudflare Pages API (D1 + KV) |

## Auth & roles

- **Guest** — BUZZ view-only; invite link join.
- **Admin** — full modules; 4-digit PIN.
- **Buddy** — granted modules only.
- **Ops provision** — hidden route only; never link in app UI.

## Deploy

```bash
npm run deploy          # saves rollback artifact + version label
npm run deploy:rollback # revert to previous production build
```

Check live version: `https://biyeflow.pages.dev/version.json`

**Agent note:** Always run deploy with unsandboxed shell (`required_permissions: ["all"]`). If the sandbox proxy blocks Cloudflare (OAuth / fetch failed / API token errors), retry immediately with smart-mode approval — do not start interactive `wrangler login`. See [`.cursor/rules/deploy-cloudflare.mdc`](../.cursor/rules/deploy-cloudflare.mdc).

## Don't

- Don't edit `DESIGN.md` format randomly — follow awesome-design-md YAML + sections.
- Don't commit `.design-md-ref/` (full upstream clone at repo root).
- Don't deploy without user request unless fixing production bugs they reported.
