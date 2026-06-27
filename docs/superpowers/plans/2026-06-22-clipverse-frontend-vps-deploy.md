# ClipVerse Frontend VPS Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the `clipverse-frontend` static SPA to a fresh DigitalOcean droplet, served by Nginx on `clipverse.it.com` over HTTPS, built on the VPS from the private GitHub repo, and auto-deployed on every push to `main`.

**Architecture:** Nginx serves the static Vite build from `/var/www/clipverse` with SPA fallback, and reverse-proxies `/app-api` and `/api` to a future backend on `127.0.0.1:8080`. The droplet builds the app itself from a private repo cloned via a read-only deploy key. GitHub Actions SSHes in on push to `main` and runs a single `deploy.sh`.

**Tech Stack:** Ubuntu 24.04 LTS, Nginx, Node.js 20 (NodeSource), Certbot/Let's Encrypt, UFW, GitHub Actions.

## Global Constraints

- Domain (apex): `clipverse.it.com`; also `www.clipverse.it.com` → 301 redirect to apex.
- Droplet public IP: `206.189.154.78`.
- OS: Ubuntu 24.04 LTS.
- GitHub repo: `Jchong0207/clipverse-frontend` (private), deploy branch `main`.
- Non-root user: `deploy` (sudo). Build and serve as `deploy`, never root.
- Web root: `/var/www/clipverse`. App dir: `/home/deploy/clipverse-frontend`.
- Backend is OUT OF SCOPE: Nginx pre-proxies `/app-api` + `/api` to `127.0.0.1:8080`; these return 502 until the backend exists. Port 8080 is NOT opened in UFW.
- Production build env: `.env.production` with `VITE_API_URL=/` (non-empty → real-API mode; `/` keeps requests relative for Nginx to proxy).
- `deploy.sh` is the single source of truth for deploys (used by both manual and CI).
- Repo files only are committed (`.env.production` is gitignored — do NOT commit it; it is created on the server). Committed artifacts: `deploy.sh`, `.github/workflows/deploy.yml`.

---

## File Structure

**On the VPS (not in git):**
- `/home/deploy/clipverse-frontend/` — cloned repo, build happens here
- `/home/deploy/clipverse-frontend/.env.production` — created on server, gitignored
- `/var/www/clipverse/` — published static files Nginx serves
- `/etc/nginx/sites-available/clipverse.it.com` — Nginx server block (Certbot edits it)
- `~/.ssh/clipverse_deploy[.pub]` (deploy user) — GitHub deploy key
- `~/.ssh/authorized_keys` (deploy user) — personal key + CI key

**In the git repo (`Jchong0207/clipverse-frontend`):**
- `deploy.sh` — Create. Pull + build + publish. Source of truth for deploys.
- `.github/workflows/deploy.yml` — Create. Auto-deploy on push to main.
- `.gitignore` — Modify if needed: ensure `.env.production` is ignored.

---

## Task 1: Server prep, non-root user, SSH key, firewall

**Files:** None in git. Remote system config on `206.189.154.78`.

**Interfaces:**
- Consumes: root password access to the droplet.
- Produces: a `deploy` sudo user reachable by SSH key; UFW active allowing OpenSSH + Nginx Full.

- [ ] **Step 1: SSH in as root and update the system**

```bash
ssh root@206.189.154.78
# once in:
apt update && apt upgrade -y
hostnamectl set-hostname clipverse
```

- [ ] **Step 2: Create the non-root sudo user `deploy`**

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
```

- [ ] **Step 3: Install your personal SSH public key for `deploy`**

On your LOCAL Windows machine (Git Bash / PowerShell), get your public key. If you don't have one:
```bash
ssh-keygen -t ed25519 -C "jchong-personal"   # press enter for defaults
cat ~/.ssh/id_ed25519.pub                      # copy this
```
On the droplet (still root), install it for `deploy`:
```bash
mkdir -p /home/deploy/.ssh
echo "PASTE_YOUR_PERSONAL_PUBLIC_KEY_HERE" >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

