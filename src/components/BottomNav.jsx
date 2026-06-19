import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SendOutlined } from '@ant-design/icons'

// Custom line icons for most tabs; Promotion uses the Ant Design loudspeaker.
const SVG = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9l5 3-5 3z" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8" /><path d="M8 13h8" /><path d="M8 17h5" />
    </svg>
  ),
  me: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
}

const TABS = [
  { to: '/', key: 'nav.home', icon: SVG.home, end: true },
  { to: '/videos', key: 'nav.video', icon: SVG.video },
  { to: '/promotion', key: 'nav.promotion', icon: <SendOutlined className="tab-icon" style={{ transform: 'rotate(-45deg)' }} /> },
  { to: '/account', key: 'nav.myPage', icon: SVG.me },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map(({ to, key, icon, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          {icon}
          <span>{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
