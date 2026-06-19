import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

const RECHARGE = [
  { id: '2060031411899879426', amount: '90000', date: '29/05/2026 00:12:17' },
  { id: '2054209491434491905', amount: '3291.83', date: '12/05/2026 22:38:03' },
  { id: '2038236390150422530', amount: '5654.31', date: '29/03/2026 20:46:39' },
]
const WITHDRAWAL = [
  { id: '2052058554943262722', amount: '500', date: '07/05/2026 00:11:00' },
  { id: '2046484859134791682', amount: '4292.89', date: '21/04/2026 15:03:07' },
  { id: '2044425285015818242', amount: '4299.29', date: '15/04/2026 22:39:06' },
  { id: '2041129121206022145', amount: '3829', date: '06/04/2026 20:21:19' },
  { id: '2038618451218579458', amount: '4521.03', date: '30/03/2026 22:04:49' },
]

export default function TransactionHistory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [tab, setTab] = useState('recharge')

  const isRecharge = tab === 'recharge'
  const rows = isRecharge ? RECHARGE : WITHDRAWAL
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
    </div>
  )
}
