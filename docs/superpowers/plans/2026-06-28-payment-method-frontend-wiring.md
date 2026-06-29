# Payment Method Frontend Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the frontend to the backend payment-method API so users can save bank/crypto details in Settings, see them pre-filled in the Withdrawal page, and have the data fetched asynchronously on login.

**Architecture:** Add a `PaymentMethodContext` store (modelled after the existing `NotificationContext`) that fetches `/app-api/member/payment/list` on login and exposes `bank`, `usdt`, `usdc`, and save functions. Settings.jsx replaces its `localStorage`-only logic with real API calls that also update the store. Withdrawal.jsx reads from the store instead of `loadJSON('cv_bank')`.

**Tech Stack:** React 18, React Context, Ant Design 5, react-i18next, Vite + Spring Boot backend (proxy on `/app-api`)

## Global Constraints

- All API calls go through `src/api/client.js` → `http()` — never call `fetch` directly from pages.
- `USE_REAL` gates mock vs. real; add mock implementations to `mockApi` in `mock.js` so the app still runs standalone.
- All user-visible strings go through `useTranslation()` + the `en.json` locale file (and its sibling locales). Copy strings to all locale files, even if they are identical for now — the i18n loader requires every key to be present in every locale.
- The store must reset on logout (watch `user` going to `null`, mirroring `NotificationProvider`).
- Payment method slots: 1 BANK, 1 USDT crypto wallet, 1 USDC crypto wallet.
- Bank API fields: `accountName`, `bankName`, `accountNumber`, `bankBranch` (optional).
- Crypto API fields: `currency` ("USDT" or "USDC"), `network` (e.g. "TRC-20"), `walletAddress`.
- Backend response shape (`PaymentMethodRespVO`): `{ id, type ("BANK"|"CRYPTO"), currency, accountName, bankName, accountNumber, bankBranch, network, walletAddress }`.
- The Withdrawal page existing `bank.fullName` / `bank.bankAccount` LocalStorage keys are replaced by the store — the old `cv_bank` / `cv_blockchain` keys are no longer the source of truth.

---

### Task 1: API client — add payment-method methods

**Files:**
- Modify: `src/api/client.js`
- Modify: `src/api/mock.js`

**Interfaces:**
- Produces:
  - `api.listPaymentMethods()` → `Promise<PaymentMethodRespVO[]>` (array, may be empty)
  - `api.saveBankAccount({ accountName, bankName, accountNumber, bankBranch })` → `Promise<null>`
  - `api.saveCryptoWallet({ currency, network, walletAddress })` → `Promise<null>`

---

- [ ] **Step 1: Add real API methods to `realApi` in `src/api/client.js`**

Add these three methods inside the `realApi` object, after `listRevenue`:

```js
  async listPaymentMethods() {
    return http('/app-api/member/payment/list')
  },
  async saveBankAccount(body) {
    return http('/app-api/member/payment/bank/save', { method: 'POST', body })
  },
  async saveCryptoWallet(body) {
    return http('/app-api/member/payment/crypto/save', { method: 'POST', body })
  },
```

- [ ] **Step 2: Add mock implementations to `mockApi` in `src/api/mock.js`**

The mock needs its own localStorage key. Find where other mock methods are defined and add:

```js
  // ---- Payment methods ----
  async listPaymentMethods() {
    await delay(200)
    return read('cv_payment_methods', [])
  },
  async saveBankAccount(body) {
    await delay(250)
    const list = read('cv_payment_methods', [])
    const existing = list.findIndex((m) => m.type === 'BANK')
    const entry = {
      id: existing >= 0 ? list[existing].id : uid(),
      type: 'BANK',
      currency: null,
      accountName: body.accountName,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      bankBranch: body.bankBranch || null,
      network: null,
      walletAddress: null,
    }
    if (existing >= 0) list[existing] = entry; else list.push(entry)
    write('cv_payment_methods', list)
    return null
  },
  async saveCryptoWallet(body) {
    await delay(250)
    const list = read('cv_payment_methods', [])
    const existing = list.findIndex((m) => m.type === 'CRYPTO' && m.currency === body.currency)
    const entry = {
      id: existing >= 0 ? list[existing].id : uid(),
      type: 'CRYPTO',
      currency: body.currency,
      accountName: null,
      bankName: null,
      accountNumber: null,
      bankBranch: null,
      network: body.network,
      walletAddress: body.walletAddress,
    }
    if (existing >= 0) list[existing] = entry; else list.push(entry)
    write('cv_payment_methods', list)
    return null
  },
```

