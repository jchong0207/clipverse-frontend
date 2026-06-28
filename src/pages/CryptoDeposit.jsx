import { useRef, useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App, Dropdown, QRCode } from 'antd'
import { DownOutlined, CopyOutlined, CameraOutlined } from '@ant-design/icons'
import { UsdtIcon, UsdcIcon } from '../components/cryptoIcons.jsx'
import { api } from '../api/client.js'

// On-chain networks: value in USDT + a mock receive address per network
const COINS = [
  { key: 'USDT-TRC20', rate: 1, icon: <UsdtIcon />, address: 'THh8AwmUJY6N2RHL672yJy7aAK6nzi9rPR', qr: '/assets/img/deposit-trc20-qr.png' },
  { key: 'USDC-ERC20', rate: 1, icon: <UsdcIcon />, address: '0x8B2c2d4F1bC0a3E7d5A6c9B1234567890aBcDeF0' },
]

const round2 = (n) => Math.round(n * 100) / 100
// Minimum credited deposit in USDT (matches the "Minimum: 100 USDT" shown on the screen).
const MIN_DEPOSIT_USDT = 100

export default function CryptoDeposit() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const fileRef = useRef(null)
  const [amount, setAmount] = useState('')
  const [selKey, setSelKey] = useState('USDT-TRC20')
  const [receipt, setReceipt] = useState(null)
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const sel = COINS.find((o) => o.key === selKey) || COINS[0]
  const onAmount = (e) => setAmount(e.target.value.replace(/\D/g, ''))
  const creditedNum = amount ? round2(Number(amount) * sel.rate) : 0
  const credited = creditedNum ? creditedNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'

  const copyAddr = async () => {
    try { await navigator.clipboard.writeText(sel.address); message.success(t('deposit.copied')) } catch { /* noop */ }
  }
  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setReceipt(URL.createObjectURL(f)) }
  }

  const onSubmit = async () => {
    const src = Number(amount)
    if (!src || creditedNum < MIN_DEPOSIT_USDT) { message.error(t('deposit.minError')); return }
    if (!file) { message.error(t('deposit.uploadReceipt')); return }
    setSubmitting(true)
    try {
      const { url } = await api.uploadDepositProof(file)
      await api.placeDeposit({
        sourceCurrency: sel.key,
        sourceAmount: src,
        targetCurrency: 'USDT',
        targetAmount: creditedNum,
        paymentMetadata: JSON.stringify({ method: 'crypto', coin: sel.key, address: sel.address, proofUrl: url }),
      })
      message.success(t('deposit.success'))
      navigate('/account')
    } catch (e) {
      message.error(e?.message || t('deposit.minError'))
    } finally {
      setSubmitting(false)
    }
  }

  const menuItems = COINS.map((o) => ({
    key: o.key,
    label: o.key,
    icon: <span className="cd-ico">{o.icon}</span>,
  }))

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
            <Dropdown trigger={['click']} menu={{ className: 'wd-method-menu', items: menuItems, selectable: true, selectedKeys: [selKey], onClick: ({ key }) => setSelKey(key) }}>
              <button type="button" className="wd-coin op-curbtn">
                {sel.key} {sel.icon}
                <DownOutlined className="wd-caret" />
              </button>
            </Dropdown>
          </div>

          <div className="wd-head wd-head2"><span className="wd-step">{t('deposit.creditedAmount')}</span></div>
          <div className="wd-input-row">
            <span className="wd-cur-amt">{credited}</span>
            <span className="wd-coin">USDT <UsdtIcon /></span>
          </div>
        </div>

        <div className="wd-card cd-qr">
          <div className="cd-qr-wrap">{sel.qr ? <img className="cd-qr-img" src={sel.qr} width={156} height={156} alt={sel.key} /> : <QRCode value={sel.address} size={156} bordered={false} />}</div>
          <div className="cd-addr">
            <span className="cd-addr-text">{sel.address}</span>
            <button type="button" className="cd-copy" onClick={copyAddr}><CopyOutlined /> {t('deposit.copy')}</button>
          </div>
        </div>

        <div className="wd-card cd-upload">
          <div className="cd-up-label">{t('deposit.uploadReceipt')}</div>
          <button type="button" className="cd-up-box" onClick={() => fileRef.current?.click()}>
            {receipt ? (
              <img className="cd-up-img" src={receipt} alt="receipt" />
            ) : (
              <><CameraOutlined /><span>{t('deposit.upload')}</span></>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      </div>

      <div className="wd-footer">
        <button type="button" className="wd-submit" disabled={submitting} onClick={onSubmit}>{t('deposit.depositBtn')}</button>
      </div>
    </div>
  )
}
