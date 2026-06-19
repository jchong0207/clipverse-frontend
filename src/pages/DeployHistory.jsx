import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App } from 'antd'
import {
  CopyOutlined, PlayCircleFilled, DollarCircleFilled, GlobalOutlined,
} from '@ant-design/icons'

// 👉 Platforms shown in the "intelligent match" row — real logos bundled in /public/assets/sources/.
const PLATFORMS = [
  'youtube', 'tiktok', 'instagram', 'x', 'facebook',
  'xiaohongshu', 'lemon8', 'douyin', 'kuaishou', 'roposo', 'moj',
].map((k) => ({ k, img: `/assets/sources/${k}.png` }))

// 👉 EDIT THIS: your deploy records. `status` is one of delivering | ended | rejected.
const RECORDS = [
  {
    id: '2050490262520713216',
    status: 'ended',
    title: '去了日本才知道🇯🇵動漫不是假的😲',
    thumb: 'linear-gradient(135deg, #c3d3e2 0%, #7e96ad 55%, #d9534f 130%)',
    views: '2,105,912',
    amount: '$4,211.68',
    language: 'Traditional Chinese',
    pkg: 'Professional Business (Exclusive Edition) China',
    remaining: 0,
  },
  {
    id: '2050490262520778765',
    status: 'delivering',
    title: '一個人去韓國旅行 vlog 🇰🇷 必去清單',
    thumb: 'linear-gradient(135deg, #ffd1dc 0%, #ff7eb3 60%, #845ec2 130%)',
    views: '843,221',
    amount: '$1,299.00',
    language: 'Korean',
    pkg: 'Intermediate Bundle (China) 2026',
    remaining: 2,
  },
  {
    id: '2050490262520790012',
    status: 'delivering',
    title: 'How I edit my travel clips in 5 minutes ✈️',
    thumb: 'linear-gradient(135deg, #a1c4fd 0%, #45aaf2 60%, #2d3436 130%)',
    views: '512,908',
    amount: '$499.00',
    language: 'English',
    pkg: 'Starter Pack V2 (India) 2026',
    remaining: 1,
  },
  {
    id: '2050490262520701338',
    status: 'rejected',
    title: '街頭美食大挑戰 🍜 一天吃十家',
    thumb: 'linear-gradient(135deg, #f6d365 0%, #fda085 60%, #b91c1c 130%)',
    views: '12,440',
    amount: '$299.00',
    language: 'Simplified Chinese',
    pkg: 'Starter Pack (China) 2026',
    remaining: 0,
  },
]

const TABS = ['all', 'delivering', 'ended', 'rejected']

export default function DeployHistory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [tab, setTab] = useState('all')

  const records = tab === 'all' ? RECORDS : RECORDS.filter((r) => r.status === tab)

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

      <div className="dh-list">
        {records.map((r) => (
          <article className="dh-card" key={r.id}>
            <div className="dh-card-head">
              <button className="dh-id" onClick={() => copyId(r.id)}>{r.id} <CopyOutlined /></button>
              <span className={`dh-status dh-status-${r.status}`}>{t(`deploy.status.${r.status}`)}</span>
            </div>

            <div className="dh-card-body">
              <div className="dh-thumb" style={{ background: r.thumb }} />
              <div className="dh-info">
                <div className="dh-title">{r.title}</div>
                <div className="dh-stats">
                  <span className="dh-stat"><PlayCircleFilled className="dh-ic-play" /> {r.views}</span>
                  <span className="dh-stat"><DollarCircleFilled className="dh-ic-coin" /> {r.amount}</span>
                  <span className="dh-stat"><GlobalOutlined className="dh-ic-globe" /> {r.language}</span>
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
