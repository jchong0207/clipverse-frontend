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
