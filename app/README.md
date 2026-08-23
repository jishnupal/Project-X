# BiyeFlow React PWA

Installable wedding control room — Phase 1: Menu Board + app shell.

## Develop

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173/menu

## Build

```bash
npm run build
npm run preview
```

## Deploy (Cloudflare Pages)

### Option A — Wrangler CLI

1. Create a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with **Cloudflare Pages — Edit** permission.
2. Set the token (PowerShell):

```powershell
$env:CLOUDFLARE_API_TOKEN = "your-token-here"
```

3. Deploy:

```bash
npm run deploy
```

This runs icon generation, production build, and `wrangler pages deploy`.

### Option B — Cloudflare dashboard (Git)

Connect the repo in Cloudflare Pages:

- **Root directory:** `app`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

SPA routing is handled by `public/_redirects` (`/* /index.html 200`).

### PWA install

After deploy (HTTPS required):

- **Android Chrome:** menu → Install app
- **iOS Safari:** Share → Add to Home Screen
- **Desktop Chrome:** install icon in the address bar

Local test: `npm run build && npm run preview`, then open DevTools → Application → Manifest / Service Workers.

## Data

Uses the same `localStorage` key as the legacy prototype: `biyeflow.v1`. Open the React app in the same browser to keep your menu data.

## Phase 1 scope

- App shell (sidebar, header, mobile nav) matching `new 113.html` design
- Menu Board with dials, meal cards, modals, copy export
- PWA install + offline shell
- Other nav items route to Coming Soon (Phase 2)
