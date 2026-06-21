import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './auth.jsx'

// In-memory cache of the logged-in member's deploy history (raw DeployRespVO[] from the backend).
// Fetched eagerly once the user is authenticated, then served from memory so navigating
// to DeployHistory does not refetch. Mutations (create) update the cache,
// so it never goes stale; refresh() forces a reload. Resets on logout / full page reload.
const DeploysContext = createContext(null)

export function DeployHistoryProvider({ children }) {
  const { user } = useAuth()
  const [deploys, setDeploys] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch the list (force=true bypasses the loaded guard for an explicit refresh).
  const load = useCallback(async (force = false) => {
    if (!user || (loaded && !force)) return
    setLoading(true)
    try {
      const page = await api.listDeploys()
      setDeploys(page?.items || [])
      setLoaded(true)
    } catch {
      // Leave whatever we had; a later refresh can retry.
    } finally {
      setLoading(false)
    }
  }, [user, loaded])

  // Eager prefetch: as soon as the user is authenticated, warm the cache once.
  // Clear it on logout so the next user never sees stale data.
  useEffect(() => {
    if (user) {
      load()
    } else {
      setDeploys([])
      setLoaded(false)
    }
  }, [user, load])

  // Prepend a newly created deploy so the UI updates without a refetch.
  const addDeploy = useCallback((deploy) => {
    if (deploy) setDeploys((prev) => [deploy, ...prev])
  }, [])

  // Force a fresh fetch (e.g. pull-to-refresh or after a server-side status change).
  const refresh = useCallback(() => load(true), [load])

  return (
    <DeploysContext.Provider value={{ deploys, loaded, loading, addDeploy, refresh }}>
      {children}
    </DeploysContext.Provider>
  )
}

export const useDeploys = () => useContext(DeploysContext)
