import { useState } from 'react'
import { usePopups } from '../store/popups.jsx'

export default function HomeAnnouncement() {
  const { current, markSeen } = usePopups()
  const [busy, setBusy] = useState(false)

  if (!current) return null

  const handleOk = async () => {
    setBusy(true)
    await markSeen(current.id)
    setBusy(false)
  }

  return (
    <div className="ann-overlay" role="dialog" aria-modal="true">
      <div className="ann-card">
        <h2 className="ann-title">{current.title}</h2>
        <div className="ann-body">
          <p className="ann-p">{current.content}</p>
        </div>
        <button type="button" className="ann-ok" onClick={handleOk} disabled={busy}>
          OK
        </button>
      </div>
    </div>
  )
}
