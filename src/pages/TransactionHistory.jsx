import { useState, useEffect } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useTranslation } from 'react-i18next'
import { App, Empty } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { api } from '../api/client.js'

// Map backend order type -> the tab it belongs to.
const TYPE_FOR_TAB = { recharge: 'RECHARGE', withdrawal: 'WITHDRAWAL' }

// Format a numeric amount, dropping a trailing ".00" but keeping real fractional values.
const fmtAmount = (n) => String(Number(n))

// Format an ISO/LocalDateTime string ('2026-05-29T00:12:17') as 'DD/MM/YYYY HH:mm:ss'.
function fmtDate(iso) {
  if (!iso) return ''
  const [date, time = ''] = String(iso).split('T')
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y} ${time.slice(0, 8)}`
}

export default function TransactionHistory() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [tab, setTab] = useState('recharge')
  const [orders, setOrders] = useState([])
  const [loaded, setLoaded] = useState(false)

  // Fetch the logged-in member's transaction orders once; filter by tab client-side.
  useEffect(() => {
    let active = true
    api.listTransactions()
      .then((page) => { if (active) setOrders(page?.items || []) })
      .catch(() => { /* leave empty; the empty state covers it */ })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  const isRecharge = tab === 'recharge'
  const rows = orders
    .filter((o) => o.type === TYPE_FOR_TAB[tab])
    .map((o) => ({ id: String(o.id), amount: fmtAmount(o.amount), date: fmtDate(o.createTime) }))
  const status = isRecharge ? t('txhist.delivered') : t('txhist.payoutSuccess')

  const copy = async (id) => {
    try { await navigator.clipboard.writeText(id); message.success(t('txhist.copied')) } catch { /* noop */ }
  }

  return (
    <div className="subpage th">
      <SubPageHeader title={t('txhist.title')} />

      <div className="dh-tabs th-tabs">
        <button type="button" className={`dh-tab ${isRecharge ? 'active' : ''}`} onClick={() => setTab('recharge')}>{t('txhist.recharge')}</button>
        <button type="button" className={`dh-tab ${!isRecharge ? 'active' : ''}`} onClick={() => setTab('withdrawal')}>{t('txhist.withdrawal')}</button>
      </div>

      {loaded && rows.length === 0 ? (
        <Empty description={<span className="muted">{t('txhist.empty')}</span>} style={{ padding: '3rem 0' }} />
      ) : (
        <div className="th-list">
          {rows.map((r) => (
            <div className="th-row" key={r.id}>
              <div className="th-top">
                <span className="th-id">{r.id}</span>
                <button type="button" className={`th-copy ${isRecharge ? '' : 'orange'}`} onClick={() => copy(r.id)} aria-label="Copy"><CopyOutlined /></button>
                <span className="th-status">{status}</span>
              </div>
              <div className="th-bottom">
                <span className="th-amount">{r.amount}</span>
                <span className="th-date">{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
