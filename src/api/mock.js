// Local, in-browser mock backend. Persists to localStorage so the app is fully
// usable without the Spring Boot server. Mirrors the shape of the real API so
// swapping to the backend (see client.js) requires no page changes.
//
// Credit model: customers buy credits, translation jobs deduct credits based on
// video length x language factor x package rate, and unused credits can be
// refunded back to the original payment method.

const LS = {
  users: 'ct_users',
  session: 'ct_session',
  quotes: 'ct_quotes',
  orders: 'ct_orders',
  txns: 'ct_txns',
}

const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid = () => Math.random().toString(36).slice(2, 10)
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))
const round2 = (n) => Math.round(n * 100) / 100

export const PACKAGES = [
  {
    id: 'subtitle',
    name: 'Subtitles',
    tagline: 'Accurate translated captions',
    pricePerMinute: 3.5,
    features: ['Translated .srt subtitle file', '1 target language', '48h turnaround', 'Human review'],
  },
  {
    id: 'voiceover',
    name: 'Voice-over',
    tagline: 'Natural narrated translation',
    pricePerMinute: 9,
    features: ['Professional voice-over track', '1 target language', '72h turnaround', 'Subtitles included'],
    popular: true,
  },
  {
    id: 'dubbing',
    name: 'Full Dubbing',
    tagline: 'Lip-synced studio dubbing',
    pricePerMinute: 18,
    features: ['Lip-synced dubbing', 'Up to 3 target languages', '5-day turnaround', 'Studio mixing + subtitles'],
  },
]

// Per-target-language pricing factor (some languages cost more to produce).
export const LANGUAGES = [
  { name: 'English', factor: 1.0 },
  { name: 'Spanish', factor: 1.0 },
  { name: 'French', factor: 1.1 },
  { name: 'German', factor: 1.1 },
  { name: 'Portuguese', factor: 1.0 },
  { name: 'Italian', factor: 1.1 },
  { name: 'Arabic', factor: 1.3 },
  { name: 'Chinese (Mandarin)', factor: 1.3 },
  { name: 'Japanese', factor: 1.4 },
  { name: 'Korean', factor: 1.4 },
  { name: 'Hindi', factor: 1.2 },
  { name: 'Russian', factor: 1.2 },
]

const languageFactor = (name) => LANGUAGES.find((l) => l.name === name)?.factor ?? 1.0

// Cost in credits for a package, given duration and target language.
function priceFor(pkgId, durationSeconds, targetLanguage) {
  const pkg = PACKAGES.find((p) => p.id === pkgId)
  if (!pkg) return 0
  const minutes = Math.max(1, Math.ceil(durationSeconds / 60))
  return round2(minutes * pkg.pricePerMinute * languageFactor(targetLanguage))
}

function currentUser() {
  const session = read(LS.session, null)
  if (!session) return null
  const users = read(LS.users, [])
  return users.find((u) => u.id === session.userId) || null
}

function requireUser() {
  const u = currentUser()
  if (!u) throw { status: 401, message: 'Not authenticated' }
  return u
}

function saveUser(updated) {
  const users = read(LS.users, [])
  const idx = users.findIndex((u) => u.id === updated.id)
  if (idx >= 0) { users[idx] = updated; write(LS.users, users) }
}

function addTxn(userId, txn) {
  const txns = read(LS.txns, [])
  txns.unshift({ id: uid(), userId, createdAt: new Date().toISOString(), ...txn })
  write(LS.txns, txns)
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, creditBalance: round2(u.creditBalance || 0), kycStatus: u.kycStatus || 'unverified' })

// Always-available demo account so login works out of the box.
// Credentials: demo@clipverse.com / Demo1234
const DEMO_USER = { id: 'demo-user', name: 'Demo User', email: 'demo@clipverse.com', password: 'Demo1234', creditBalance: 1000 }
function seedDemoUser() {
  const users = read(LS.users, [])
  if (!users.some((u) => u.email.toLowerCase() === DEMO_USER.email)) {
    users.push({ ...DEMO_USER })
    write(LS.users, users)
  }
}
seedDemoUser()

