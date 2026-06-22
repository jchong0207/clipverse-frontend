import { useNavigate } from 'react-router-dom'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { BtcIcon } from '../components/cryptoIcons.jsx'
import { useTranslation } from 'react-i18next'
import { App } from 'antd'
import { RightOutlined, GlobalOutlined, BankOutlined } from '@ant-design/icons'
import { LINE_URL, openExternal } from '../constants.js'

const METHODS = [
  { key: 'online', icon: <GlobalOutlined style={{ color: '#2f6bf0' }} /> },
  { key: 'bank', icon: <BankOutlined style={{ color: '#2f6bf0' }} /> },
  { key: 'crypto', icon: <BtcIcon /> },
]

export default function Deposit() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const onMethod = (key) => {
    if (key === 'online') navigate('/online-payment')
    else if (key === 'bank') openExternal(LINE_URL)
    else if (key === 'crypto') navigate('/crypto-deposit')
    else message.info(t('deposit.soon'))
  }

  return (
    <div className="subpage dp">
      <SubPageHeader title={t('deposit.title')} />

      <div className="dp-body">
        <div className="dp-hero">
          <svg className="dp-hero-svg" width="150" height="150" viewBox="0 0 160 160" aria-hidden="true">
            <rect x="78" y="36" width="64" height="88" rx="11" fill="#bcd6f7" />
            <rect x="70" y="30" width="64" height="88" rx="11" fill="#d6e6fb" />
            <rect x="96" y="56" width="30" height="7" rx="3.5" fill="#fff" />
            <rect x="96" y="74" width="30" height="7" rx="3.5" fill="#fff" />
            <path d="M26 118 Q64 140 104 100" fill="none" stroke="#3b78f0" strokeWidth="11" strokeLinecap="round" />
            <path d="M98 88 l16 8 -6 17 z" fill="#2f6bf0" />
            <text x="34" y="86" fontSize="46" fontWeight="800" fill="#2f6bf0" fontFamily="Arial, sans-serif">$</text>
          </svg>
        </div>

        {METHODS.map((m) => (
          <button type="button" className="dp-card" key={m.key} onClick={() => onMethod(m.key)}>
            <span className="dp-card-ico">{m.icon}</span>
            <span className="dp-card-label">{t(`deposit.${m.key}`)}</span>
            <RightOutlined className="dp-card-chev" />
          </button>
        ))}
      </div>

    </div>
  )
}
