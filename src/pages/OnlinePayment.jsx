import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { UsdtIcon } from '../components/cryptoIcons.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App, Dropdown } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { FIAT, flagSrc } from '../data/fiatCurrencies.js'
import { api } from '../api/client.js'

// Round to 2 decimals for the credited USDT amount sent to the backend (BigDecimal-safe number).
const round2 = (n) => Math.round(n * 100) / 100
// Minimum credited deposit in USDT (matches the "Minimum: 100 USDT" shown on the screen).
const MIN_DEPOSIT_USDT = 100

export default function OnlinePayment() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [amount, setAmount] = useState('')
  const [code, setCode] = useState('USD')
  const [submitting, setSubmitting] = useState(false)

  const fiat = FIAT.find((f) => f.code === code) || FIAT[0]
  // digits only — no characters, no decimal point
  const onAmount = (e) => setAmount(e.target.value.replace(/\D/g, ''))
  const creditedNum = amount ? round2(Number(amount) * fiat.rate) : 0
  const credited = creditedNum ? creditedNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'

  const onSubmit = async () => {
    const src = Number(amount)
    if (!src || creditedNum < MIN_DEPOSIT_USDT) { message.error(t('deposit.minError')); return }
    setSubmitting(true)
    try {
      await api.placeDeposit({
        sourceCurrency: code,
        sourceAmount: src,
        targetCurrency: 'USDT',
        targetAmount: creditedNum,
        paymentMetadata: JSON.stringify({ method: 'online', fiat: code, rate: fiat.rate }),
      })
      message.success(t('deposit.success'))
      navigate('/transaction-history')
    } catch (e) {
      message.error(e?.message || t('deposit.minError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="subpage wd op">
      <SubPageHeader title={t('deposit.title')} />

      <div className="wd-body">
        <div className="wd-card">
          <div className="wd-head">
            <span className="wd-step">{t('deposit.enterAmount')}</span>
            <span className="wd-min">{t('deposit.minimum')}</span>
          </div>
          <div className="wd-input-row">
            <input className="wd-input" inputMode="numeric" placeholder="0.00" value={amount} onChange={onAmount} />
            <Dropdown trigger={['click']} menu={{ className: 'op-menu', items: FIAT.map((f) => ({ key: f.code, label: <span className="op-opt"><img className="op-flag-img" src={flagSrc(f.cc)} alt="" />{f.code}</span> })), selectable: true, selectedKeys: [code], onClick: ({ key }) => setCode(key) }}>
              <button type="button" className="wd-coin op-curbtn"><img className="cd-flag-btn" src={flagSrc(fiat.cc)} alt="" />{code} <DownOutlined className="wd-caret" /></button>
            </Dropdown>
          </div>
        </div>

        <div className="wd-card">
          <div className="wd-head"><span className="wd-step">{t('deposit.creditedAmount')}</span></div>
          <div className="wd-input-row">
            <span className="wd-cur-amt">{credited}</span>
            <span className="wd-coin">USDT <UsdtIcon /></span>
          </div>
        </div>
      </div>

      <div className="wd-footer">
        <button type="button" className="wd-submit" disabled={submitting} onClick={onSubmit}>{t('deposit.depositBtn')}</button>
      </div>
    </div>
  )
}
