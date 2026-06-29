# Popup Member Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing disabled `HomeAnnouncement` popup component to the live backend queue so authenticated members see admin-configured popups after login and on every home page visit.

**Architecture:** A new `PopupProvider` context store fetches from `/app-api/popup/pending` on login and on home page mount, holds the ordered queue, and exposes `markSeen(id)` which awaits `/app-api/popup/seen` before advancing the queue. `HomeAnnouncement` becomes a pure renderer that reads `current` from the store. `auth.jsx` calls `fetchOnLogin()` after login/register; `Home.jsx` calls `fetchOnHomeVisit()` on mount when a user is present.

**Tech Stack:** React 18, Vite, React Context API, `fetch` via existing `http()` helper in `src/api/client.js`

## Global Constraints

- All popup fetch/seen errors must fail silently — never block login flow or crash the page
- Logged-out visitors must never trigger a popup fetch
- `/seen` must be awaited before advancing the queue (OK button disabled while in-flight)
- Reuse existing CSS classes: `ann-overlay`, `ann-card`, `ann-title`, `ann-body`, `ann-ok`
- No backend changes — all six backend endpoints already exist and are tested
- `mockApi` stubs must be present so the app runs without a backend (`VITE_API_URL` unset)
- Follow the `notifications.jsx` store pattern exactly (same import style, same error handling shape)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/api/client.js` | Modify | Add `popup.pending()` and `popup.seen(id)` to both `realApi` and `mockApi` |
| `src/api/mock.js` | Modify | Add `popup` stubs so app runs without a backend |
| `src/store/popups.jsx` | Create | Queue state, `fetchOnLogin`, `fetchOnHomeVisit`, `markSeen` |
| `src/components/HomeAnnouncement.jsx` | Rewrite | Pure renderer — reads `current` + `markSeen` from popup store |
| `src/main.jsx` | Modify | Wrap provider tree with `<PopupProvider>` outside `<AuthProvider>` |
| `src/store/auth.jsx` | Modify | Call `popups.fetchOnLogin()` after `api.login()` and `api.register()` |
| `src/pages/Home.jsx` | Modify | Restore `<HomeAnnouncement />`, add `fetchOnHomeVisit` effect |
| `src/pages/Login.jsx` | Modify | Remove stale `sessionStorage.removeItem('cv_home_ann_seen')` dead code |
| `src/data/homeAnnouncement.js` | Delete | Static hardcoded data file — replaced entirely by backend; no longer imported |

---

### Task 1: Add popup API methods to client.js

**Files:**
- Modify: `src/api/client.js`

**Interfaces:**
- Produces:
  - `api.popup.pending()` → `Promise<Array<{ id: number, title: string, content: string, frequency: string, priority: number }>>`
  - `api.popup.seen(id: number)` → `Promise<void>`

- [ ] **Step 1: Add popup methods to `realApi` in `src/api/client.js`**

Open `src/api/client.js`. Inside the `realApi` object (after `saveCryptoWallet`), add:

```js
  popup: {
    pending: () => http('/app-api/popup/pending'),
    seen: (id) => http('/app-api/popup/seen', { method: 'POST', body: { popupId: id } }),
  },
```

- [ ] **Step 2: Add popup stubs to `mockApi` in `src/api/mock.js`**

Open `src/api/mock.js`. Find the `mockApi` export object and add the popup stubs alongside the other methods:

```js
  popup: {
    pending: async () => [],
    seen: async () => {},
  },
```

- [ ] **Step 3: Verify the mock export compiles (no import errors)**

Run:
```bash
cd C:\Users\JCNg\temp-research\clipverse-frontend
npm run build -- --mode development 2>&1 | head -30
```
Expected: build completes with no errors referencing `client.js` or `mock.js`.

- [ ] **Step 4: Commit**

```bash
git add src/api/client.js src/api/mock.js
git commit -m "feat(popup): add popup.pending and popup.seen API methods"
```

---

### Task 2: Create `src/store/popups.jsx`

**Files:**
- Create: `src/store/popups.jsx`

**Interfaces:**
- Consumes: `api.popup.pending()`, `api.popup.seen(id)` from Task 1
- Produces:
  - `PopupProvider` — React component wrapping children
  - `usePopups()` → `{ current: popup | null, fetchOnLogin: () => void, fetchOnHomeVisit: () => void, markSeen: (id: number) => Promise<void> }`
  - where `popup` = `{ id: number, title: string, content: string, frequency: string, priority: number }`

- [ ] **Step 1: Create `src/store/popups.jsx`**

```jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api/client.js'

