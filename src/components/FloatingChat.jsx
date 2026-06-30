import { useEffect, useRef, useState } from 'react'
import { MessageFilled } from '@ant-design/icons'
import { useCustomerService } from '../store/customerService.jsx'

const SIZE = 54
const MARGIN = 14

// Global support chat bubble: floats over every page and can be dragged to either side.
export default function FloatingChat() {
  const { available, open } = useCustomerService()
  const [pos, setPos] = useState(null) // { x, y } top-left in px
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, dx: 0, dy: 0 })

  const clamp = ({ x, y }) => ({
    x: Math.min(Math.max(MARGIN, x), window.innerWidth - SIZE - MARGIN),
    y: Math.min(Math.max(MARGIN, y), window.innerHeight - SIZE - MARGIN),
  })

  useEffect(() => {
    setPos((p) => p || { x: window.innerWidth - SIZE - MARGIN, y: window.innerHeight - SIZE - 120 })
    const onResize = () => setPos((p) => (p ? clamp(p) : p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onPointerDown = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = { active: true, moved: false, sx: e.clientX, sy: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current.active) return
    if (Math.abs(e.clientX - drag.current.sx) + Math.abs(e.clientY - drag.current.sy) > 5) drag.current.moved = true
    setPos(clamp({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }))
  }
  const onPointerUp = () => {
    if (!drag.current.active) return
    const moved = drag.current.moved
    drag.current.active = false
    if (moved) {
      // snap to nearest left / right edge, keep vertical position
      setPos((p) => clamp({ x: (p.x + SIZE / 2 < window.innerWidth / 2) ? MARGIN : window.innerWidth - SIZE - MARGIN, y: p.y }))
    } else {
      open()
    }
  }

  if (!pos || !available) return null
  return (
    <button
      type="button"
      className="fab-chat"
      aria-label="Support chat"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <MessageFilled />
    </button>
  )
}