- [ ] **Step 3: Verify the mock exports correctly**

`mockApi` is consumed by `const impl = USE_REAL ? realApi : mockApi`. Open the app in the browser (or run `npm run dev`) and confirm there are no import errors in the console. No real API call should be made in mock mode.

- [ ] **Step 4: Commit**

```bash
git add src/api/client.js src/api/mock.js
git commit -m "feat(payment): add payment-method API calls and mock implementations"
```

---

### Task 2: PaymentMethod context store

**Files:**
- Create: `src/store/paymentMethods.jsx`

**Interfaces:**
- Consumes: `api.listPaymentMethods()`, `api.saveBankAccount()`, `api.saveCryptoWallet()` (from Task 1); `useAuth()` from `src/store/auth.jsx`
- Produces:
  - `<PaymentMethodProvider>` — wrap around children in `src/main.jsx`
  - `usePaymentMethods()` → `{ bank, usdt, usdc, loaded, loading, saveBankAccount, saveCryptoWallet, refresh }`
    - `bank`: `PaymentMethodRespVO` or `null`
    - `usdt`: `PaymentMethodRespVO` or `null` (where `currency === 'USDT'`)
    - `usdc`: `PaymentMethodRespVO` or `null` (where `currency === 'USDC'`)
    - `saveBankAccount(body)` → `Promise<void>` (calls API, refreshes list)
    - `saveCryptoWallet(body)` → `Promise<void>` (calls API, refreshes list)
    - `refresh()` → `Promise<void>` (force re-fetch)

---

- [ ] **Step 1: Create `src/store/paymentMethods.jsx`**

```jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './auth.jsx'

const PaymentMethodContext = createContext(null)

export function PaymentMethodProvider({ children }) {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (force = false) => {
    if (!user || (loaded && !force)) return
    setLoading(true)
    try {
      const items = await api.listPaymentMethods()
      setList(items || [])
      setLoaded(true)
    } catch {
      // leave as-is; a later refresh can retry
    } finally {
      setLoading(false)
    }
  }, [user, loaded])

  // Deferred prefetch on login — runs after videos/deploys/notifications.
  useEffect(() => {
    if (!user) {
      setList([])
      setLoaded(false)
      return undefined
    }
    let handle
    const schedule = () => load()
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      handle = window.requestIdleCallback(schedule, { timeout: 4000 })
      return () => window.cancelIdleCallback?.(handle)
    }
    handle = setTimeout(schedule, 1500)
    return () => clearTimeout(handle)
  }, [user, load])

  const saveBankAccount = useCallback(async (body) => {
    await api.saveBankAccount(body)
    await load(true)
  }, [load])

  const saveCryptoWallet = useCallback(async (body) => {
    await api.saveCryptoWallet(body)
    await load(true)
  }, [load])

  const refresh = useCallback(() => load(true), [load])

  const bank = list.find((m) => m.type === 'BANK') ?? null
  const usdt = list.find((m) => m.type === 'CRYPTO' && m.currency === 'USDT') ?? null
  const usdc = list.find((m) => m.type === 'CRYPTO' && m.currency === 'USDC') ?? null

  return (
    <PaymentMethodContext.Provider value={{ bank, usdt, usdc, loaded, loading, saveBankAccount, saveCryptoWallet, refresh }}>
      {children}
    </PaymentMethodContext.Provider>
  )
}

export const usePaymentMethods = () => useContext(PaymentMethodContext)
```

- [ ] **Step 2: Register the provider in `src/main.jsx`**