const PopupContext = createContext(null)

export function PopupProvider({ children }) {
  const [queue, setQueue] = useState([])

  const fetchOnLogin = useCallback(async () => {
    try {
      const items = await api.popup.pending()
      setQueue(Array.isArray(items) ? items : [])
    } catch {
      // silent — a failed fetch must never block the login flow
    }
  }, [])

  const fetchOnHomeVisit = useCallback(async () => {
    try {
      const items = await api.popup.pending()
      setQueue(Array.isArray(items) ? items : [])
    } catch {
      // silent
    }
  }, [])

  const markSeen = useCallback(async (id) => {
    try {
      await api.popup.seen(id)
    } catch {
      // silent — popup is dismissed locally even if the server call fails
    }
    setQueue((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const current = queue.length > 0 ? queue[0] : null

  return (
    <PopupContext.Provider value={{ current, fetchOnLogin, fetchOnHomeVisit, markSeen }}>
      {children}
    </PopupContext.Provider>
  )
}

export const usePopups = () => useContext(PopupContext)
```

- [ ] **Step 2: Verify no syntax errors**

```bash
npm run build -- --mode development 2>&1 | head -30
```
Expected: build completes with no errors referencing `popups.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/store/popups.jsx
git commit -m "feat(popup): add PopupProvider store with queue and markSeen"
```

---

### Task 3: Wire `PopupProvider` into `main.jsx` and `auth.jsx`

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/store/auth.jsx`

**Interfaces:**
- Consumes: `PopupProvider`, `usePopups` from Task 2

- [ ] **Step 1: Add `PopupProvider` to `src/main.jsx`**

Add the import at the top of `src/main.jsx` alongside the other store imports:

```js
import { PopupProvider } from './store/popups.jsx'
```

Then wrap the existing `<AuthProvider>` tree. The provider order matters — `PopupProvider` must be **outside** `AuthProvider` so that `auth.jsx` can call `usePopups()` inside it. Replace the current provider nesting:

```jsx
      <BrowserRouter>
        <PopupProvider>
          <AuthProvider>
            <PaymentMethodProvider>
              <VideosProvider>
                <DeployHistoryProvider>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                </DeployHistoryProvider>
              </VideosProvider>
            </PaymentMethodProvider>
          </AuthProvider>
        </PopupProvider>
      </BrowserRouter>
```

- [ ] **Step 2: Call `fetchOnLogin` in `src/store/auth.jsx` after login and register**

Add the import at the top of `src/store/auth.jsx`:

```js
import { usePopups } from './popups.jsx'
```

Inside `AuthProvider`, add the hook call at the top of the function body (after the existing `useState` calls):

```js
  const popups = usePopups()
```

Then in the `login` function, call `fetchOnLogin` after `setUser`:

```js
  const login = async (creds) => {
    const r = await api.login(creds)
    setUser(r.user)
    popups.fetchOnLogin()
    return r
  }
```

And in `register`, the same pattern:

```js
  const register = async (info) => {
    const r = await api.register(info)
    setUser(r.user)
    popups.fetchOnLogin()
    return r
  }
```

- [ ] **Step 3: Verify build**

```bash
npm run build -- --mode development 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/main.jsx src/store/auth.jsx
git commit -m "feat(popup): wire PopupProvider into app tree and auth login/register"
```

---

### Task 4: Rewrite `HomeAnnouncement.jsx` as pure renderer

**Files:**
- Modify: `src/components/HomeAnnouncement.jsx`

**Interfaces:**
- Consumes: `usePopups()` from Task 2 — specifically `current` and `markSeen`

- [ ] **Step 1: Rewrite `src/components/HomeAnnouncement.jsx`**

Replace the entire file contents with:

```jsx
import { useState } from 'react'
import { usePopups } from '../store/popups.jsx'

export default function HomeAnnouncement() {
  const { current, markSeen } = usePopups()
  const [busy, setBusy] = useState(false)

  if (!current) return null

  const handleOk = async () => {
    setBusy(true)
    await markSeen(current.id)
    setBusy(false)
  }

  return (
    <div className="ann-overlay" role="dialog" aria-modal="true">
      <div className="ann-card">
        <h2 className="ann-title">{current.title}</h2>
        <div className="ann-body">
          <p className="ann-p">{current.content}</p>
        </div>
        <button type="button" className="ann-ok" onClick={handleOk} disabled={busy}>
          OK
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Remove stale `sessionStorage` call from `src/pages/Login.jsx`**

The old implementation used `sessionStorage` to track per-session seen state. That logic now lives in the backend via `/seen`. In `src/pages/Login.jsx`, inside the `onFinish` handler, delete the stale lines:

```js
      // Re-arm the home announcement so it greets the user right after login.
      try { sessionStorage.removeItem('cv_home_ann_seen') } catch { /* noop */ }
```

The `onFinish` handler after the edit should look like:

```js
  const onFinish = async (values) => {
    setError('')
    setBusy(true)
    try {
      await login(values)
      navigate(location.state?.from || '/videos', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }
```

- [ ] **Step 3: Delete `src/data/homeAnnouncement.js`**

This file contained the hardcoded static popup data. It is no longer imported anywhere after the `HomeAnnouncement.jsx` rewrite. Delete it:

```bash
git rm src/data/homeAnnouncement.js
```

- [ ] **Step 4: Verify build**

```bash
npm run build -- --mode development 2>&1 | head -30
```
Expected: no errors, no "cannot find module homeAnnouncement" warnings.

- [ ] **Step 5: Commit**

```bash
git add src/components/HomeAnnouncement.jsx src/pages/Login.jsx
git commit -m "feat(popup): rewrite HomeAnnouncement as pure renderer; remove hardcoded data and stale sessionStorage"
```

---

### Task 5: Re-enable `HomeAnnouncement` in `Home.jsx` with `fetchOnHomeVisit`

**Files:**
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `HomeAnnouncement` from Task 4; `usePopups()` from Task 2

- [ ] **Step 1: Update imports in `src/pages/Home.jsx`**

Replace the commented-out import line:
```js
// import HomeAnnouncement from '../components/HomeAnnouncement.jsx'
```
With:
```js
import HomeAnnouncement from '../components/HomeAnnouncement.jsx'
import { usePopups } from '../store/popups.jsx'
```

- [ ] **Step 2: Add `usePopups` hook and `fetchOnHomeVisit` effect**

Inside the `Home` component function, add after the existing `useAuth` and `useTranslation` lines:

```js
  const popups = usePopups()

  useEffect(() => {
    if (user) popups.fetchOnHomeVisit()
  }, [user])
```

- [ ] **Step 3: Restore `<HomeAnnouncement />` in the JSX**

Replace the comment placeholder in the JSX:
```jsx
      {/* Home announcement popup temporarily disabled — re-enable by restoring <HomeAnnouncement /> and its import. */}
```
With:
```jsx
      <HomeAnnouncement />
```

- [ ] **Step 4: Verify build**

```bash
npm run build -- --mode development 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 5: Manual smoke test**

Start the dev server:
```bash
npm run dev
```

Open the app in a browser (typically `http://localhost:5173`). With `VITE_API_URL` unset (mock mode):
- Log in — no popup appears (mock returns `[]`). Confirm login completes normally.
- Navigate to Home — no popup appears. Confirm page renders normally.

With `VITE_API_URL` set pointing to a running backend that has active popups seeded:
- Log in — popup appears after login, showing the first popup in priority order.
- Click OK — popup dismisses (waits for `/seen` to return), next popup appears if any.
- After all popups dismissed, none reappear for popups with `ONCE_ON_LOGIN` frequency.
- Navigate away and back to Home — `EVERY_HOME_VISIT` popups reappear; `ONCE_ON_LOGIN` do not.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat(popup): re-enable HomeAnnouncement with backend-wired popup queue"
```
