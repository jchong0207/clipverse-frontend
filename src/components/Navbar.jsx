import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { useAuth } from '../store/auth.jsx'
import LanguageMenu from './LanguageMenu.jsx'
import SideDrawer from './SideDrawer.jsx'

export default function Navbar() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <img className="brand-logo" src="/assets/img/clipverse-logo.png" alt="" /> Clip<span className="brand-accent">Verse</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/videos">{t('nav.video')}</NavLink>
          <NavLink to="/promotion">{t('nav.promotion')}</NavLink>
          <NavLink to="/account">{t('nav.myPage')}</NavLink>
        </nav>

        <div className="topbar-right">
          <LanguageMenu />
          {user && (
            <Button className="desktop-only" onClick={() => navigate('/account')}>{t('nav.myPage')}</Button>
          )}
          <Button type="text" icon={<MenuOutlined />} aria-label={t('menu.menu')} onClick={() => setDrawerOpen(true)} />
        </div>
      </div>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  )
}