export const mockApi = {
  async register({ name, email, password }) {
    await delay()
    const users = read(LS.users, [])
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw { status: 409, message: 'An account with that email already exists' }
    }
    const user = { id: uid(), name, email, password, creditBalance: 0 }
    users.push(user)
    write(LS.users, users)
    write(LS.session, { userId: user.id, token: 'mock-' + uid() })
    return { token: 'mock', user: publicUser(user) }
  },

  async login({ email, password }) {
    await delay()
    const users = read(LS.users, [])
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user || user.password !== password) {
      throw { status: 401, message: 'Invalid email or password' }
    }
    write(LS.session, { userId: user.id, token: 'mock-' + uid() })
    return { token: 'mock', user: publicUser(user) }
  },

  async me() {
    await delay(120)
    const u = currentUser()
    if (!u) throw { status: 401, message: 'Not authenticated' }
    return publicUser(u)
  },

  async logout() {
    localStorage.removeItem(LS.session)
    return {}
  },

  // ---- KYC / real-name verification ----
  // Submits identity info for review. We don't persist the uploaded images in the
  // mock — just flip the user's status to 'pending' so the review flow is visible.
  async submitKyc(payload = {}) {
    await delay()
    const user = requireUser()
    user.kycStatus = 'pending'
    user.kyc = { country: payload.country, docType: payload.docType, submittedAt: new Date().toISOString() }
    saveUser(user)
    return publicUser(user)
  },

  async listPackages() {
    await delay(120)
    return PACKAGES
  },

  // ---- Wallet / credits ----
  async getWallet() {
    const user = requireUser()
    await delay(120)
    return {
      balance: round2(user.creditBalance || 0),
      transactions: read(LS.txns, []).filter((t) => t.userId === user.id),
    }
  },

  // Buy credits. In the real backend this is a payment-gateway charge (Stripe etc.).
  async buyCredits({ amount }) {
    const user = requireUser()
    const credits = Number(amount)
    if (!credits || credits <= 0) throw { status: 400, message: 'Enter an amount greater than 0' }
    await delay(600)
    user.creditBalance = round2((user.creditBalance || 0) + credits)
    saveUser(user)
    addTxn(user.id, { type: 'PURCHASE', amount: credits, status: 'COMPLETED', description: `Purchased ${credits} credits` })
    return { balance: user.creditBalance }
  },

  // Refund of UNUSED credits only, back to the original payment method.
  async requestRefund({ amount }) {
    const user = requireUser()
    const credits = Number(amount)
    if (!credits || credits <= 0) throw { status: 400, message: 'Enter an amount greater than 0' }
    if (credits > (user.creditBalance || 0)) {
      throw { status: 400, message: 'You can only refund unused credits you currently hold' }
    }
    await delay(600)
    user.creditBalance = round2((user.creditBalance || 0) - credits)
    saveUser(user)
    addTxn(user.id, { type: 'REFUND', amount: -credits, status: 'PENDING', description: `Refund of ${credits} unused credits` })
    return { balance: user.creditBalance }
  },

  // ---- Quotes ----
  async createQuote({ filename, durationSeconds, sourceLanguage, targetLanguage }) {
    const user = requireUser()
    await delay()
    const quotes = read(LS.quotes, [])
    const estimates = PACKAGES.map((p) => ({ packageId: p.id, price: priceFor(p.id, durationSeconds, targetLanguage) }))
    const quote = {
      id: uid(),
      userId: user.id,
      filename,
      durationSeconds,
      sourceLanguage,
      targetLanguage,
      estimates,
      createdAt: new Date().toISOString(),
    }
    quotes.unshift(quote)
    write(LS.quotes, quotes)
    return quote
  },

  async listQuotes() {
    const user = requireUser()
    await delay(120)
    return read(LS.quotes, []).filter((q) => q.userId === user.id)
  },

  async getQuote(id) {
    const user = requireUser()
    const q = read(LS.quotes, []).find((x) => x.id === id && x.userId === user.id)
    if (!q) throw { status: 404, message: 'Quote not found' }
    return q
  },

  // ---- Orders ----
  async createOrder({ quoteId, packageId }) {
    const user = requireUser()
    await delay()
    const quote = read(LS.quotes, []).find((q) => q.id === quoteId && q.userId === user.id)
    if (!quote) throw { status: 404, message: 'Quote not found' }
    const pkg = PACKAGES.find((p) => p.id === packageId)
    if (!pkg) throw { status: 400, message: 'Unknown package' }
    const orders = read(LS.orders, [])
    const order = {
      id: uid(),
      userId: user.id,
      quoteId,
      packageId,
      packageName: pkg.name,
      filename: quote.filename,
      sourceLanguage: quote.sourceLanguage,
      targetLanguage: quote.targetLanguage,
      durationSeconds: quote.durationSeconds,
      amount: priceFor(packageId, quote.durationSeconds, quote.targetLanguage),
      currency: 'credits',
      status: 'UNPAID',
      jobStatus: 'AWAITING_PAYMENT',
      createdAt: new Date().toISOString(),
    }
    orders.unshift(order)
    write(LS.orders, orders)
    return order
  },

  async listOrders() {
    const user = requireUser()
    await delay(120)
    return read(LS.orders, []).filter((o) => o.userId === user.id)
  },

  async getOrder(id) {
    const user = requireUser()
    const o = read(LS.orders, []).find((x) => x.id === id && x.userId === user.id)
    if (!o) throw { status: 404, message: 'Order not found' }
    return o
  },

  // Pay an order by deducting credits from the balance.
  async payOrder(id) {
    const user = requireUser()
    await delay(500)
    const orders = read(LS.orders, [])
    const o = orders.find((x) => x.id === id && x.userId === user.id)
    if (!o) throw { status: 404, message: 'Order not found' }
    if (o.status === 'PAID') return o
    if ((user.creditBalance || 0) < o.amount) {
      throw { status: 402, message: `Not enough credits. You need ${round2(o.amount - (user.creditBalance || 0))} more.` }
    }
    user.creditBalance = round2((user.creditBalance || 0) - o.amount)
    saveUser(user)
    addTxn(user.id, { type: 'SPEND', amount: -o.amount, status: 'COMPLETED', description: `${o.packageName} — ${o.filename}` })
    o.status = 'PAID'
    o.jobStatus = 'IN_PRODUCTION'
    o.paidAt = new Date().toISOString()
    write(LS.orders, orders)
    return o
  },

  async cancelOrder(id) {
    const user = requireUser()
    await delay()
    const orders = read(LS.orders, [])
    const o = orders.find((x) => x.id === id && x.userId === user.id)
    if (!o) throw { status: 404, message: 'Order not found' }
    if (o.status === 'PAID') throw { status: 400, message: 'Paid orders cannot be cancelled here' }
    o.status = 'CANCELLED'
    o.jobStatus = 'CANCELLED'
    write(LS.orders, orders)
    return o
  },

  async listVideos() {
    await delay(120)
    return { items: read('ct_videos', []), total: read('ct_videos', []).length, pageNo: 1, pageSize: 100 }
  },
  async createVideo(b) {
    await delay()
    const videos = read('ct_videos', [])
    const v = { id: uid(), title: b.title, durationSeconds: b.durationSeconds || 0,
      sourceLanguage: b.sourceLanguage, targetLanguage: b.targetLanguage, coverUrl: b.coverUrl,
      sourcePlatform: b.sourcePlatform, auditStatus: 'PENDING', createTime: new Date().toISOString() }
    videos.unshift(v); write('ct_videos', videos); return v
  },
}
