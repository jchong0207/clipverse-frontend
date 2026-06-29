import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth.jsx'
import { usePopups } from '../store/popups.jsx'
import HomeAnnouncement from './HomeAnnouncement.jsx'

// App-shell popup driver. Mounted once (in App) so announcements can appear on ANY page — not only
// the "/" landing route — and so the pending queue is refreshed at every moment a popup could newly
// apply. The server owns all frequency/version rules; we just re-ask /pending when:
//   • the user logs in / out,
//   • the route changes (covers EVERY_HOME_VISIT and post-update re-display as the user navigates),
//   • the tab regains focus (so an admin content edit appears without a manual reload/navigation).
export default function PopupHost() {
  const { user } = useAuth()
  const { refresh, clear } = usePopups()
  const { pathname } = useLocation()

  useEffect(() => {
    if (user) refresh()
    else clear()
  }, [user, pathname, refresh, clear])

  useEffect(() => {
    if (!user) return undefined
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, refresh])

  return <HomeAnnouncement />
}
