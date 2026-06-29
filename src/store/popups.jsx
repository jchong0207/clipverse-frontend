import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api/client.js'

const PopupContext = createContext(null)

export function PopupProvider({ children }) {
  const [queue, setQueue] = useState([])

  const fetchOnLogin = useCallback(async () => {
    try {
      const items = await api.popup.pending()
      setQueue(Array.isArray(items) ? items : [])
    } catch {
      // silent — a failed fetch must never block the login flow
    }
  }, [])

  const fetchOnHomeVisit = useCallback(async () => {
    try {
      const items = await api.popup.pending()
      setQueue(Array.isArray(items) ? items : [])
    } catch {
      // silent
    }
  }, [])

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
    <PopupContext.Provider value={{ current, fetchOnLogin, fetchOnHomeVisit, markSeen }}>
      {children}
    </PopupContext.Provider>
  )
}

export const usePopups = () => useContext(PopupContext)
