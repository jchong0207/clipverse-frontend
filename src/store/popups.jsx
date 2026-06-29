import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api/client.js'

const PopupContext = createContext(null)

export function PopupProvider({ children }) {
  const [queue, setQueue] = useState([])

  // Pull the pending popup queue from the server. The server owns all frequency/version rules;
  // PopupHost decides *when* to call this. Safe to call when logged out — a 401 is swallowed and
  // leaves the queue empty.
  const refresh = useCallback(async () => {
    try {
      const items = await api.popup.pending()
      setQueue(Array.isArray(items) ? items : [])
    } catch {
      // silent — a failed/unauthenticated fetch must never block the UI
    }
  }, [])

  // Drop any queued popups (e.g. on logout) so nothing leaks across sessions.
  const clear = useCallback(() => setQueue([]), [])

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
    <PopupContext.Provider value={{ current, refresh, clear, markSeen }}>
      {children}
    </PopupContext.Provider>
  )
}

export const usePopups = () => useContext(PopupContext)