Open `src/main.jsx` and find where other providers like `AuthProvider` and `NotificationProvider` are composed. Wrap `<PaymentMethodProvider>` inside `<AuthProvider>` (it depends on `useAuth`) but the order relative to other child providers does not matter:

```jsx
// add import at top
import { PaymentMethodProvider } from './store/paymentMethods.jsx'

// wrap the existing children, e.g.:
<AuthProvider>
  <PaymentMethodProvider>
    {/* ... rest of the tree ... */}
  </PaymentMethodProvider>
</AuthProvider>
```

- [ ] **Step 3: Verify in browser**

Log in (mock mode). Open the React DevTools and confirm `PaymentMethodProvider` appears in the tree and its context starts with `{ bank: null, usdt: null, usdc: null, loaded: false }`, then transitions to `loaded: true` after the deferred fetch.

- [ ] **Step 4: Commit**

```bash
git add src/store/paymentMethods.jsx src/main.jsx
git commit -m "feat(payment): add PaymentMethodContext store with deferred prefetch on login"
```

---

### Task 3: Settings page — wire bank/crypto forms to the API

**Files:**
- Modify: `src/pages/Settings.jsx`
- Modify: `src/i18n/locales/en.json` (and all sibling locale files: ar, es, id, ja, ko, ms, vi, zh-TW)

**Interfaces:**
- Consumes: `usePaymentMethods()` from `src/store/paymentMethods.jsx` (Task 2)
- The form fields for `bank` kind change from: `fullName, bankAccount, bsb, payId, bankName`
  to: `accountName, bankName, accountNumber, bankBranch` (matching the backend API)
- The form fields for `blockchain` kind change from: a single address per wallet name (USDT-TRC20 / USDC-ERC20)
  to: two separate crypto slots — one for USDT (with `network` + `walletAddress`) and one for USDC (with `network` + `walletAddress`)

---

- [ ] **Step 1: Add i18n keys for the updated payment form fields**

In `src/i18n/locales/en.json`, update the `"settlement"` section to:

```json
"settlement": {
  "title": "Settlement",
  "bankTab": "Bank card binding",
  "chainTab": "Blockchain wallet",
  "pleaseEnter": "Please enter",
  "save": "Save",
  "saved": "Saved successfully",
  "bound": "Bound successfully",
  "withdrawCurrency": "Withdrawal currency",
  "fullName": "Full Name",
  "bankAccount": "Bank Account Number",
  "bsb": "Bank Swift Code",
  "payId": "Pay ID",
  "bankName": "Bank Name",
  "confirmBinding": "Confirm binding",
  "accountName": "Account Holder Name",
  "accountNumber": "Account / Card Number",
  "bankBranch": "Branch (optional)",
  "network": "Network (e.g. TRC-20, ERC-20)",
  "walletAddress": "Wallet Address",
  "saving": "Saving…",
  "usdtWallet": "USDT Wallet",
  "usdcWallet": "USDC Wallet"
}
```

Copy those same new keys (`accountName`, `accountNumber`, `bankBranch`, `network`, `walletAddress`, `saving`, `usdtWallet`, `usdcWallet`) to every other locale file (`ar.json`, `es.json`, `id.json`, `ja.json`, `ko.json`, `ms.json`, `vi.json`, `zh-TW.json`). You can use the English strings as placeholder values for locales you don't speak — they will be translated later.

- [ ] **Step 2: Rewrite Settings.jsx bank and blockchain form sections**

The top of the file changes as follows. Replace the existing `WALLETS`, `CURRENCIES`, `BANK_FIELDS` constants and the `chain`/`bank` state:

```jsx
// Remove these lines:
// const WALLETS = ['USDT-TRC20', 'USDC-ERC20']
// const CURRENCIES = ['USD', 'CAD']
// const BANK_FIELDS = ['fullName', 'bankAccount', 'bsb', 'payId', 'bankName']

// Remove these state lines:
// const [chain, setChain] = useState(() => loadJSON('cv_blockchain'))
// const [bank, setBank] = useState(() => loadJSON('cv_bank'))

// Remove these helpers:
// const setChainVal = ...
// const setBankVal = ...
// const bankCurrency = ...
```

