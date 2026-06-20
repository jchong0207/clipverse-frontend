import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Drawer, Dropdown, App } from 'antd'
import { CloseOutlined, LogoutOutlined, LoginOutlined, RightOutlined } from '@ant-design/icons'
import { useAuth } from '../store/auth.jsx'
import { LANGUAGES } from '../i18n/index.js'
import { maskId } from '../utils/user.js'

export default function SideDrawer({ open, onClose }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { modal } = App.useApp()
  const navigate = useNavigate()

  const idText = maskId(user)
  const credit = user?.creditBalance ?? 51
  const uid = user?.uid ?? user?.id ?? '0470508'
  const langLabel = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage)?.label || 'English'

  const onLogin = () => { onClose(); navigate('/login', { state: { from: '/' } }) }
  const onLogout = () => {
    modal.confirm({
      title: t('auth.confirmLogout'),
      okText: t('auth.yesLogout'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => { try { await logout() } catch { /* noop */ } finally { onClose() } },
    })
  }

  return (
    <Drawer placement="right" open={open} onClose={onClose} width={340} closable={false} title={null}
      styles={{ body: { padding: 0 } }}>
      <div className="sd">
        <div className="sd-head">
          <span className="sd-welcome">{t('menu.welcome')} <span className="sd-brand">ClipVerse</span></span>
          <button className="sd-close" onClick={onClose} aria-label={t('menu.menu')}><CloseOutlined /></button>
        </div>

        {user && (
          <div className="sd-profile">
            <img className="sd-avatar" src="/assets/img/clipverse-logo.png" alt="" />
            <div className="sd-profile-info">
              <div className="sd-id">{idText}</div>
              <span className="sd-credit">{t('menu.credit')} {credit}</span>
              <div className="sd-uid">{t('menu.uid')}: {uid}</div>
            </div>
          </div>
        )}

        <div className="sd-card">
          <Dropdown
            trigger={['click']}
            menu={{
              items: LANGUAGES.map((l) => ({ key: l.code, label: l.label })),
              selectable: true,
              selectedKeys: [i18n.resolvedLanguage],
              onClick: ({ key }) => i18n.changeLanguage(key),
            }}
          >
            <button type="button" className="sd-row">
              <span>{t('common.language')}</span>
              <span className="sd-row-val">{langLabel} <RightOutlined /></span>
            </button>
          </Dropdown>
          <Link to="/announcement" className="sd-row" onClick={onClose}><span>{t('menu.announcement')}</span></Link>
          <Link to="/notifications" className="sd-row" onClick={onClose}><span>{t('menu.notification')}</span></Link>
          <Link to="/about" className="sd-row" onClick={onClose}><span>{t('menu.aboutUs')}</span></Link>
        </div>

        <div className="sd-label">{t('menu.video')}</div>
        <div className="sd-card">
          <Link to="/videos" state={{ openImport: true }} className="sd-row" onClick={onClose}><span>{t('menu.importVideo')}</span></Link>
          <Link to="/videos" className="sd-row" onClick={onClose}><span>{t('menu.videoManagement')}</span></Link>
          <Link to="/deploy-history" className="sd-row" onClick={onClose}><span>{t('menu.deployHistory')}</span></Link>
        </div>

        {user ? (
          <button type="button" className="sd-logout" onClick={onLogout}>
            <LogoutOutlined /> {t('auth.logout')}
          </button>
        ) : (
          <button type="button" className="sd-login" onClick={onLogin}>
            <LoginOutlined /> {t('auth.login')}
          </button>
        )}
      </div>
    </Drawer>
  )
}
