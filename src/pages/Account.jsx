import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/auth.jsx'
import { maskId, formatBalance } from '../utils/user.js'
import {
  CopyOutlined, SendOutlined, ForwardOutlined, BarChartOutlined, CodeSandboxOutlined, IdcardOutlined,
  SafetyCertificateOutlined, SwapOutlined, FileTextOutlined, RightOutlined,
} from '@ant-design/icons'

// 👉 Data Overview cards. (Product Orders intentionally omitted.)
const STATS = [
  { key: 'deliveryLog', value: 0, icon: <SendOutlined />, to: '/deploy-history' },
  { key: 'views', value: 0, icon: <ForwardOutlined /> },
  { key: 'adRevenue', value: 0, icon: <BarChartOutlined /> },
]

export default function Account() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const idText = maskId(user)
  const credit = user?.creditBalance ?? 51
  const uid = user?.uid ?? user?.id ?? '0470508'
  const balance = formatBalance(user?.walletBalance)
  const kycStatus = user?.kycStatus || 'unverified'

  const copyUid = async () => {
    try { await navigator.clipboard.writeText(String(uid)); message.success(t('account.copied')) } catch { /* noop */ }
  }

  return (
    <div className="mp">
      <div className="mp-banner">
        <div className="mp-id-row">
          <img className="mp-avatar" src="/assets/img/clipverse-logo.png" alt="" />
          <div className="mp-id-info">
            <div className="mp-id">{idText}</div>
            <span className="mp-credit">{t('menu.credit')} {credit}</span>
            <div className="mp-uid">{t('menu.uid')}: {uid} <CopyOutlined className="mp-copy" onClick={copyUid} /></div>
          </div>
        </div>
        <div className="mp-balance-label">{t('account.balance')}</div>
        <div className="mp-balance">{balance}</div>
      </div>

      <div className="mp-body">
        <div className="mp-actions">
          <button type="button" className="mp-btn mp-btn-ghost" onClick={() => navigate('/withdrawal')}>{t('account.withdrawal')}</button>
          <button type="button" className="mp-btn mp-btn-primary" onClick={() => navigate('/deposit')}>{t('account.deposit')}</button>
        </div>

        <h2 className="mp-section-title">{t('account.dataOverview')}</h2>
        <div className="mp-grid">
          {STATS.map((s) => (
            <div className={`mp-stat ${s.to ? 'clickable' : ''}`} key={s.key}
              onClick={s.to ? () => navigate(s.to) : undefined}>
              <div className="mp-stat-main">
                <div className="mp-stat-num">{s.value}</div>
                <div className="mp-stat-label">{t(`account.${s.key}`)}</div>
              </div>
              <span className="mp-stat-icon">{s.icon}</span>
            </div>
          ))}
        </div>

        {/* Quick actions — Manage Product intentionally omitted. */}
        <div className="mp-quick">
          <button type="button" className="mp-action" onClick={() => navigate('/product-ads')}>
            <span className="mp-action-icon" style={{ background: '#1d6ff2' }}><CodeSandboxOutlined /></span>
            <span className="mp-action-label">{t('account.productAds')}</span>
          </button>
          <button type="button" className="mp-action" onClick={() => navigate('/settings')}>
            <span className="mp-action-icon" style={{ background: '#f5821f' }}><IdcardOutlined /></span>
            <span className="mp-action-label">{t('account.settings')}</span>
          </button>
        </div>

        <div className="mp-list">
          <button type="button" className="mp-list-item" onClick={() => navigate('/kyc')}>
            <span className="mp-list-icon"><SafetyCertificateOutlined /></span>
            <span className="mp-list-label">{t('account.kyc')}</span>
            <span className={`mp-list-val kyc-${kycStatus}`}>{t(`account.kycStatus.${kycStatus}`)}</span>
            <RightOutlined className="mp-list-chev" />
          </button>
          <button type="button" className="mp-list-item" onClick={() => navigate('/revenue-history')}>
            <span className="mp-list-icon"><SwapOutlined /></span>
            <span className="mp-list-label">{t('account.revenueHistory')}</span>
            <RightOutlined className="mp-list-chev" />
          </button>
          <button type="button" className="mp-list-item" onClick={() => navigate('/transaction-history')}>
            <span className="mp-list-icon"><FileTextOutlined /></span>
            <span className="mp-list-label">{t('account.transactionHistory')}</span>
            <RightOutlined className="mp-list-chev" />
          </button>
        </div>
      </div>
    </div>
  )
}
