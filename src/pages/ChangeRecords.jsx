import { useNavigate } from 'react-router-dom'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useTranslation } from 'react-i18next'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'

const RECORDS = [
  { key: 'recharge', date: '29/05/2026 00:12:17', amount: '90000', dir: 'in' },
  { key: 'recharge', date: '12/05/2026 22:38:03', amount: '3291.83', dir: 'in' },
  { key: 'playback', date: '12/05/2026 00:10:00', amount: '4211.68', dir: 'in' },
  { key: 'playback', date: '10/05/2026 00:10:00', amount: '4144.8', dir: 'in' },
  { key: 'playback', date: '08/05/2026 00:10:00', amount: '1971.64', dir: 'in' },
  { key: 'withdraw', date: '07/05/2026 00:11:00', amount: '500', dir: 'out' },
  { key: 'playback', date: '07/05/2026 00:10:00', amount: '1933.68', dir: 'in' },
  { key: 'playback', date: '05/05/2026 00:10:00', amount: '2477.12', dir: 'in' },
  { key: 'withdraw', date: '03/05/2026 18:42:55', amount: '1200', dir: 'out' },
  { key: 'playback', date: '02/05/2026 00:10:00', amount: '3088.90', dir: 'in' },
]

export default function ChangeRecords() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="subpage cr">
      <SubPageHeader title={t('change.title')} />

      <div className="cr-list">
        {RECORDS.map((r, i) => (
          <div className="cr-row" key={i}>
            <span className={`cr-ico ${r.dir}`}>
              {r.dir === 'in'
                ? <ArrowDownOutlined style={{ transform: 'rotate(-45deg)' }} />
                : <ArrowUpOutlined style={{ transform: 'rotate(45deg)' }} />}
            </span>
            <div className="cr-main">
              <div className="cr-title">{t(`change.${r.key}`)}</div>
              <div className="cr-date">{r.date}</div>
            </div>
            <span className={`cr-amt ${r.dir}`}>{r.dir === 'in' ? '+' : '-'}{r.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
