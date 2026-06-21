import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App, Empty } from 'antd'
import {
  CopyOutlined, PlayCircleFilled, DollarCircleFilled, GlobalOutlined,
} from '@ant-design/icons'
import { useDeploys } from '../store/deploys.jsx'

// Platforms shown in the "intelligent match" row — real logos bundled in /public/assets/sources/.
const PLATFORMS = [
  'youtube', 'tiktok', 'instagram', 'x', 'facebook',
  'xiaohongshu', 'lemon8', 'douyin', 'kuaishou', 'roposo', 'moj',
].map((k) => ({ k, img: `/assets/sources/${k}.png` }))

// Map backend status (UPPER) to display key (lower).
const STATUS_MAP = { DELIVERING: 'delivering', ENDED: 'ended', REJECTED: 'rejected' }

const TABS = ['all', 'delivering', 'ended', 'rejected']

// Format a raw integer view count with thousands separators.
function fmtViews(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString('en-US')
}

// Format earning amount as $#,###.##
function fmtAmount(n) {
  if (n == null) return '$0.00'
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DeployHistory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [tab, setTab] = useState('all')
  const { deploys } = useDeploys()

  // Derive display rows from the cached raw DeployRespVO[].
  const rows = deploys.map((d) => ({
    id: String(d.id),
    status: STATUS_MAP[d.status] || 'delivering',
    title: d.title,
    coverUrl: d.coverUrl || null,
    views: fmtViews(d.viewCount),
    amount: fmtAmount(d.earningAmount),
    language: d.language || '',
    pkg: d.packageName || '',
    remaining: d.remainingDays != null ? d.remainingDays : 0,
  }))

  const records = tab === 'all' ? rows : rows.filter((r) => r.status === tab)

  const copyId = async (id) => {
    try { await navigator.clipboard.writeText(id); message.success(t('deploy.copied')) } catch { /* noop */ }
  }

  return (
    <div className="dh">
      <SubPageHeader title={t('menu.deployHistory')} />

      <nav className="dh-tabs">
        {TABS.map((k) => (
          <button key={k} className={`dh-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {t(`deploy.tabs.${k}`)}
          </button>
        ))}
      </nav>

      <section className="dh-match">
        <p className="dh-match-text">{t('deploy.matchHint')}</p>
        <div className="dh-platforms">
          {PLATFORMS.map((p) => (
            <span key={p.k} className="dh-plat"><img src={p.img} alt={p.k} loading="lazy" /></span>
          ))}
        </div>
      </section>

      {records.length === 0 && (
        <Empty
          description={<span className="muted">{t('deploy.noDeploys')}</span>}
          style={{ padding: '3rem 0' }}
        />
      )}

      <div className="dh-list">
        {records.map((r) => (
          <article className="dh-card" key={r.id}>
            <div className="dh-card-head">
              <button className="dh-id" onClick={() => copyId(r.id)}>{r.id} <CopyOutlined /></button>
              <span className={`dh-status dh-status-${r.status}`}>{t(`deploy.status.${r.status}`)}</span>
            </div>

            <div className="dh-card-body">
              {r.coverUrl
                ? <img className="dh-thumb" src={r.coverUrl} alt={r.title} />
                : <div className="dh-thumb dh-thumb-placeholder" />}
              <div className="dh-info">
                <div className="dh-title">{r.title}</div>
                <div className="dh-stats">
                  <span className="dh-stat"><PlayCircleFilled className="dh-ic-play" /> {r.views}</span>
                  <span className="dh-stat"><DollarCircleFilled className="dh-ic-coin" /> {r.amount}</span>
                  <span className="dh-stat dh-stat-lang"><GlobalOutlined className="dh-ic-globe" /> {r.language}</span>
                </div>
              </div>
            </div>

            <div className="dh-meta">
              <div className="dh-meta-row"><span>{t('deploy.accountPackage')}</span><span>{r.pkg}</span></div>
              <div className="dh-meta-row"><span>{t('deploy.remainingDays')}</span><span>{r.remaining}</span></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
