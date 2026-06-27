# Support Link Update to WhatsApp — Task Report

## Task
Change app-wide support link from LINE to WhatsApp (https://wa.link/2gw6vn) by updating the shared constant in src/constants.js.

## Final constants.js Content
```js
// App-wide constants.

// Support/chat link (used by the floating chat, deposit bank transfer,
// and the login contact action). WhatsApp click-to-chat link.
// NOTE: export name kept as LINE_URL for compatibility with existing imports.
export const LINE_URL = 'https://wa.link/2gw6vn'
```

## Verification: LINE_URL References
```
src/components/FloatingChat.jsx:3:import { LINE_URL } from '../constants.js'
src/components/FloatingChat.jsx:43:      window.open(LINE_URL, '_blank', 'noopener,noreferrer')
src/constants.js:5:// NOTE: export name kept as LINE_URL for compatibility with existing imports.
src/constants.js:6:export const LINE_URL = 'https://wa.link/2gw6vn'
src/pages/Deposit.jsx:7:import { LINE_URL } from '../constants.js'
src/pages/Deposit.jsx:22:    else if (key === 'bank') window.open(LINE_URL, '_blank', 'noopener,noreferrer')
src/pages/Login.jsx:6:import { LINE_URL } from '../constants.js'
src/pages/Login.jsx:50:          <button type="button" className="link-btn" onClick={() => window.open(LINE_URL, '_blank', 'noopener,noreferrer')}>
```

**Result:** All three importers (FloatingChat.jsx, Deposit.jsx, Login.jsx) still reference `LINE_URL` unchanged. Constant now points to `https://wa.link/2gw6vn`.

## Build Output
```
✓ built in 15.32s
```

Build succeeded with no errors. Only src/constants.js was modified.

## Git Commit
```
[main 81e4eb7] feat: point support links to WhatsApp (wa.link/2gw6vn)
 1 file changed, 4 insertions(+), 3 deletions(-)
```

**Commit short hash:** `81e4eb7`

## Summary
- Modified only src/constants.js as required
- Kept export name `LINE_URL` for compatibility
- All three import sites remain unchanged
- Build succeeded
- Commit created (not pushed per instructions)
