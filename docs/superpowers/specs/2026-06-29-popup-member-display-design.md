# Popup Member Display — Design Spec

**Date:** 2026-06-29
**Status:** Approved
**Repo:** clipverse-frontend
**Backend spec:** `clipverse-backend/docs/superpowers/specs/2026-06-27-popup-module-design.md`

---

## Overview

Wire the existing (disabled) `HomeAnnouncement` popup component to the live backend popup queue.
Admins configure popups in the admin panel; this feature makes authenticated members see them
after login and on every home page visit, in priority order, one at a time.

---

## Requirements

- Fetch the pending popup queue from `GET /app-api/popup/pending` immediately after login or register.
- Re-fetch on every home page mount (for `EVERY_HOME_VISIT` frequency popups).
- Show popups one at a time, in the order returned by the backend (priority ASC).
- On OK / close: call `POST /app-api/popup/seen` and wait for success before advancing to the next popup.
- Logged-out visitors never trigger a popup fetch.
- Popup fetch failures are silent — never block the login flow or crash the page.

---

## API

Two new methods added to `realApi` in `src/api/client.js`:

```js
popup: {
  pending: () => http('/app-api/popup/pending'),
  seen: (id) => http('/app-api/popup/seen', { method: 'POST', body: { popupId: id } }),
}
```

`mockApi` stubs: `pending` returns `[]`, `seen` is a no-op. Both stubs are present so the app
runs standalone without a backend.

Backend response shape per item: `{ id, title, content, frequency, priority }`.

---

## Store — `src/store/popups.jsx`

New context store, mirroring the `notifications.jsx` pattern.

**State:**
- `queue` — `Array<popup>` — the current pending queue for this session
- `current` — `queue[0]` or `null` when empty

**Methods:**
- `fetchOnLogin()` — calls `api.popup.pending()`, stores result as `queue`; fails silently
- `fetchOnHomeVisit()` — same call, replaces `queue`; fails silently
- `markSeen(id)` — awaits `api.popup.seen(id)` (fails silently), then removes the first item
  from `queue` (advancing `current`)

**Provider:** `PopupProvider` wraps children and exposes the store via `usePopups()` hook.

---

## Component — `src/components/HomeAnnouncement.jsx`

Rewritten as a pure renderer. No data fetching, no `sessionStorage`, no static data import.

- Reads `current` and `markSeen` from `usePopups()`
- If `current` is `null`, renders nothing
- Renders overlay card with `current.title` and `current.content` (plain text, single block)
- OK button calls `markSeen(current.id)`; button is disabled while the `/seen` call is in-flight
- Reuses existing CSS classes: `ann-overlay`, `ann-card`, `ann-title`, `ann-body`, `ann-ok`
- No `{uid}` interpolation — backend content is plain text

---

## Wiring changes to existing files

### `src/main.jsx`
Wrap `<AuthProvider>` with `<PopupProvider>`:
```jsx
<PopupProvider>
  <AuthProvider>
    ...
  </AuthProvider>
</PopupProvider>
```

### `src/store/auth.jsx`
After `api.login()` and `api.register()` both succeed, call `popups.fetchOnLogin()`:
```js
const popups = usePopups()
// inside login():
const r = await api.login(creds)
setUser(r.user)
popups.fetchOnLogin()   // fire-and-forget; fails silently
return r
// same pattern for register()
```

### `src/pages/Home.jsx`
- Uncomment the `HomeAnnouncement` import and restore `<HomeAnnouncement />` in the JSX.
- Add a `useEffect` that calls `popups.fetchOnHomeVisit()` when `user` is non-null:
```js
useEffect(() => {
  if (user) popups.fetchOnHomeVisit()
}, [user])
```

---

## Error handling & edge cases

| Scenario | Behaviour |
|----------|-----------|
| `/pending` throws on login | Queue stays empty; no popup shown; login completes normally |
| `/seen` throws on OK click | Popup dismissed locally; queue advances; may re-appear next login |
| Empty queue | `current` is `null`; component renders nothing |
| Logged-out home page visit | `user` is `null`; `fetchOnHomeVisit` is not called |
| Login then immediate home mount | `fetchOnLogin` runs first; `fetchOnHomeVisit` re-fetches on mount; backend seen-state is the source of truth |

---

## Files changed

| File | Change |
|------|--------|
| `src/api/client.js` | Add `popup.pending()` and `popup.seen()` to `realApi` and `mockApi` |
| `src/store/popups.jsx` | New file — popup queue store |
| `src/components/HomeAnnouncement.jsx` | Rewrite — pure renderer backed by popup store |
| `src/main.jsx` | Wrap with `<PopupProvider>` |
| `src/store/auth.jsx` | Call `popups.fetchOnLogin()` after login and register |
| `src/pages/Home.jsx` | Restore `<HomeAnnouncement />`, add `fetchOnHomeVisit` effect |

No schema changes. No backend changes. Backend endpoints already exist and are tested.