Add the import and hook:

```jsx
import { usePaymentMethods } from '../store/paymentMethods.jsx'
```

Inside `Settings()`:

```jsx
const { bank, usdt, usdc, saveBankAccount, saveCryptoWallet } = usePaymentMethods()
const [saving, setSaving] = useState(false)

// Local form state — pre-populated from the store when the modal opens
const [bankForm, setBankForm] = useState({})
const [cryptoForms, setCryptoForms] = useState({ USDT: {}, USDC: {} })
```

Replace `openModal`:

```jsx
const openModal = (s) => {
  setVals({})
  setGaCode('')
  if (s.kind === 'bank') {
    setBankForm({
      accountName: bank?.accountName || '',
      bankName: bank?.bankName || '',
      accountNumber: bank?.accountNumber || '',
      bankBranch: bank?.bankBranch || '',
    })
  }
  if (s.kind === 'blockchain') {
    setCryptoForms({
      USDT: { network: usdt?.network || '', walletAddress: usdt?.walletAddress || '' },
      USDC: { network: usdc?.network || '', walletAddress: usdc?.walletAddress || '' },
    })
  }
  setActive(s)
}
```

Replace `onSaveChain` and `onBindBank`:

```jsx
const onSaveChain = async (currency) => {
  const form = cryptoForms[currency]
  if (!form.walletAddress) { message.error(t('settlement.pleaseEnter')); return }
  setSaving(true)
  try {
    await saveCryptoWallet({ currency, network: form.network, walletAddress: form.walletAddress })
    message.success(t('settlement.saved'))
  } catch (err) {
    message.error(err?.message || t('settlement.pleaseEnter'))
  } finally {
    setSaving(false)
  }
}

const onBindBank = async () => {
  if (!bankForm.accountName || !bankForm.bankName || !bankForm.accountNumber) {
    message.error(t('settlement.pleaseEnter'))
    return
  }
  setSaving(true)
  try {
    await saveBankAccount(bankForm)
    message.success(t('settlement.bound'))
    closeModal()
  } catch (err) {
    message.error(err?.message || t('settlement.pleaseEnter'))
  } finally {
    setSaving(false)
  }
}
```

Replace the JSX for `active.kind === 'blockchain'`:

```jsx
{active.kind === 'blockchain' && ['USDT', 'USDC'].map((cur) => (
  <div className="stm-wallet" key={cur}>
    <div className="stm-wlabel">{t(`settlement.${cur.toLowerCase()}Wallet`)}</div>
    <div>
      <label className="stm-flabel">{t('settlement.network')}</label>
      <input className="stm-finput" placeholder={t('settlement.pleaseEnter')}
        value={cryptoForms[cur].network}
        onChange={(e) => setCryptoForms((p) => ({ ...p, [cur]: { ...p[cur], network: e.target.value } }))} />
    </div>
    <div className="stm-row">
      <input className="stm-rowinput" placeholder={t('settlement.walletAddress')}
        value={cryptoForms[cur].walletAddress}
        onChange={(e) => setCryptoForms((p) => ({ ...p, [cur]: { ...p[cur], walletAddress: e.target.value } }))} />
      <button type="button" className="stm-save" disabled={saving} onClick={() => onSaveChain(cur)}>
        {saving ? t('settlement.saving') : t('settlement.save')}
      </button>
    </div>
  </div>
))}
```

Replace the JSX for `active.kind === 'bank'`:

```jsx
{active.kind === 'bank' && (
  <>
    {['accountName', 'bankName', 'accountNumber', 'bankBranch'].map((f) => (
      <div key={f}>
        <label className="stm-flabel">{t(`settlement.${f}`)}</label>
        <input className="stm-finput" placeholder={t('settlement.pleaseEnter')}
          value={bankForm[f] || ''}
          onChange={(e) => setBankForm((p) => ({ ...p, [f]: e.target.value }))} />
      </div>
    ))}
    <button type="button" className="stm-confirm" disabled={saving} onClick={onBindBank}>
      {saving ? t('settlement.saving') : t('settlement.confirmBinding')}
    </button>
  </>
)}
```

