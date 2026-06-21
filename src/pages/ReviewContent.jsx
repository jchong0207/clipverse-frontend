import { useState } from 'react'
import { Empty } from 'antd'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GlobalOutlined } from '@ant-design/icons'
import { useVideos } from '../store/videos.jsx'

// Videos are only ever PENDING/PASSED/REJECTED; anything unexpected falls back to Under Review.
const STATUS_MAP = { PENDING: 'underReview', PASSED: 'passed', REJECTED: 'rejected' }

const TABS = ['all', 'underReview', 'passed', 'rejected']

export default function ReviewContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const { videos } = useVideos()

  // Derived from the shared in-memory cache (prefetched after login; no refetch on navigation).
  const records = videos.map((v) => ({
    id: v.id, status: STATUS_MAP[v.auditStatus] || 'underReview', title: v.title,
    date: v.createTime ? String(v.createTime).replace('T', ' ').slice(0, 19) : '',
    duration: `${String(Math.floor((v.durationSeconds || 0) / 60)).padStart(2, '0')}:${String((v.durationSeconds || 0) % 60).padStart(2, '0')}`,
    language: v.targetLanguage || v.sourceLanguage || '',
    thumb: v.coverUrl || 'linear-gradient(135deg, #c3d3e2 0%, #7e96ad 55%, #d9534f 130%)',
  }))

  const shown = tab === 'all' ? records : records.filter((r) => r.status === tab)

  return (
    <div className="dh">
      <SubPageHeader title={t('video.reviewContent')} />

      <nav className="dh-tabs">
        {TABS.map((k) => (
          <button key={k} className={`dh-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {t(`video.review.${k}`)}
          </button>
        ))}
      </nav>

      {shown.length === 0 && (
        <div className="rc-empty">
          <Empty description={<span className="muted">{t('video.noVideos')}</span>} />
        </div>
      )}

      <div className="rc-list">
        {shown.map((r) => (
          <article className="rc-card" key={r.id}>
            <div className="rc-head">
              <span className="rc-date">{r.date}</span>
              <span className={`rc-badge rc-badge-${r.status}`}>{t(`video.review.${r.status}`)}</span>
            </div>
            <div className="rc-body">
              <div className="rc-thumb" style={{ background: r.thumb }} />
              <div className="rc-info">
                <div className="rc-title">{r.title}</div>
                <div className="rc-meta">
                  <span className="rc-dur">{r.duration}</span>
                  <span className="rc-lang"><GlobalOutlined /> {r.language}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
