import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './auth.jsx'

// In-memory cache of the logged-in member's videos (raw VideoRespVO[] from the backend).
// Fetched eagerly once the user is authenticated, then served from memory so navigating
// between Videos and ReviewContent does not refetch. Mutations (import) update the cache,
// so it never goes stale; refresh() forces a reload. Resets on logout / full page reload.
const VideosContext = createContext(null)

export function VideosProvider({ children }) {
  const { user } = useAuth()
  const [videos, setVideos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch the list (force=true bypasses the loaded guard for an explicit refresh).
  const load = useCallback(async (force = false) => {
    if (!user || (loaded && !force)) return
    setLoading(true)
    try {
      const page = await api.listVideos()
      setVideos(page?.items || [])
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
      setVideos([])
      setLoaded(false)
    }
  }, [user, load])

  // Prepend a newly created video (after import) so the UI updates without a refetch.
  const addVideo = useCallback((video) => {
    if (video) setVideos((prev) => [video, ...prev])
  }, [])

  // Force a fresh fetch (e.g. pull-to-refresh or after a server-side status change).
  const refresh = useCallback(() => load(true), [load])

  return (
    <VideosContext.Provider value={{ videos, loaded, loading, addVideo, refresh }}>
      {children}
    </VideosContext.Provider>
  )
}

export const useVideos = () => useContext(VideosContext)
