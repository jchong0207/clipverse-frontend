// Shared helpers for displaying the current user across the Account page and side drawer.

// Mask an identifier (phone/email/name) the way the design shows: 209****4552
export function maskId(user) {
  const v = user && (user.phone || user.email || user.name)
  if (!v) return '209****4552'
  if (v.includes('@')) { const [n, d] = v.split('@'); return `${n.slice(0, 2)}***@${d}` }
  const s = String(v)
  return s.length > 7 ? `${s.slice(0, 3)}****${s.slice(-4)}` : s
}

// Format a wallet balance (number or numeric string) with thousands separators and 2 decimals.
// Falls back to the demo placeholder when no balance is available (standalone mock mode).
export function formatBalance(value) {
  if (value === null || value === undefined || value === '') return '115,486.71'
  const n = Number(value)
  if (Number.isNaN(n)) return '115,486.71'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
