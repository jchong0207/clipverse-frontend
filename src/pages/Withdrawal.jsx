import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App, Dropdown } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { UsdtIcon, UsdcIcon, BankCircle } from '../components/cryptoIcons.jsx'
import { FIAT } from '../data/fiatCurrencies.js'
import { loadJSON } from '../utils/storage.js'
import { useAuth } from '../store/auth.jsx'
import { formatBalance } from '../utils/user.js'

// rate = units of the selected currency per 1 USDT withdrawn
const METHODS = [
  { key: 'bank', cur: 'USD', rate: 1, icon: <BankCircle /> },
  { key: 'USDT-TRC20', cur: 'USDT-TRC20', rate: 1, icon: <UsdtIcon /> },
  { key: 'USDC-ERC20', cur: 'USDC-ERC20', rate: 1, icon: <UsdcIcon /> },
]

export default function Withdrawal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user } = useAuth()
  const balance = formatBalance(user?.walletBalance)
  const [amount, setAmount] = useState('')
  const [methodKey, setMethodKey] = useState('USDT-TRC20')
  const [pwd, setPwd] = useState('')
  const [bank] = useState(() => loadJSON('cv_bank'))

  const method = METHODS.find((m) => m.key === methodKey) || METHODS[0]
  const isBank = method.key === 'bank'
  // Bank payouts use the currency bound on the bank card (USD / CAD); convert USDT -> that currency.
  const bankCur = bank.currency || 'USD'
  const bankFiat = FIAT.find((f) => f.code === bankCur)
  const cur = isBank ? bankCur : method.cur
  const rate = isBank ? (bankFiat ? 1 / bankFiat.rate : 1) : method.rate
  const label = (m) => (m.key === 'bank' ? t('withdraw.bankMethod') : m.key)

  const onAmount = (e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))
  const credited = amount ? (Number(amount) * rate).toLocaleString(undefined, { maximumFractionDigits: isBank ? 2 : 8 }) : '0'
  const onWithdraw = () => {
    if (!amount || Number(amount) < 100) { message.error(t('withdraw.minError')); return }
    if (!pwd) { message.error(t('withdraw.pwdError')); return }
    message.success(t('withdraw.success'))
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
              <div className="wd-bc-value">{bank.bankAccount || '—'}</div>
            </div>
            <div className="wd-bc-field">
              <div className="wd-bc-label">{t('withdraw.realName')}</div>
              <div className="wd-bc-value">{bank.fullName || '—'}</div>
            </div>
            <svg className="wd-bc-chip" width="58" height="44" viewBox="0 0 58 44" aria-hidden="true">
              <rect x="1" y="1" width="56" height="42" rx="7" fill="#ededed" stroke="#cfcfcf" />
              <rect x="22" y="1" width="14" height="42" fill="#e3e3e3" />
              <rect x="1" y="16" width="56" height="12" fill="#e3e3e3" />
              <rect x="22" y="16" width="14" height="12" rx="2" fill="#f5f5f5" stroke="#cfcfcf" />
            </svg>
          </div>
        ) : (
          <div className="wd-card wd-bind">
            <button type="button" className="wd-bind-text" onClick={() => navigate('/settings')}>{t('withdraw.bindWallet')}</button>
            <button type="button" className="wd-unbind" onClick={() => navigate('/settings')}>{t('withdraw.unbind')} <RightOutlined /></button>
          </div>
        )}

        <div className="wd-card wd-fees">
          <div className="wd-fee-row">
            <span className="wd-fee-label">{t('withdraw.handlingFee')}</span>
            <span className="wd-fee-val">0 {cur}</span>
          </div>
          <div className="wd-divider" />
          <div className="wd-fee-row">
            <span className="wd-fee-label">{t('withdraw.creditedAmount')}</span>
            <span className="wd-fee-val accent">{credited} {cur}</span>
          </div>
        </div>

        <div className="wd-card wd-pwd">
          <div className="wd-pwd-label">{t('withdraw.password')}</div>
          <input className="wd-pwd-input" type="password" placeholder={t('withdraw.passwordPlaceholder')}
            value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
      </div>

      <div className="wd-footer">
        <button type="button" className="wd-submit" onClick={onWithdraw}>{t('withdraw.submit')}</button>
      </div>
    </div>
  )
}
