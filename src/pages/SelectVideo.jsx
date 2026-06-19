import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  GlobalOutlined, CodeSandboxOutlined, CalendarOutlined,
  AppstoreOutlined, TeamOutlined, PlayCircleOutlined, LineChartOutlined, DatabaseOutlined,
} from '@ant-design/icons'
import { PROMOS } from '../data/promos.js'

// 👉 EDIT THIS: the user's uploaded videos to choose from.
const VIDEOS = [
  { id: 'v1', title: '去了日本才知道🇯🇵動漫不是假的😲', duration: '00:44', language: 'Traditional Chinese', thumb: 'linear-gradient(135deg, #c3d3e2 0%, #7e96ad 55%, #d9534f 130%)' },
  { id: 'v2', title: '🇰🇷그가 너를 차갑게 만들었다면, 차라리 한국에 와라', duration: '00:23', language: 'Korean', thumb: 'linear-gradient(135deg, #f6d365 0%, #3aa0a0 60%, #2d3436 130%)' },
  { id: 'v3', title: '泰國🇹🇭美女 會不會讓你心動💗', duration: '00:20', language: 'Thai', thumb: 'linear-gradient(135deg, #fda085 0%, #f6d365 60%, #b91c1c 130%)' },
]

export default function SelectVideo() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const pkg = PROMOS.find((p) => p.key === state?.pkgKey) || PROMOS[0]
  const [selected, setSelected] = useState(null)

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

      <div className="sv-balance"><DatabaseOutlined /> {t('promotion.balance')}: 115,486.71 USDT</div>

      {/* Greyed out until a video is selected; payment action is out of scope this phase. */}
      <button type="button" className="sv-pay" disabled={!selected}>{t('promotion.pay')}</button>
    </div>
  )
}
