# ClipVerse — Frontend

A mobile-first web app for **ClipVerse**, an AI video-translation & cross-border content-promotion platform. Built with React + Vite, with full multi-language support and a code-split, lazy-loaded route structure.

## Tech stack

- **React 18** + **Vite 5**
- **react-router-dom 6** (routing)
- **Ant Design 6** (UI components)
- **react-i18next / i18next** (9 languages)
- In-browser **mock API** (so the app runs standalone with no backend)

## Getting started

```bash
npm install
npm run dev        # start dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

## Demo account

Login is enabled and a demo account is seeded automatically, so you can sign in out of the box:

| Field | Value |
|-------|-------|
| **Email** | `demo@clipverse.com` |
| **Password** | `Demo1234` |

You can also create a new account via the Register page. (Accounts live in the browser's `localStorage` while running on the mock API.)

## Backend — when it's ready

The app currently runs against an **in-browser mock backend** (`src/api/mock.js`) so it works with zero setup. To connect a real backend later:

1. Set the API base URL via an env var (see `.env.example`):
   ```bash
   # .env.local
   VITE_API_URL=https://your-api.example.com
   ```
2. With `VITE_API_URL` set, `src/api/client.js` automatically switches from the mock to the real API — **no page/component changes needed**. The mock mirrors the real API's shape.
3. Things to wire up on the real backend when available:
   - **Auth**: real registration/login + email verification code (the "Get code" on Register is currently a mock).
   - **Deposit / Withdrawal**: real receive addresses per network, live FX rates, and payment processing.
   - **Support links**: replace the placeholder LINE link in `src/constants.js` (`LINE_URL`), used by the floating chat, "Forgot password", and Local Bank Transfer.

## Internationalization

UI strings live in `src/i18n/locales/<lang>.json` (9 languages: `en, ko, ja, ar, ms, vi, es, id, zh-TW`). English (`en`) is the source/fallback. The long User Agreement text is stored per-language in `src/data/agreements/<lang>.json`.

To add a language: drop in a new locale JSON and register it in `src/i18n/index.js`.

## Project structure

```
src/
├── main.jsx               # app entry
├── App.jsx                # routes + layout shell + lazy-route prefetch
├── index.css              # global styles
├── constants.js           # app-wide constants (e.g. LINE_URL)
├── api/                   # data layer (client.js switches real <-> mock)
├── store/                 # auth context (useAuth)
├── components/            # shared UI (Navbar, BottomNav, SideDrawer, SubPageHeader, FloatingChat, cryptoIcons, ...)
├── pages/                 # one file per route (lazy-loaded)
├── utils/                 # helpers (storage.js)
├── data/                  # static content (fiat currencies, agreements, home announcement)
└── i18n/                  # i18next setup + locale files
public/assets/
├── img/   video/   flags/   sources/   # grouped static assets
```

## Performance

- **Route-level code splitting** (`React.lazy` + `Suspense`): the landing page loads first, then all other route chunks are **prefetched in the background during idle time**, so navigation is instant without a large up-front download.

## Deployment

The repo includes `vercel.json`. On Vercel: build command `npm run build`, output directory `dist`.
