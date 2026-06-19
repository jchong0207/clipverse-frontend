// Unified API client. If VITE_API_URL is set it talks to the Spring Boot backend;
// otherwise it falls back to the in-browser mock (mock.js) so the app runs
// standalone. Page components only import from here.

import { mockApi } from './mock.js'

const BASE = import.meta.env.VITE_API_URL || ''
const USE_REAL = Boolean(BASE)

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
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw { status: res.status, message: data?.message || res.statusText }
  }
  return data
}

// ---- Real backend implementation ----
const realApi = {
  register: (b) => http('/api/auth/register', { method: 'POST', body: b }),
  login: (b) => http('/api/auth/login', { method: 'POST', body: b }),
  me: () => http('/api/auth/me'),
  logout: async () => ({}),
  listPackages: () => http('/api/packages'),
  getWallet: () => http('/api/wallet'),
  buyCredits: (b) => http('/api/wallet/buy', { method: 'POST', body: b }),
  requestRefund: (b) => http('/api/wallet/refund', { method: 'POST', body: b }),
  createQuote: (b) => http('/api/quotes', { method: 'POST', body: b }),
  listQuotes: () => http('/api/quotes'),
  getQuote: (id) => http(`/api/quotes/${id}`),
  createOrder: (b) => http('/api/orders', { method: 'POST', body: b }),
  listOrders: () => http('/api/orders'),
  getOrder: (id) => http(`/api/orders/${id}`),
  payOrder: (id) => http(`/api/orders/${id}/pay`, { method: 'POST' }),
  cancelOrder: (id) => http(`/api/orders/${id}/cancel`, { method: 'POST' }),
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
