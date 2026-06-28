// Unified API client. If VITE_API_URL is set it talks to the Spring Boot backend;
// otherwise it falls back to the in-browser mock (mock.js) so the app runs
// standalone. Page components only import from here.

import { mockApi } from './mock.js'

// USE_REAL switches to the Spring Boot backend when VITE_API_URL is set. Requests stay
// RELATIVE (empty BASE) so in dev they hit the Vite origin and are proxied to the backend
// (see vite.config.js) — same-origin, no CORS. In production, serve the app behind a reverse
// proxy that forwards /app-api (and /api) to the backend, keeping requests same-origin there too.
const USE_REAL = Boolean(import.meta.env.VITE_API_URL)
const BASE = ''

const TOKEN_KEY = 'ct_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

async function http(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let payload = body
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload })
  const text = await res.text()
  let envelope = null
  try {
    envelope = text ? JSON.parse(text) : null
  } catch {
    envelope = null
  }
  if (!res.ok) {
    throw { status: res.status, message: envelope?.msg || res.statusText }
  }
  if (envelope && envelope.code !== 0) {
    throw { status: res.status, message: envelope.msg || 'Request failed' }
  }
  return envelope ? envelope.data : null
}

// Map the backend member shape -> the UI's user shape (nickname -> name).
const mapUser = (u) => ({
  id: u.id,
  uid: u.uid,
  name: u.nickname,
  email: u.email,
  creditBalance: u.creditBalance,
  walletBalance: u.walletBalance,
  kycStatus: u.kycStatus || 'unverified',
})

// ---- Real backend implementation ----
const realApi = {
  async register(b) {
    const r = await http('/app-api/member/auth/register', {
      method: 'POST',
      // code is sent but not yet verified server-side (real email OTP arrives in a later phase).
      body: { email: b.email, password: b.password, nickname: b.name, code: b.code },
    })
    // Token is stored by the outer api.register wrapper. The backend returns the profile inline
    // (r.user), so no second user/get call is needed.
    return { token: r.accessToken, user: mapUser(r.user) }
  },
  async login(b) {
    const r = await http('/app-api/member/auth/login', {
      method: 'POST',
      body: { email: b.email, password: b.password },
    })
    // Token is stored by the outer api.login wrapper. The backend returns the profile inline
    // (r.user), so no second user/get call is needed.
    return { token: r.accessToken, user: mapUser(r.user) }
  },
  async me() {
    const u = await http('/app-api/member/user/get')
    return mapUser(u)
  },
  logout: async () => ({}),
  submitKyc: (b) => http('/app-api/member/user/kyc', { method: 'POST', body: b }),
  listPackages: () => http('/api/packages'),
  getWallet: () => http('/api/wallet'),
  buyCredits: (b) => http('/api/wallet/buy', { method: 'POST', body: b }),
  requestRefund: (b) => http('/api/wallet/refund', { method: 'POST', body: b }),
  // Upload a deposit proof image (crypto). Multipart via the http() isForm path; returns { url }.
  async uploadDepositProof(file) {
    const form = new FormData()
    form.append('file', file)
    return http('/app-api/wallet/deposit-proof', { method: 'POST', body: form, isForm: true })
  },
  // Place a deposit order. paymentMetadata is a JSON string (method/coin/address/proofUrl).
  placeDeposit: (b) => http('/app-api/wallet/order/deposit', { method: 'POST', body: b }),
  // Place a withdrawal order. payoutDestination is a compact JSON string (address/account + method).
  placeWithdraw: (b) => http('/app-api/wallet/order/withdraw', { method: 'POST', body: b }),
  createQuote: (b) => http('/api/quotes', { method: 'POST', body: b }),
  listQuotes: () => http('/api/quotes'),
  getQuote: (id) => http(`/api/quotes/${id}`),
  createOrder: (b) => http('/api/orders', { method: 'POST', body: b }),
  listOrders: () => http('/api/orders'),
  getOrder: (id) => http(`/api/orders/${id}`),
  payOrder: (id) => http(`/api/orders/${id}/pay`, { method: 'POST' }),
  cancelOrder: (id) => http(`/api/orders/${id}/cancel`, { method: 'POST' }),
  async listVideos(status) {
    const q = status ? `?status=${encodeURIComponent(status)}&pageSize=100` : '?pageSize=100'
    return http(`/app-api/member/video/page${q}`)
  },
  async createVideo(body) {
    return http('/app-api/member/video/create', { method: 'POST', body })
  },
  async listDeploys(status) {
    const q = status ? `?status=${encodeURIComponent(status)}&pageSize=100` : '?pageSize=100'
    return http(`/app-api/member/deploy/page${q}`)
  },
  async createDeploy(body) {
    return http('/app-api/member/deploy/create', { method: 'POST', body })
  },
  async listNotifications(type) {
    const q = type ? `?type=${encodeURIComponent(type)}&pageSize=100` : '?pageSize=100'
    return http(`/app-api/member/notification/page${q}`)
  },
  async notificationUnread() {
    return http('/app-api/member/notification/unread-count')
  },
  async markNotificationRead(id) {
    return http('/app-api/member/notification/read', { method: 'PATCH', body: { id } })
  },
  async listTransactions(type) {
    const q = type ? `?type=${encodeURIComponent(type)}&pageSize=100` : '?pageSize=100'
    return http(`/app-api/member/transaction/page${q}`)
  },
  async listRevenue() {
    return http('/app-api/member/revenue/page?pageSize=100')
  },
  async listPaymentMethods() {
    return http('/app-api/member/payment/list')
  },
  async saveBankAccount(body) {
    return http('/app-api/member/payment/bank/save', { method: 'POST', body })
  },
  async saveCryptoWallet(body) {
    return http('/app-api/member/payment/crypto/save', { method: 'POST', body })
  },
}

const impl = USE_REAL ? realApi : mockApi

// Wrap auth calls so tokens are stored consistently in both modes.
export const api = {
  ...impl,
  async register(b) {
    const r = await impl.register(b)
    if (r?.token) setToken(r.token)
    return r
  },
  async login(b) {
    const r = await impl.login(b)
    if (r?.token) setToken(r.token)
    return r
  },
  async logout() {
    await impl.logout()
    setToken(null)
  },
}

export { LANGUAGES, PACKAGES } from './mock.js'
