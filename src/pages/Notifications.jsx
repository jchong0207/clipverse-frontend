import { useState } from 'react'
import { Drawer } from 'antd'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useTranslation } from 'react-i18next'
import { RightOutlined } from '@ant-design/icons'
import { useNotifications } from '../store/notifications.jsx'

const TABS = ['all', 'system', 'task', 'transaction']
const CAT = { SYSTEM: 'system', TASK: 'task', TRANSACTION: 'transaction' }

// Format an ISO/LocalDateTime string as 'YYYY-MM-DD HH:mm' for the detail view.
const fmtTime = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '')

export default function Notifications() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const { notifications, markRead } = useNotifications()

  // Keep the full notification objects (so the detail drawer has content/createTime), plus a display category.
  const rows = notifications.map((n) => ({ ...n, category: CAT[n.type] || 'system' }))
  const items = tab === 'all' ? rows : rows.filter((n) => n.category === tab)

  // Open the detail drawer and mark the notification read (server + cache).
  const openDetail = (n) => {
    setSelected(n)
    if (!n.isRead) markRead(n.id)
  }

  return (
    <div className="nt">
      <SubPageHeader title={t('menu.notification')} />

      <nav className="dh-tabs">
        {TABS.map((k) => (
          <button key={k} className={`dh-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {t(`notify.${k}`)}
          </button>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="nt-empty">
          <svg className="nt-empty-img" viewBox="0 0 240 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M52 96 L82 58 H158 L188 96 Z" fill="#e3e5e9" />
            <path d="M48 92 H192 V162 a10 10 0 0 1 -10 10 H58 a10 10 0 0 1 -10 -10 Z" fill="#eceef2" />
            <path d="M48 92 L92 92 L106 110 H58 a10 10 0 0 0 -10 10 Z" fill="#e6e8ec" />
            <path d="M192 92 L148 92 L134 110 H182 a10 10 0 0 1 10 10 Z" fill="#e6e8ec" />
            <path d="M92 92 L106 110 H134 L148 92 Z" fill="#f6f7f9" />
            <rect x="80" y="126" width="62" height="9" rx="4.5" fill="#d9dbe0" />
            <rect x="80" y="144" width="42" height="9" rx="4.5" fill="#d9dbe0" />
            <circle cx="182" cy="150" r="24" fill="#f6c915" />
            <rect x="178.4" y="137" width="7.2" height="17" rx="3.6" fill="#fff" />
            <circle cx="182" cy="161.5" r="3.7" fill="#fff" />
          </svg>
          <p className="nt-empty-text">{t('notify.empty')}</p>
        </div>
      ) : (
        <ul className="nt-list">
          {items.map((n) => (
            <li className={`nt-item ${n.isRead ? '' : 'nt-unread'}`} key={n.id} onClick={() => openDetail(n)}>
              <div className="nt-main">
                <div className="nt-title">{n.title}</div>
                <span className={`nt-tag nt-tag-${n.category}`}>{t(`notify.${n.category}`)}</span>
              </div>
              <RightOutlined className="nt-chev" />
            </li>
          ))}
        </ul>
      )}

      <Drawer
        placement="bottom"
        height="auto"
        open={!!selected}
        onClose={() => setSelected(null)}
        title={null}
        className="nt-drawer"
      >
        {selected && (
          <div className="nt-detail">
            <span className={`nt-tag nt-tag-${selected.category}`}>{t(`notify.${selected.category}`)}</span>
            <h2 className="nt-detail-title">{selected.title}</h2>
            <div className="nt-detail-time">{fmtTime(selected.createTime)}</div>
            <p className="nt-detail-body">{selected.content || ''}</p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
