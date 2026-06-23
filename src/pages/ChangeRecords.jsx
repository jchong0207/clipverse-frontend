import { useState, useEffect } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useTranslation } from 'react-i18next'
import { Empty } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { api } from '../api/client.js'

// Map backend revenue type -> the i18n label key under "change.*".
const KEY_FOR_TYPE = { RECHARGE: 'recharge', PLAYBACK: 'playback', WITHDRAW: 'withdraw' }

// Format a numeric amount, dropping a trailing ".00" but keeping real fractional values.
const fmtAmount = (n) => String(Number(n))

// Format an ISO/LocalDateTime string ('2026-05-29T00:12:17') as 'DD/MM/YYYY HH:mm:ss'.
function fmtDate(iso) {
  if (!iso) return ''
  const [date, time = ''] = String(iso).split('T')
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y} ${time.slice(0, 8)}`
}

export default function ChangeRecords() {
  const { t } = useTranslation()
  const [records, setRecords] = useState([])
  const [loaded, setLoaded] = useState(false)

  // Fetch the logged-in member's revenue (wallet balance-change) ledger once.
  useEffect(() => {
    let active = true
    api.listRevenue()
      .then((page) => { if (active) setRecords(page?.items || []) })
      .catch(() => { /* leave empty; the empty state covers it */ })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  const rows = records.map((r) => ({
    key: KEY_FOR_TYPE[r.type] || 'recharge',
    dir: r.direction === 'OUT' ? 'out' : 'in',
    amount: fmtAmount(r.amount),
    date: fmtDate(r.createTime),
    id: r.id,
  }))

  return (
    <div className="subpage cr">
      <SubPageHeader title={t('change.title')} />

      {loaded && rows.length === 0 ? (
        <Empty description={<span className="muted">{t('change.empty')}</span>} style={{ padding: '3rem 0' }} />
      ) : (
        <div className="cr-list">
          {rows.map((r) => (
            <div className="cr-row" key={r.id}>
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
      )}
    </div>
  )
}
