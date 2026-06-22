import { useEffect, useState } from 'react'
import { HOME_ANNOUNCEMENT } from '../data/homeAnnouncement.js'
import { useAuth } from '../store/auth.jsx'

const KEY = 'cv_home_ann_seen'

// Reusable announcement popup: shows a title + multi-paragraph message once per session.
export default function HomeAnnouncement({ announcement = HOME_ANNOUNCEMENT }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const uid = user?.uid ?? user?.id ?? ''
  const fill = (s) => String(s).replace('{uid}', uid)

  useEffect(() => {
    if (!announcement) return
    let seen = false
    try { seen = sessionStorage.getItem(KEY) === '1' } catch { /* noop */ }
    if (!seen) setOpen(true)
  }, [announcement])

  const close = () => {
    try { sessionStorage.setItem(KEY, '1') } catch { /* noop */ }
    setOpen(false)
  }

  if (!open || !announcement) return null

  return (
    <div className="ann-overlay" role="dialog" aria-modal="true">
      <div className="ann-card">
        <h2 className="ann-title">{announcement.title}</h2>
        <div className="ann-body">
          {announcement.body.map((p, i) => <p className="ann-p" key={i}>{fill(p)}</p>)}
        </div>
        <button type="button" className="ann-ok" onClick={close}>OK</button>
      </div>
    </div>
  )
}
