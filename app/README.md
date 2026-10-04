# BiyeFlow React PWA

Installable event host app — invites, guests, Buzz, menu, and day-of ops.

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

### Cross-device sync (KV)

1. `npx wrangler login`
2. `npx wrangler kv namespace create BIYEFLOW_SYNC`
3. Paste the namespace id into `wrangler.toml` under `[[kv_namespaces]]` with binding `BIYEFLOW_SYNC`
4. Redeploy (`npm run deploy` or push to Git)

In the Cloudflare dashboard you can also bind KV on the biyeflow Pages project: Settings → Bindings → KV.

Without that binding, **Sync** will say cloud sync is not configured. Each browser still keeps its own local copy.

### PWA install

After deploy (HTTPS required):

- **Android Chrome:** menu → Install app
- **iOS Safari:** Share → Add to Home Screen
- **Desktop Chrome:** install icon in the address bar

Local test: `npm run build && npm run preview`, then open DevTools → Application → Manifest / Service Workers.

## Data

Each browser still caches a copy under `biyeflow.v1`. That is why a laptop Chrome profile and a phone Safari profile do not see each other by default.

To share one event across devices:

1. Open **https://biyeflow.pages.dev** on the laptop (not localhost).
2. Create or open the event, then use sync / the event code from the host tools.
3. Open the same URL on the phone and continue in that event.

Edits then push to Cloudflare KV and pull onto other linked devices. Export/Import JSON remains available as a manual backup.

Local API testing: run `npm run dev` and `npm run dev:api` together.

## Phase 1 scope

- App shell (sidebar, header, mobile nav) matching `new 113.html` design
- Menu Board with dials, meal cards, modals, copy export
- PWA install + offline shell
- Other nav items route to Coming Soon (Phase 2)
