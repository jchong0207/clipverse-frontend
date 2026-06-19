# Clips Translate — Frontend

React (Vite) frontend for a **video translation service**: customers upload a video,
get an instant per-package quote, create an order, and pay only when they choose to.

This is an original implementation of that flow — not a copy of any third‑party site's
assets or markup.

## Features

- Email/password auth (sign up, log in, protected routes)
- Upload a video → duration is read **in the browser** → instant quote
- Three translation packages: **Subtitles**, **Voice-over**, **Full Dubbing** (priced per minute)
- Create an order from a quote; orders start **UNPAID** — pay or cancel later
- Mock "pay" flow that moves an order into production
- Dashboard listing all your orders and their status

## Run it standalone (no backend needed)

The app ships with an in-browser mock API (`src/api/mock.js`) backed by `localStorage`,
so it's fully usable on its own:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, create an account, and try the flow.

## Connect to the Spring Boot backend (later)

Set the API URL and the client switches from the mock to real HTTP calls — no page changes:

```bash
cp .env.example .env
# edit .env:
# VITE_API_URL=http://localhost:8080
npm run dev
```

The expected backend endpoints are listed in `src/api/client.js` (`realApi`):
`/api/auth/*`, `/api/packages`, `/api/quotes`, `/api/orders`, `/api/orders/:id/pay`, etc.

## Structure

```
src/
  api/        client.js (real+mock switch), mock.js (local data layer)
  store/      auth.jsx (AuthContext)
  components/ Navbar, Footer, ProtectedRoute
  pages/      Home, Pricing, Login, Register, Quote, Dashboard, OrderDetail
  index.css   styles
```
```