- [ ] **Step 4: Verify key login works as `deploy` (NEW terminal — do not close root yet)**

Run from local machine:
```bash
ssh deploy@206.189.154.78 "whoami && sudo -n true 2>/dev/null && echo SUDO_OK || echo SUDO_NEEDS_PW"
```
Expected: prints `deploy`. (Sudo may prompt; passwordless sudo is optional.)

- [ ] **Step 5: Configure UFW firewall**

As `deploy` (or root) on the droplet:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # note: Nginx not installed yet; UFW knows the app profile after Task 2. If it errors, run: sudo ufw allow 80,443/tcp
sudo ufw --force enable
sudo ufw status
```
Expected: `Status: active`, rules for OpenSSH (22) and 80/443. Port 8080 absent.

- [ ] **Step 6 (optional): Disable SSH password auth**

Only after Step 4 confirmed key login works:
```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```
Verify a NEW key-based session still connects before closing the current one.

- [ ] **Step 7: (No commit — remote system config only.)**

---

## Task 2: Install Node 20, Nginx, Certbot

**Files:** None in git. Remote package installs.

**Interfaces:**
- Consumes: `deploy` sudo access from Task 1.
- Produces: `node`/`npm`, `nginx`, `certbot` available on the droplet.

- [ ] **Step 1: Install Node.js 20.x via NodeSource**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

- [ ] **Step 2: Verify Node and npm**

```bash
node -v && npm -v
```
Expected: `v20.x.x` and an npm version printed.

- [ ] **Step 3: Install Nginx**

```bash
sudo apt install -y nginx
```

- [ ] **Step 4: Verify Nginx is running and reachable**

```bash
sudo systemctl status nginx --no-pager | head -3
curl -I http://206.189.154.78
```
Expected: `active (running)`; curl returns `200` with the default Nginx page.

- [ ] **Step 5: Install Certbot (Nginx plugin)**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

- [ ] **Step 6: Verify Certbot**

```bash
certbot --version
```
Expected: `certbot 2.x.x`.

- [ ] **Step 7: (Optional) add swap if droplet RAM < 2 GB**

Check RAM, add 2 GB swap to prevent `vite build` OOM:
```bash
free -m
# if total mem < ~2000:
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -m   # confirm swap shows
```

- [ ] **Step 8: (No commit — remote installs only.)**

---

## Task 3: DNS records (apex + www)

**Files:** None. DNS provider for `it.com` / `clipverse.it.com`.

**Interfaces:**
- Consumes: domain control panel access.
- Produces: `clipverse.it.com` and `www.clipverse.it.com` resolving to `206.189.154.78`. REQUIRED before Task 6 (Certbot).

- [ ] **Step 1: Create the A records**

In your DNS provider for `clipverse.it.com`:
- `A` record: host `@` (apex) → `206.189.154.78`
- `A` record: host `www` → `206.189.154.78`
(TTL default is fine.)

- [ ] **Step 2: Verify propagation**

From local machine (or droplet):
```bash
nslookup clipverse.it.com
nslookup www.clipverse.it.com
```
Expected: both resolve to `206.189.154.78`. Re-check until they do (can take minutes to hours). Do NOT start Task 6 until both resolve.

- [ ] **Step 3: (No commit — DNS only.)**

---

## Task 4: Add `deploy.sh` and `.env.production` handling to the repo

**Files:**
- Create: `deploy.sh` (repo root)
- Modify: `.gitignore` (ensure `.env.production` ignored)

**Interfaces:**
- Consumes: nothing.
- Produces: `deploy.sh` — pulls `main`, runs `npm ci && npm run build`, rsyncs `dist/` to `/var/www/clipverse`. Called by manual deploys and by the CI workflow (Task 7).

Work in the LOCAL repo at `C:/Users/JCNg/temp-research/clipverse-frontend`.

- [ ] **Step 1: Confirm `.gitignore` ignores env files**

Read `.gitignore`. It already contains `.env` and `.env.local`. Add `.env.production` if absent.
```
.env.production
```

- [ ] **Step 2: Create `deploy.sh`**

```sh
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/deploy/clipverse-frontend"
WEB_ROOT="/var/www/clipverse"

