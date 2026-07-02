import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth.jsx'
import { usePopups } from '../store/popups.jsx'
import HomeAnnouncement from './HomeAnnouncement.jsx'

// The home route ("/") is the only page announcements appear on.
const HOME_PATH = '/'

// App-shell popup driver. Mounted once (in App) but scoped to the home route: the pending queue is
// only refreshed, and the announcement only rendered, while the user is on "/". The server owns all
// frequency/version rules; we re-ask /pending when, while on home:
//   • the user logs in / out,
//   • the route becomes "/" (covers EVERY_HOME_VISIT and post-update re-display on each home visit),
//   • the tab regains focus (so an admin content edit appears without a manual reload).
export default function PopupHost() {
  const { user } = useAuth()
  const { refresh, clear } = usePopups()
  const { pathname } = useLocation()

  const onHome = pathname === HOME_PATH

  useEffect(() => {
    if (user && onHome) refresh()
    else clear()
  }, [user, onHome, refresh, clear])

  useEffect(() => {
    if (!user || !onHome) return undefined
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, onHome, refresh])

  if (!onHome) return null

  return <HomeAnnouncement />
}
