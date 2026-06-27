# ClipVerse Frontend — DigitalOcean VPS Deployment Design

**Date:** 2026-06-22
**Status:** Approved design, pre-implementation
**Scope:** Deploy the `clipverse-frontend` static SPA to a fresh DigitalOcean droplet, served by Nginx on a custom domain over HTTPS, built on the VPS from a private GitHub repo, with auto-deploy on push to `main` via GitHub Actions. **Frontend only** — backend deployed separately later.

---

## Concrete Parameters

| Item | Value |
|---|---|
| Domain | `clipverse.it.com` (apex) + `www.clipverse.it.com` (redirects to apex) |
| Droplet public IP | `206.189.154.78` |
| OS | Ubuntu 24.04 LTS |
| GitHub repo | `Jchong0207/clipverse-frontend` (private, frontend's own repo) |
| Deploy branch | `main` |
| Web root | `/var/www/clipverse` |
| App dir on VPS | `/home/deploy/clipverse-frontend` |
| Non-root user | `deploy` (sudo) |
| Backend (later) | Same VPS, `127.0.0.1:8080`; Nginx pre-proxies `/app-api` + `/api` |
| Node | 20.x LTS via NodeSource |

---

## Architecture

A static Vite/React SPA served by Nginx, built on the VPS from the private GitHub repo (cloned via a read-only deploy key), exposed on the domain over HTTPS, and redeployed automatically on push to `main`.

### Request flow (production)

```
Browser ──HTTPS──> Nginx (droplet :443)
                     ├── /              → static SPA files from /var/www/clipverse
                     │                    (SPA fallback: unknown paths → index.html)
                     ├── /app-api/*      → reverse-proxy → 127.0.0.1:8080  (backend, later)
                     └── /api/*          → reverse-proxy → 127.0.0.1:8080  (backend, later)
HTTP (:80) ─────────> 301 redirect to HTTPS
www.clipverse.it.com → 301 redirect to apex clipverse.it.com
```

### Why this shape

The SPA's API client (`src/api/client.js`) uses **relative paths** with an empty `BASE`. It only needs `VITE_API_URL` to be **non-empty at build time** to switch from the in-browser mock to real-API mode (`const USE_REAL = Boolean(import.meta.env.VITE_API_URL)`; `const BASE = ''`). The *value* is irrelevant to routing — requests stay relative (`/app-api/...`, `/api/...`). Nginx then plays the exact role Vite's dev proxy plays, forwarding those two prefixes to the local backend — same-origin, no CORS.

Until the backend runs on `:8080`, `/app-api/*` and `/api/*` return **502**. This is expected and isolated to API calls; the static site loads fully. A 502 (not a fall-through to `index.html`) also confirms the proxy location blocks are correctly matched.

### Backend out of scope (this task)

The backend is deployed separately. Nginx is configured with the proxy blocks now so no Nginx change is needed when the backend comes online. Port 8080 is **not** opened in the firewall — the backend is only reachable through Nginx's internal proxy.

---

## Component 1 — One-Time Server Setup

Run once on the fresh droplet. Initial access is root via password (current state).

1. **System prep:** `apt update && apt upgrade -y`; set hostname; create non-root sudo user `deploy` (we build and serve as `deploy`, not root).
2. **SSH hardening:** Add the user's personal SSH public key to `deploy`'s `~/.ssh/authorized_keys` so login no longer needs the root password. Optionally disable `PasswordAuthentication` afterward. (Currently password-only — this is the moment to fix it.)
3. **Firewall (UFW):** Allow `OpenSSH`, allow `Nginx Full` (80 + 443), `ufw enable`. Port 8080 stays closed externally.
4. **Install Node.js 20.x** via NodeSource (build-on-VPS requires it).
5. **Install Nginx.**
6. **Install Certbot** (Let's Encrypt; via snap or apt on 24.04).

---

## Component 2 — GitHub Deploy Key & First Build

As the `deploy` user on the droplet:

1. **Deploy key:** `ssh-keygen -t ed25519 -f ~/.ssh/clipverse_deploy` → add the **public** key to the GitHub repo as a **read-only deploy key** (repo Settings → Deploy keys). Scoped to this one repo, read-only — no broad account access. Configure SSH so `git` uses this key for `github.com`.
2. **Clone:** `git clone git@github.com:Jchong0207/clipverse-frontend.git /home/deploy/clipverse-frontend`.
3. **Production env:** create `.env.production` with `VITE_API_URL=/` — non-empty (flips to real-API mode), and `/` keeps requests relative so Nginx proxies them. Vite reads `.env.production` automatically during `npm run build`.
4. **Build:** `npm ci && npm run build` → produces `dist/`.
5. **Publish:** rsync `dist/` to `/var/www/clipverse` (owned appropriately for Nginx to read).

---

## Component 3 — Nginx + HTTPS

1. **Server block** for `clipverse.it.com` + `www.clipverse.it.com`:
   - `root /var/www/clipverse;`
   - `location / { try_files $uri $uri/ /index.html; }` — SPA fallback so deep links / client-side routes survive refresh.
   - `location /app-api/ { proxy_pass http://127.0.0.1:8080; ... }` and the same for `/api/`, with standard proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).
   - Long-cache header on `/assets/`: `Cache-Control: public, max-age=31536000, immutable` (mirrors the existing `vercel.json`).
2. **HTTPS via Certbot:** `certbot --nginx -d clipverse.it.com -d www.clipverse.it.com` — obtains the cert, rewrites the block to listen on 443, adds HTTP→HTTPS redirect, installs the auto-renew timer.
3. **www → apex redirect:** 301 from `www.clipverse.it.com` to `clipverse.it.com`.

---

## Component 4 — Redeploy Script (source of truth)

`deploy.sh` in the app dir, used by **both** manual and CI deploys (no drift):

```sh
set -euo pipefail
cd /home/deploy/clipverse-frontend
git pull --ff-only origin main
npm ci
npm run build
rsync -a --delete dist/ /var/www/clipverse/
```

Idempotent; a failed build does not half-publish (publish step only runs after a successful build).

---

## Component 5 — Auto-Deploy on Push to `main` (GitHub Actions → SSH)

### Flow

```
git push origin main
  └─> GitHub Actions (.github/workflows/deploy.yml) on push to main
        └─> SSH into droplet as `deploy` (CI-only key)
              └─> run deploy.sh  (git pull && npm ci && npm run build && publish)
```

### Pieces

1. **CI-only SSH keypair** (separate from the personal login key, so CI can be revoked independently):
   - Public key → appended to `deploy`'s `~/.ssh/authorized_keys`.
   - Private key → GitHub repo secret `DEPLOY_SSH_KEY`. Also add `DEPLOY_HOST=206.189.154.78` and `DEPLOY_USER=deploy`.
2. **Workflow** `.github/workflows/deploy.yml`:
   - `on: push: branches: [main]`
   - Loads the SSH key, adds the droplet to `known_hosts`, runs `ssh $DEPLOY_USER@$DEPLOY_HOST 'bash ~/clipverse-frontend/deploy.sh'`.
   - `concurrency: deploy` so rapid pushes don't overlap.
   - Logs visible in the Actions tab; a red ❌ flags a failed deploy.

### Trade-offs / contingencies

- **Build runs on the VPS** → needs enough RAM for `vite build`. On a 1 GB droplet a Node build can OOM; **contingency: add a swap file** during server setup if the droplet is small.
- Auto-deploy covers the **frontend only**; the backend gets its own pipeline later.

---

## Prerequisite Ordering (real-world sequence)

1. Server setup (Component 1).
2. **Create DNS A records** — apex `clipverse.it.com` → `206.189.154.78`, and `www` → same. **Wait for propagation.** (Required before Certbot: Let's Encrypt validates by reaching the domain over HTTP.)
3. Deploy key + clone + first build (Component 2).
4. Nginx HTTP server block, publish `dist/` (Component 3, pre-TLS).
5. Certbot HTTPS (Component 3).
6. Auto-deploy wiring (Component 5).

---

## Testing / Verification

- **Nginx HTTP:** `curl -I http://clipverse.it.com` → 200; SPA loads in browser.
- **SPA routing:** visit a deep link (e.g. `/login`) and refresh → loads, no 404.
- **HTTPS:** `https://clipverse.it.com` shows a valid padlock; `http://` redirects to `https://`; `www.` redirects to apex.
- **API wiring:** `curl -I https://clipverse.it.com/app-api/member/user/get` → **502** (expected, backend not up) — confirms the proxy route exists and does not fall through to `index.html`.
- **Auto-deploy:** push a trivial change to `main` → Actions run goes green → change visible on the live site without manual SSH.

---

## Out of Scope

- Backend (Spring Boot) deployment — separate task; Nginx is pre-wired for it.
- CDN, monitoring/alerting, log aggregation.
- Staging environment / multi-branch deploys (only `main` auto-deploys).
