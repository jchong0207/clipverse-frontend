import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './auth.jsx'

// In-memory cache of the logged-in member's notifications. DEFERRED prefetch: unlike videos/deploys
// (which warm eagerly on login), this schedules its fetch on idle / after a short delay so it stays
// LOWER priority and never competes with the higher-priority video + deploy loads. Resets on logout.
const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (force = false) => {
    if (!user || (loaded && !force)) return
    setLoading(true)
    try {
      const page = await api.listNotifications()
      const items = page?.items || []
      setNotifications(items)
      setUnreadCount(items.filter((n) => !n.isRead).length)
      setLoaded(true)
    } catch {
      // leave as-is; a later refresh can retry
    } finally {
      setLoading(false)
    }
  }, [user, loaded])

  // Deferred prefetch: schedule on idle (fallback to a timeout) so it runs AFTER videos/deploys.
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoaded(false)
      return undefined
    }
    let handle
    const schedule = () => load()
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      handle = window.requestIdleCallback(schedule, { timeout: 3000 })
      return () => window.cancelIdleCallback?.(handle)
    }
    handle = setTimeout(schedule, 1200)
    return () => clearTimeout(handle)
  }, [user, load])

  const markRead = useCallback(async (id) => {
    // Skip if already read locally (avoids decrementing the unread count twice).
    let wasUnread = false
    setNotifications((prev) => prev.map((n) => {
      if (n.id === id && !n.isRead) { wasUnread = true; return { ...n, isRead: true } }
      return n
    }))
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
    try {
      // Treat HTTP success as success — the backend PATCH may return the row, true, or null.
      await api.markNotificationRead(id)
    } catch { /* server failed; the optimistic local read stays — a refresh would reconcile */ }
  }, [])

  const refresh = useCallback(() => load(true), [load])

  return (
    <NotificationContext.Provider
      value={{ notifications, loaded, loading, unreadCount, markRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