cd "$APP_DIR"
git pull --ff-only origin main
npm ci
npm run build
sudo rsync -a --delete dist/ "$WEB_ROOT/"
echo "Deploy complete: $(git rev-parse --short HEAD)"
```

- [ ] **Step 3: Make it executable and verify syntax locally**

```bash
cd "C:/Users/JCNg/temp-research/clipverse-frontend"
git update-index --chmod=+x deploy.sh 2>/dev/null || true
bash -n deploy.sh && echo "SYNTAX_OK"
```
Expected: `SYNTAX_OK` (this only checks bash syntax; it does not run the deploy on Windows).

- [ ] **Step 4: Commit**

```bash
git add deploy.sh .gitignore
git commit -m "chore: add deploy.sh and ignore .env.production"
git push origin main
```

---

## Task 5: Deploy key, clone, first build, publish

**Files:** None in git. Remote, as `deploy` user. Depends on Task 4 being pushed.

**Interfaces:**
- Consumes: `deploy.sh` on `main` (Task 4); Node/Nginx (Task 2).
- Produces: built SPA published at `/var/www/clipverse`.

- [ ] **Step 1: Generate the deploy key on the droplet (as `deploy`)**

```bash
ssh deploy@206.189.154.78
ssh-keygen -t ed25519 -f ~/.ssh/clipverse_deploy -N "" -C "clipverse-deploy-key"
cat ~/.ssh/clipverse_deploy.pub
```
Copy the printed public key.

- [ ] **Step 2: Add it as a read-only deploy key on GitHub**

GitHub → repo `Jchong0207/clipverse-frontend` → Settings → Deploy keys → Add deploy key. Paste the public key. Leave "Allow write access" UNCHECKED.

- [ ] **Step 3: Tell SSH to use this key for github.com**

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/clipverse_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
ssh -T git@github.com   # accept host key; expect "Hi Jchong0207/clipverse-frontend! You've successfully authenticated"
```
Expected: authentication success message (it says shell access is not provided — that's normal).

- [ ] **Step 4: Clone the repo**

```bash
git clone git@github.com:Jchong0207/clipverse-frontend.git /home/deploy/clipverse-frontend
cd /home/deploy/clipverse-frontend
```

- [ ] **Step 5: Create `.env.production` on the server (NOT committed)**

```bash
echo "VITE_API_URL=/" > /home/deploy/clipverse-frontend/.env.production
cat .env.production   # confirm: VITE_API_URL=/
```

- [ ] **Step 6: Create the web root and first build/publish**

```bash
sudo mkdir -p /var/www/clipverse
cd /home/deploy/clipverse-frontend
npm ci
npm run build
sudo rsync -a --delete dist/ /var/www/clipverse/
ls /var/www/clipverse        # expect index.html and assets/
```
Expected: `dist/` built; `/var/www/clipverse/index.html` exists.

- [ ] **Step 7: (No commit — server state; `.env.production` is intentionally not committed.)**

---

## Task 6: Nginx server block + HTTPS

**Files:**
- Create on server: `/etc/nginx/sites-available/clipverse.it.com`

**Interfaces:**
- Consumes: published files in `/var/www/clipverse` (Task 5); DNS resolving (Task 3); Certbot (Task 2).
- Produces: site live on HTTPS with SPA fallback and `/app-api`+`/api` proxy to `127.0.0.1:8080`; www→apex redirect.

- [ ] **Step 1: Write the Nginx server block (HTTP first)**

```bash
sudo tee /etc/nginx/sites-available/clipverse.it.com >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name clipverse.it.com www.clipverse.it.com;

    root /var/www/clipverse;
    index index.html;

    # Long-cache hashed assets (mirrors vercel.json)
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # Backend proxy (backend not up yet -> 502 expected)
    location /app-api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

- [ ] **Step 2: Enable the site, disable default, test config**

```bash
sudo ln -sf /etc/nginx/sites-available/clipverse.it.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```
Expected: `nginx -t` reports `syntax is ok` / `test is successful`.

- [ ] **Step 3: Verify HTTP serves the SPA**

```bash
curl -I http://clipverse.it.com
```
Expected: `HTTP/1.1 200 OK`, `Content-Type: text/html`. Open `http://clipverse.it.com` in a browser → SPA loads.

- [ ] **Step 4: Verify SPA deep-link fallback**

```bash
curl -I http://clipverse.it.com/login
```
Expected: `200` (served `index.html`, not 404).

- [ ] **Step 5: Obtain HTTPS cert (Certbot rewrites the block)**

```bash
sudo certbot --nginx -d clipverse.it.com -d www.clipverse.it.com --redirect --agree-tos -m it.support@fortuneprime.com --no-eff-email
```
Expected: "Successfully received certificate"; Certbot adds 443 listeners and the HTTP→HTTPS redirect.

- [ ] **Step 6: Add www→apex redirect**

Certbot creates a combined block. Ensure www redirects to apex by adding a dedicated 443 redirect server (only if Certbot didn't already split them). Inspect:
```bash
sudo nginx -T 2>/dev/null | grep -A2 "server_name www.clipverse.it.com"
```
If www and apex share one block, add this server block to `/etc/nginx/sites-available/clipverse.it.com` (adjust cert paths to those Certbot used):
```bash
# Append a redirect-only server for www on 443:
sudo tee -a /etc/nginx/sites-available/clipverse.it.com >/dev/null <<'EOF'

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.clipverse.it.com;
    ssl_certificate /etc/letsencrypt/live/clipverse.it.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clipverse.it.com/privkey.pem;
    return 301 https://clipverse.it.com$request_uri;
}
EOF
sudo nginx -t && sudo systemctl reload nginx
```
(If a `www` redirect already exists, skip this step.)

- [ ] **Step 7: Verify HTTPS, redirects, and API proxy**

```bash
curl -I http://clipverse.it.com                       # expect 301 -> https
curl -I https://clipverse.it.com                      # expect 200, valid TLS
curl -I https://www.clipverse.it.com                  # expect 301 -> https://clipverse.it.com
curl -I https://clipverse.it.com/app-api/member/user/get  # expect 502 (backend down) — proxy works
```
Expected exactly as annotated. The 502 (not 200/404) confirms the proxy route is matched. Browser: padlock valid.

- [ ] **Step 8: Verify auto-renew is scheduled**

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```
Expected: dry-run succeeds; a certbot timer is listed.

- [ ] **Step 9: (No commit — server config only.)**

---

## Task 7: GitHub Actions auto-deploy on push to `main`

**Files:**
- Create: `.github/workflows/deploy.yml` (repo)

**Interfaces:**
- Consumes: `deploy.sh` on the server (Task 5 clone has it); SSH access as `deploy`.
- Produces: every push to `main` SSHes in and runs `deploy.sh`.

- [ ] **Step 1: Generate a CI-only SSH keypair**

On your LOCAL machine (keep this key OUT of the repo):
```bash
ssh-keygen -t ed25519 -f ./clipverse_ci -N "" -C "github-actions-deploy"
cat ./clipverse_ci.pub    # public -> goes to the server
cat ./clipverse_ci        # private -> goes to GitHub secret
```

- [ ] **Step 2: Authorize the CI public key on the droplet**

```bash
ssh deploy@206.189.154.78
echo "PASTE_clipverse_ci.pub_CONTENTS" >> ~/.ssh/authorized_keys
```
Verify from local:
```bash
ssh -i ./clipverse_ci deploy@206.189.154.78 "echo CI_KEY_OK"
```
Expected: `CI_KEY_OK`.

- [ ] **Step 3: Add GitHub repo secrets**

GitHub → repo → Settings → Secrets and variables → Actions → New repository secret:
- `DEPLOY_SSH_KEY` = full contents of the private `clipverse_ci` file
- `DEPLOY_HOST` = `206.189.154.78`
- `DEPLOY_USER` = `deploy`

Then DELETE the local `clipverse_ci` private key file (it now lives only in the secret).

- [ ] **Step 4: Create the workflow**

In the LOCAL repo, create `.github/workflows/deploy.yml`:
```yaml
name: Deploy frontend to VPS

on:
  push:
    branches: [main]

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Set up SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H "${{ secrets.DEPLOY_HOST }}" >> ~/.ssh/known_hosts

      - name: Run remote deploy
        run: |
          ssh -i ~/.ssh/id_ed25519 \
            "${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}" \
            'bash /home/deploy/clipverse-frontend/deploy.sh'
```

- [ ] **Step 5: Commit and push (this push itself triggers the first CI deploy)**

```bash
cd "C:/Users/JCNg/temp-research/clipverse-frontend"
git add .github/workflows/deploy.yml
git commit -m "ci: auto-deploy to VPS on push to main"
git push origin main
```

- [ ] **Step 6: Verify the Actions run succeeds**

GitHub → repo → Actions tab → watch the "Deploy frontend to VPS" run.
Expected: green ✓. If `deploy.sh` needs `sudo rsync` without a TTY and prompts for a password, fix by granting passwordless sudo for rsync on the droplet:
```bash
echo 'deploy ALL=(ALL) NOPASSWD: /usr/bin/rsync' | sudo tee /etc/sudoers.d/deploy-rsync
sudo chmod 440 /etc/sudoers.d/deploy-rsync
```
Re-run the failed job. Expected: green ✓.

- [ ] **Step 7: End-to-end verification**

Make a trivial visible change (e.g. edit a heading in `src/`), commit, push to `main`. Watch Actions go green, then:
```bash
curl -s https://clipverse.it.com | grep -i "<title>"
```
Expected: the live site reflects the change without any manual SSH.

---

## Self-Review

**Spec coverage:**
- Server setup (Component 1) → Task 1, Task 2. ✓
- Deploy key & first build (Component 2) → Task 5. ✓
- Nginx + HTTPS (Component 3) → Task 6. ✓
- Redeploy script (Component 4) → Task 4 (`deploy.sh`). ✓
- Auto-deploy (Component 5) → Task 7. ✓
- DNS-before-Certbot ordering → Task 3 precedes Task 6, with explicit gate in Task 3 Step 2. ✓
- Backend-out-of-scope 502 proxy → Task 6 Steps 1 & 7. ✓
- Swap contingency for small droplets → Task 2 Step 7. ✓
- SSH hardening → Task 1 Steps 3–6. ✓

**Placeholder scan:** Remaining tokens are intentional secrets the operator must paste (their own public keys / private CI key) — `PASTE_YOUR_PERSONAL_PUBLIC_KEY_HERE`, `PASTE_clipverse_ci.pub_CONTENTS`. These are not plan gaps; they are values that cannot be hardcoded. All commands, file contents, and config are fully specified.

**Type/name consistency:** `deploy.sh` path (`/home/deploy/clipverse-frontend/deploy.sh`), web root (`/var/www/clipverse`), user (`deploy`), and `VITE_API_URL=/` are identical across Tasks 4–7. ✓

---

## Notes / Known Adjustments at Execution Time

- **`it.com` DNS:** `clipverse.it.com` is a registrable name under the `it.com` service. Manage records wherever you registered `clipverse.it.com`. If that provider only lets you set records on the registrable name, `@` = apex and `www` = subdomain as written.
- **Certbot www block:** Task 6 Step 6 is conditional — modern `certbot --nginx` often handles both names in one block with the redirect already in place. Inspect before appending to avoid a duplicate `server_name`.
- **`sudo` in CI:** `deploy.sh` uses `sudo rsync`. Task 7 Step 6 includes the passwordless-sudo-for-rsync fix needed for non-interactive CI.
