import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GlobalOutlined } from '@ant-design/icons'

// 👉 EDIT THIS: review records. `status` is one of underReview | passed | rejected.
const RECORDS = [
  { id: 'rc1', date: '02/05/2026 15:55:34', status: 'passed', title: '去了日本才知道🇯🇵動漫不是假的😲', duration: '00:44', language: 'Traditional Chinese', thumb: 'linear-gradient(135deg, #c3d3e2 0%, #7e96ad 55%, #d9534f 130%)' },
  { id: 'rc2', date: '01/05/2026 17:22:35', status: 'underReview', title: '🇰🇷그가 너를 차갑게 만들었다면, 차라리 한국에 와라', duration: '00:23', language: 'Korean', thumb: 'linear-gradient(135deg, #f6d365 0%, #3aa0a0 60%, #2d3436 130%)' },
  { id: 'rc3', date: '25/04/2026 16:22:13', status: 'passed', title: '泰國🇹🇭美女 會不會讓你心動💗', duration: '00:20', language: 'Thai', thumb: 'linear-gradient(135deg, #fda085 0%, #f6d365 60%, #b91c1c 130%)' },
  { id: 'rc4', date: '21/04/2026 09:10:02', status: 'rejected', title: '街頭美食大挑戰 🍜 一天吃十家', duration: '01:02', language: 'Simplified Chinese', thumb: 'linear-gradient(135deg, #a1c4fd 0%, #45aaf2 60%, #2d3436 130%)' },
]

const TABS = ['all', 'underReview', 'passed', 'rejected']

export default function ReviewContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')

  const records = tab === 'all' ? RECORDS : RECORDS.filter((r) => r.status === tab)

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

      <div className="rc-list">
        {records.map((r) => (
          <article className="rc-card" key={r.id}>
            <div className="rc-head">
              <span className="rc-date">{r.date}</span>
              <span className="rc-badge">{t('video.review.imported')}</span>
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