- [ ] **Step 3: Remove now-unused imports from Settings.jsx**

Remove `loadJSON`, `saveJSON` imports (if they are no longer used elsewhere in the file after the edit). Also remove any dangling references to `setChainVal`, `setBankVal`, `bankCurrency`.

- [ ] **Step 4: Run the dev server and test the Settings bank/crypto modals**

```bash
npm run dev
```

1. Open Settings → "Bind Bank" → fill in `accountName`, `bankName`, `accountNumber` → click "Confirm binding" → toast "Bound successfully" appears.
2. Open Settings → "Bind Blockchain Address" → fill in USDT network + address → click "Save" → toast "Saved successfully" appears.
3. Open Settings again → "Bind Bank" — the form pre-fills with the previously saved values.
4. Check browser console: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Settings.jsx src/i18n/locales/en.json src/i18n/locales/ar.json src/i18n/locales/es.json src/i18n/locales/id.json src/i18n/locales/ja.json src/i18n/locales/ko.json src/i18n/locales/ms.json src/i18n/locales/vi.json src/i18n/locales/zh-TW.json
git commit -m "feat(payment): wire Settings bank/crypto forms to backend API via PaymentMethodContext"
```

---

### Task 4: Withdrawal page — read bank/crypto from the store

**Files:**
- Modify: `src/pages/Withdrawal.jsx`

**Interfaces:**
- Consumes: `usePaymentMethods()` → `{ bank, usdt, usdc }` (Task 2)
- Removes: `loadJSON('cv_bank')` local-storage read
- The displayed bank card shows `bank.accountNumber` and `bank.accountName` (from store)
- The crypto wallet address shown/linked to settings is `usdt.walletAddress` (USDT-TRC20 method) or `usdc.walletAddress` (USDC-ERC20 method)

---

- [ ] **Step 1: Replace `loadJSON` with store in Withdrawal.jsx**

Add import:

```jsx
import { usePaymentMethods } from '../store/paymentMethods.jsx'
```

Remove the line:

```jsx
// REMOVE: const [bank] = useState(() => loadJSON('cv_bank'))
```

Add inside `Withdrawal()`:

```jsx
const { bank, usdt, usdc } = usePaymentMethods()
```

- [ ] **Step 2: Update bank card display in Withdrawal.jsx**

Find the bank card JSX block (currently shows `bank.bankAccount` and `bank.fullName`). Replace it:

```jsx
{isBank ? (
  <div className="wd-bankcard">
    <div className="wd-bc-field">
      <div className="wd-bc-label">{t('withdraw.bankCardNumber')}</div>
      <div className="wd-bc-value">{bank?.accountNumber || '—'}</div>
    </div>
    <div className="wd-bc-field">
      <div className="wd-bc-label">{t('withdraw.realName')}</div>
      <div className="wd-bc-value">{bank?.accountName || '—'}</div>
    </div>
    <svg className="wd-bc-chip" width="58" height="44" viewBox="0 0 58 44" aria-hidden="true">
      <rect x="1" y="1" width="56" height="42" rx="7" fill="#ededed" stroke="#cfcfcf" />
      <rect x="22" y="1" width="14" height="42" fill="#e3e3e3" />
      <rect x="1" y="16" width="56" height="12" fill="#e3e3e3" />
      <rect x="22" y="16" width="14" height="12" rx="2" fill="#f5f5f5" stroke="#cfcfcf" />
    </svg>
  </div>
) : (
  <div className="wd-card wd-bind">
    <button type="button" className="wd-bind-text" onClick={() => navigate('/settings')}>{t('withdraw.bindWallet')}</button>
    <button type="button" className="wd-unbind" onClick={() => navigate('/settings')}>{t('withdraw.unbind')} <RightOutlined /></button>
  </div>
)}
```

- [ ] **Step 3: Update the bank currency derivation**

The existing code derives the bank payout currency from `bank.currency` (a field that no longer exists on the server response — bank slots do not carry a currency discriminator in the new API; they always pay out in the member's configured currency). Replace this whole block:

```jsx
// REMOVE these lines:
// const bankCur = bank.currency || 'USD'
// const bankFiat = FIAT.find((f) => f.code === bankCur)
// const cur = isBank ? bankCur : method.cur
// const rate = isBank ? (bankFiat ? 1 / bankFiat.rate : 1) : method.rate
```

Replace with (hardcode USD as the bank payout currency, same as before but no longer read from localStorage):

```jsx
const bankCur = 'USD'
const bankFiat = FIAT.find((f) => f.code === bankCur)
const cur = isBank ? bankCur : method.cur
const rate = isBank ? (bankFiat ? 1 / bankFiat.rate : 1) : method.rate
```

- [ ] **Step 4: Update the crypto wallet address display**

In the existing Withdrawal.jsx the non-bank section just shows "Bind Account / Wallet" navigation links. Update it to also show the saved wallet address when one exists for the selected method:

Find the non-bank JSX section (currently `<div className="wd-card wd-bind">`). Replace:

```jsx
) : (
  <div className="wd-card wd-bind">
    {(() => {
      const walletEntry = methodKey === 'USDT-TRC20' ? usdt : methodKey === 'USDC-ERC20' ? usdc : null
      if (walletEntry?.walletAddress) {
        return (
          <div className="wd-bc-field">
            <div className="wd-bc-label">{methodKey}</div>
            <div className="wd-bc-value" style={{ wordBreak: 'break-all', fontSize: 12 }}>{walletEntry.walletAddress}</div>
          </div>
        )
      }
      return (
        <button type="button" className="wd-bind-text" onClick={() => navigate('/settings')}>{t('withdraw.bindWallet')}</button>
      )
    })()}
    <button type="button" className="wd-unbind" onClick={() => navigate('/settings')}>{t('withdraw.unbind')} <RightOutlined /></button>
  </div>
)}
```

- [ ] **Step 5: Remove `loadJSON` import from Withdrawal.jsx if no longer used**

Check whether `loadJSON` appears anywhere else in the file. If not, remove the import line:

```jsx
// REMOVE if unused: import { loadJSON } from '../utils/storage.js'
```

- [ ] **Step 6: Test withdrawal page in the browser**

1. Save a bank account in Settings.
2. Navigate to Withdrawal → select "Bank card withdrawal" → bank card section shows the saved `accountNumber` and `accountName`.
3. Select "USDT-TRC20" → wallet address appears (or the "Bind Wallet" prompt if none saved).
4. Navigate to Settings → Bind Blockchain → save a USDT address → go back to Withdrawal → address now visible.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Withdrawal.jsx
git commit -m "feat(payment): wire Withdrawal page to PaymentMethodContext (bank card + crypto address display)"
```

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|---|---|
| User can save bank details in Settings | Task 3 |
| User can save crypto details in Settings | Task 3 |
| Payment details fetched asynchronously on login | Task 2 |
| Settings forms pre-populate from saved data | Task 3 |
| Withdrawal shows bank details based on selected method | Task 4 |
| Withdrawal shows crypto address based on selected method | Task 4 |
| API calls routed through `client.js` | Task 1 |
| Mock mode still works standalone | Task 1 |
| i18n strings in all locales | Task 3 |

### Placeholder scan — none found.

### Type consistency check

- `bank`, `usdt`, `usdc` are typed `PaymentMethodRespVO | null` throughout all tasks.
- `saveBankAccount({ accountName, bankName, accountNumber, bankBranch })` matches backend `SaveBankAccountReqVO` fields exactly.
- `saveCryptoWallet({ currency, network, walletAddress })` matches backend `SaveCryptoWalletReqVO` fields exactly.
- `bank.accountNumber` / `bank.accountName` in Task 4 match the field names from `PaymentMethodRespVO`.
