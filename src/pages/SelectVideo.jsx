import { useState } from 'react'
import { Empty } from 'antd'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  GlobalOutlined, CodeSandboxOutlined, CalendarOutlined,
  AppstoreOutlined, TeamOutlined, PlayCircleOutlined, LineChartOutlined, DatabaseOutlined,
} from '@ant-design/icons'
import { PROMOS } from '../data/promos.js'
import { useVideos } from '../store/videos.jsx'
import { useAuth } from '../store/auth.jsx'

const fmtDur = (secs) => {
  const s = Math.max(0, Math.round(secs || 0))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function SelectVideo() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const { videos: rawVideos } = useVideos()
  const pkg = PROMOS.find((p) => p.key === state?.pkgKey) || PROMOS[0]
  const [selected, setSelected] = useState(null)

  // The logged-in member's uploaded videos (from the shared cache; prefetched after login).
  const VIDEOS = rawVideos.map((v) => ({
    id: v.id, title: v.title, duration: fmtDur(v.durationSeconds),
    language: v.targetLanguage || v.sourceLanguage || '',
    thumb: v.coverUrl || 'linear-gradient(135deg, #c3d3e2 0%, #7e96ad 55%, #d9534f 130%)',
  }))

  const rows = [
    { icon: <CodeSandboxOutlined />, label: t('promotion.promotionPackage'), value: pkg.title },
    { icon: <CalendarOutlined />, label: t('promotion.rentalPeriod'), value: pkg.rentalDays },
    { icon: <AppstoreOutlined />, label: t('promotion.numberOfAccounts'), value: pkg.accounts },
    { icon: <TeamOutlined />, label: t('promotion.totalFollowers'), value: pkg.followers },
    { icon: <PlayCircleOutlined />, label: t('promotion.estimatedViews'), value: pkg.views },
    { icon: <LineChartOutlined />, label: t('promotion.estimatedRevenue'), value: pkg.revenue },
  ]

  return (
    <div className="sv">
      <SubPageHeader title={t('promotion.selectVideo')} />

      {VIDEOS.length === 0 ? (
        <Empty
          description={<span className="muted">{t('video.noVideos')}</span>}
          style={{ padding: '3rem 0' }}
        />
      ) : (
        <div className="sv-list">
          {VIDEOS.map((v) => (
            <button type="button" key={v.id} className={`sv-item ${selected === v.id ? 'selected' : ''}`} onClick={() => setSelected(v.id)}>
              <span className={`sv-radio ${selected === v.id ? 'on' : ''}`} />
              <div className="sv-thumb" style={{ background: v.thumb }} />
              <div className="sv-info">
                <div className="sv-title">{v.title}</div>
                <div className="sv-meta">
                  <span className="sv-dur">{v.duration}</span>
                  <span className="sv-lang"><GlobalOutlined /> {v.language}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="sv-pkg">
        {rows.map((r) => (
          <div className="sv-row" key={r.label}>
            <span className="sv-row-l">{r.icon} {r.label}</span>
            <span className="sv-row-v">{r.value}</span>
          </div>
        ))}
        <div className="sv-fee">
          <span>{t('promotion.rentFee')}</span>
          <span className="sv-fee-v">{pkg.price}</span>
        </div>
      </div>

      <div className="sv-balance"><DatabaseOutlined /> {t('promotion.balance')}: {
        Number(user?.walletBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      } USDT</div>

      {/* Greyed out until a video is selected; payment action is out of scope this phase. */}
      <button type="button" className="sv-pay" disabled={!selected}>{t('promotion.pay')}</button>
    </div>
  )
}
