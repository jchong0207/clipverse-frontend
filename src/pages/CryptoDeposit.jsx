import { useRef, useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App, Dropdown, QRCode } from 'antd'
import { DownOutlined, CopyOutlined, CameraOutlined } from '@ant-design/icons'
import { UsdtIcon, UsdcIcon, EthIcon, BtcIcon } from '../components/cryptoIcons.jsx'
import { FIAT, flagSrc } from '../data/fiatCurrencies.js'

// On-chain networks: value in USDT + a mock receive address per network
const COINS = [
  { key: 'USDT-TRC20', rate: 1, icon: <UsdtIcon />, address: 'TWNhtYpYikm18Yj7PKtGeMNHfBaBbrjVfU' },
  { key: 'USDT-ERC20', rate: 1, icon: <UsdtIcon />, address: '0x3F5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE' },
  { key: 'USDC', rate: 1, icon: <UsdcIcon />, address: '0x8B2c2d4F1bC0a3E7d5A6c9B1234567890aBcDeF0' },
  { key: 'ETH', rate: 3500, icon: <EthIcon />, address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' },
  { key: 'BTC', rate: 65000, icon: <BtcIcon />, address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' },
]
// Combined selector: on-chain coins + supported fiat currencies (fiat has no on-chain address)
const OPTIONS = [...COINS, ...FIAT.map((f) => ({ key: f.code, rate: f.rate, cc: f.cc }))]

export default function CryptoDeposit() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const fileRef = useRef(null)
  const [amount, setAmount] = useState('')
  const [selKey, setSelKey] = useState('USDT-TRC20')
  const [receipt, setReceipt] = useState(null)

  const sel = OPTIONS.find((o) => o.key === selKey) || OPTIONS[0]
  const isCrypto = !!sel.address
  const onAmount = (e) => setAmount(e.target.value.replace(/\D/g, ''))
  const credited = amount ? (Number(amount) * sel.rate).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'

  const copyAddr = async () => {
    try { await navigator.clipboard.writeText(sel.address); message.success(t('deposit.copied')) } catch { /* noop */ }
  }
  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (f) setReceipt(URL.createObjectURL(f))
  }

  const menuItems = OPTIONS.map((o) => ({
    key: o.key,
    label: o.key,
    icon: <span className="cd-ico">{o.address ? o.icon : <img className="cd-flag" src={flagSrc(o.cc)} alt="" />}</span>,
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
                {isCrypto ? <>{sel.key} {sel.icon}</> : <><img className="cd-flag-btn" src={flagSrc(sel.cc)} alt="" />{sel.key}</>}
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

        {isCrypto && (
          <div className="wd-card cd-qr">
            <div className="cd-qr-wrap"><QRCode value={sel.address} size={156} bordered={false} /></div>
            <div className="cd-addr">
              <span className="cd-addr-text">{sel.address}</span>
              <button type="button" className="cd-copy" onClick={copyAddr}><CopyOutlined /> {t('deposit.copy')}</button>
            </div>
          </div>
        )}

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
        <button type="button" className="wd-submit">{t('deposit.depositBtn')}</button>
      </div>
    </div>
  )
}
