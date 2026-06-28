import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App, Dropdown } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { UsdtIcon, UsdcIcon, BankCircle } from '../components/cryptoIcons.jsx'
import { FIAT } from '../data/fiatCurrencies.js'
import { useAuth } from '../store/auth.jsx'
import { usePaymentMethods } from '../store/paymentMethods.jsx'
import { formatBalance } from '../utils/user.js'
import { api } from '../api/client.js'

// rate = units of the selected currency per 1 USDT withdrawn
const METHODS = [
  { key: 'bank', cur: 'USD', rate: 1, icon: <BankCircle /> },
  { key: 'USDT-TRC20', cur: 'USDT-TRC20', rate: 1, icon: <UsdtIcon /> },
  { key: 'USDC-ERC20', cur: 'USDC-ERC20', rate: 1, icon: <UsdcIcon /> },
]
// Flat handling fee, charged in the selected payout currency regardless of method.
const HANDLING_FEE = 10

export default function Withdrawal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user } = useAuth()
  const { bank, usdt, usdc } = usePaymentMethods()
  const balance = formatBalance(user?.walletBalance)
  const [amount, setAmount] = useState('')
  const [methodKey, setMethodKey] = useState('USDT-TRC20')
  const [pwd, setPwd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const method = METHODS.find((m) => m.key === methodKey) || METHODS[0]
  const isBank = method.key === 'bank'
  // Bank payouts always use USD (no longer read from bank object).
  const bankCur = 'USD'
  const bankFiat = FIAT.find((f) => f.code === bankCur)
  const cur = isBank ? bankCur : method.cur
  const rate = isBank ? (bankFiat ? 1 / bankFiat.rate : 1) : method.rate
  const label = (m) => (m.key === 'bank' ? t('withdraw.bankMethod') : m.key)

  const onAmount = (e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))
  const fmtCur = (n) => n.toLocaleString(undefined, { maximumFractionDigits: isBank ? 2 : 8 })
  const gross = amount ? Number(amount) * rate : 0
  const credited = amount ? fmtCur(gross) : '0'
  // Final amount the user receives, net of the flat handling fee (never below 0).
  const creditedNet = amount ? fmtCur(Math.max(0, gross - HANDLING_FEE)) : '0'
  const onWithdraw = async () => {
    const num = Number(amount)
    if (!amount || num < 100) { message.error(t('withdraw.minError')); return }
    if (!pwd) { message.error(t('withdraw.pwdError')); return }

    // Build the payout destination JSON based on the selected method.
    let payoutDestination
    if (isBank) {
      const parts = []
      if (bank?.accountName) parts.push(`"name":"${bank.accountName}"`)
      if (bank?.accountNumber) parts.push(`"account":"${bank.accountNumber}"`)
      parts.push('"method":"bank"')
      payoutDestination = `{${parts.join(',')}}`
    } else {
      const walletEntry = methodKey === 'USDT-TRC20' ? usdt : usdc
      const addr = walletEntry?.walletAddress || ''
      payoutDestination = `{"address":"${addr}","method":"${methodKey}"}`
    }

    setSubmitting(true)
    try {
      await api.placeWithdraw({
        withdrawCurrency: 'USDT',
        withdrawAmount: num,
        payoutDestination,
        withdrawPassword: pwd,
      })
      message.success(t('withdraw.success'))
      navigate('/transaction-history')
    } catch (e) {
      message.error(e?.message || t('withdraw.minError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="subpage wd">
      <SubPageHeader title={t('withdraw.title')} />

      <div className="wd-body">
        <div className="wd-balance">
          <div className="wd-balance-label">{t('withdraw.balance')}</div>
          <div className="wd-balance-amt">{balance}</div>
        </div>

        <div className="wd-card">
          <div className="wd-head">
            <span className="wd-step">{t('withdraw.enterAmount')}</span>
            <span className="wd-min">{t('withdraw.minimum')}</span>
          </div>
          <div className="wd-input-row">
            <input className="wd-input" inputMode="decimal" placeholder="0.00" value={amount} onChange={onAmount} />
            <span className="wd-coin">USDT <UsdtIcon /></span>
          </div>
        </div>

        <div className="wd-card">
          <div className="wd-head"><span className="wd-step">{t('withdraw.selectCurrency')}</span></div>
          <Dropdown trigger={['click']} menu={{ className: 'wd-method-menu', items: METHODS.map((m) => ({ key: m.key, label: label(m), icon: m.icon })), selectable: true, selectedKeys: [methodKey], onClick: ({ key }) => setMethodKey(key) }}>
            <button type="button" className="wd-input-row wd-cur">
              <span className="wd-cur-amt">{credited}</span>
              <span className="wd-coin">{label(method)} {method.icon} <DownOutlined className="wd-caret" /></span>
            </button>
          </Dropdown>
        </div>

        {isBank ? (
          <div className="wd-bankcard">
            <div className="wd-bc-field">
              <div className="wd-bc-label">{t('withdraw.bankCardNumber')}</div>
              <div className="wd-bc-value">{bank?.accountNumber || '—'}</div>
            </div>
            <div className="wd-bc-field">
              <div className="wd-bc-label">{t('withdraw.realName')}</div>
              <div className="wd-bc-value">{bank?.accountName || '—'}</div>
            </div>
            <img src="/assets/img/clipverse-logo.png" alt="Clipverse" className="wd-bc-logo" />
          </div>
        ) : (() => {
          const walletEntry = methodKey === 'USDT-TRC20' ? usdt : methodKey === 'USDC-ERC20' ? usdc : null
          const isUsdt = methodKey === 'USDT-TRC20'
          if (walletEntry?.walletAddress) {
            const addr = walletEntry.walletAddress
            const truncated = addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-8)}` : addr
            return (
              <div className={`wd-walletcard${isUsdt ? ' wd-walletcard--usdt' : ' wd-walletcard--usdc'}`}>
                <div className="wd-wc-top">
                  <div className="wd-wc-coin">{isUsdt ? <UsdtIcon /> : <UsdcIcon />}</div>
                  <div className="wd-wc-currency">{isUsdt ? 'USDT' : 'USDC'}</div>
                  {walletEntry.network && <span className="wd-wc-network">{walletEntry.network}</span>}
                </div>
                <div className="wd-wc-addr-label">{t('withdraw.walletAddress')}</div>
                <div className="wd-wc-addr" title={addr}>{truncated}</div>
                <button type="button" className="wd-wc-change" onClick={() => navigate('/settings')}>
                  {t('withdraw.changeWallet')} <RightOutlined />
                </button>
              </div>
            )
          }
          return (
            <button type="button" className="wd-unbound-wallet" onClick={() => navigate('/settings')}>
              <span className="wd-unbound-icon">{isUsdt ? <UsdtIcon /> : <UsdcIcon />}</span>
              <span className="wd-unbound-text">
                <span className="wd-unbound-title">{t('withdraw.bindWallet')}</span>
                <span className="wd-unbound-hint">{t('withdraw.bindWalletHint')}</span>
              </span>
              <RightOutlined className="wd-unbound-chev" />
            </button>
          )
        })()}

        <div className="wd-card wd-fees">
          <div className="wd-fee-row">
            <span className="wd-fee-label">{t('withdraw.handlingFee')}</span>
            <span className="wd-fee-val">{HANDLING_FEE} {cur}</span>
          </div>
          <div className="wd-divider" />
          <div className="wd-fee-row">
            <span className="wd-fee-label">{t('withdraw.creditedAmount')}</span>
            <span className="wd-fee-val accent">{creditedNet} {cur}</span>
          </div>
        </div>

        <div className="wd-card wd-pwd">
          <div className="wd-pwd-label">{t('withdraw.password')}</div>
          <input className="wd-pwd-input" type="password" placeholder={t('withdraw.passwordPlaceholder')}
            value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
      </div>

      <div className="wd-footer">
        <button type="button" className="wd-submit" disabled={submitting} onClick={onWithdraw}>{t('withdraw.submit')}</button>
      </div>
    </div>
  )
}
