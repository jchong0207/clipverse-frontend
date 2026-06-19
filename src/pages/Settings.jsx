import { useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { loadJSON, saveJSON } from '../utils/storage.js'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App, Dropdown } from 'antd'
import { useAuth } from '../store/auth.jsx'
import {
  LockOutlined, SafetyOutlined, GoogleOutlined, WalletOutlined, CreditCardOutlined,
  DeleteOutlined, LogoutOutlined, RightOutlined, CloseOutlined, CopyOutlined, DownOutlined,
} from '@ant-design/icons'

const GA_SECRET = 'ZDIUBQ7G5QIQJSZA'
const WALLETS = ['USDT-ERC20/USDC', 'USDT-TRC20', 'ETH', 'BTC']
const CURRENCIES = ['USD', 'CAD']
const BANK_FIELDS = ['fullName', 'bankAccount', 'bsb', 'payId', 'bankName']

const SECURITY = [
  { key: 'changeLoginPwd', icon: <LockOutlined />, kind: 'pwd' },
  { key: 'changeWithdrawPwd', icon: <SafetyOutlined />, kind: 'pwd' },
  { key: 'bindGoogleAuth', icon: <GoogleOutlined />, kind: 'ga' },
  { key: 'bindBlockchain', icon: <WalletOutlined />, kind: 'blockchain' },
  { key: 'bindBank', icon: <CreditCardOutlined />, kind: 'bank' },
]


export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { message, modal } = App.useApp()
  const [active, setActive] = useState(null)
  const [vals, setVals] = useState({})
  const [gaCode, setGaCode] = useState('')
  const [chain, setChain] = useState(() => loadJSON('cv_blockchain'))
  const [bank, setBank] = useState(() => loadJSON('cv_bank'))

  const openModal = (s) => { setVals({}); setGaCode(''); setActive(s) }
  const closeModal = () => { setActive(null); setVals({}); setGaCode('') }

  const setChainVal = (w, v) => setChain((p) => { const n = { ...p, [w]: v }; saveJSON('cv_blockchain', n); return n })
  const setBankVal = (k, v) => setBank((p) => { const n = { ...p, [k]: v }; saveJSON('cv_bank', n); return n })
  const bankCurrency = bank.currency || 'USD'

  const onClearCache = async () => {
    // Clear all of this site's (origin's) client-side storage
    try { localStorage.clear() } catch { /* noop */ }
    try { sessionStorage.clear() } catch { /* noop */ }
    try {
      if (window.caches) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch { /* noop */ }
    try {
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
    } catch { /* noop */ }
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases()
        await Promise.all(dbs.map((d) => d.name && indexedDB.deleteDatabase(d.name)))
      }
    } catch { /* noop */ }
    setChain({}); setBank({})
    message.success(t('settings.cacheCleared'))
  }
  const onLogout = () => {
    modal.confirm({
      title: t('auth.confirmLogout'),
      okText: t('auth.yesLogout'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => { try { await logout() } catch { /* noop */ } navigate('/') },
    })
  }

  const onConfirmPwd = () => {
    const np = vals.newPwd || ''
    const na = vals.newPwdAgain || ''
    if (np.length < 6) { message.error(t('settings.pwdTooShort')); return }
    if (np !== na) { message.error(t('settings.pwdMismatch')); return }
    message.success(t('settings.updated')); closeModal()
  }
  const onBindGa = () => { message.success(t('settings.bound')); closeModal() }
  const onSaveChain = () => message.success(t('settlement.saved'))
  const onBindBank = () => { message.success(t('settlement.bound')); closeModal() }
  const copyKey = async () => { try { await navigator.clipboard.writeText(GA_SECRET); message.success(t('settings.copied')) } catch { /* noop */ } }

  return (
    <div className="subpage">
      <SubPageHeader title={t('account.settings')} />

      <div className="subpage-body">
        <div className="mp-list">
          {SECURITY.map((s) => (
            <button type="button" className="mp-list-item" key={s.key} onClick={() => openModal(s)}>
              <span className="mp-list-icon">{s.icon}</span>
              <span className="mp-list-label">{t(`settings.${s.key}`)}</span>
              <RightOutlined className="mp-list-chev" />
            </button>
          ))}
        </div>

        <div className="mp-list">
          <button type="button" className="mp-list-item" onClick={onClearCache}>
            <span className="mp-list-icon"><DeleteOutlined /></span>
            <span className="mp-list-label">{t('settings.clearCache')}</span>
            <RightOutlined className="mp-list-chev" />
          </button>
          <button type="button" className="mp-list-item danger" onClick={onLogout}>
            <span className="mp-list-icon"><LogoutOutlined /></span>
            <span className="mp-list-label">{t('settings.logout')}</span>
          </button>
        </div>
      </div>

      {active && (
        <div className="sm-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="sm-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="sm-close" onClick={closeModal} aria-label="Close"><CloseOutlined /></button>
            <h2 className="sm-title">{active.kind === 'ga' && <span className="sm-title-ico">{active.icon}</span>}{t(`settings.${active.key}`)}</h2>

            {active.kind === 'pwd' && (
              <>
                <div className="sm-icon">{active.icon}</div>
                {['oldPwd', 'newPwd', 'newPwdAgain'].map((f) => (
                  <div className="sm-field" key={f}>
                    <label className="sm-label">{t(`settings.${f}`)}</label>
                    <input className="sm-input" type="password" placeholder={t('settings.pleaseEnter')}
                      value={vals[f] || ''} onChange={(e) => setVals((v) => ({ ...v, [f]: e.target.value }))} />
                  </div>
                ))}
                <button type="button" className="sm-confirm" onClick={onConfirmPwd}>{t('settings.confirm')}</button>
              </>
            )}

            {active.kind === 'ga' && (
              <>
                <img className="sm-qr" src="/assets/img/ga-qr.png" alt="Authenticator QR code" />
                <label className="sm-label">{t('settings.copyKey')}</label>
                <div className="sm-key">
                  <span className="sm-key-text">{GA_SECRET}</span>
                  <button type="button" className="sm-key-copy" onClick={copyKey}>{t('settings.copy')} <CopyOutlined /></button>
                </div>
                <label className="sm-label">{t('settings.verifyCode')}</label>
                <input className="sm-input" placeholder={t('settings.pleaseEnter')} inputMode="numeric" maxLength={6}
                  value={gaCode} onChange={(e) => setGaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                <button type="button" className="sm-confirm" onClick={onBindGa}>{t('settings.confirmBinding')}</button>
              </>
            )}

            {active.kind === 'blockchain' && WALLETS.map((w) => (
              <div className="stm-wallet" key={w}>
                <div className="stm-wlabel">{w}</div>
                <div className="stm-row">
                  <input className="stm-rowinput" placeholder={t('settlement.pleaseEnter')}
                    value={chain[w] || ''} onChange={(e) => setChainVal(w, e.target.value)} />
                  <button type="button" className="stm-save" onClick={onSaveChain}>{t('settlement.save')}</button>
                </div>
              </div>
            ))}

            {active.kind === 'bank' && (
              <>
                <label className="stm-flabel">{t('settlement.withdrawCurrency')}</label>
                <Dropdown trigger={['click']} menu={{ items: CURRENCIES.map((c) => ({ key: c, label: c })), selectable: true, selectedKeys: [bankCurrency], onClick: ({ key }) => setBankVal('currency', key) }}>
                  <button type="button" className="stm-dd"><span>{bankCurrency}</span><DownOutlined className="stm-dd-caret" /></button>
                </Dropdown>
                {BANK_FIELDS.map((f) => (
                  <div key={f}>
                    <label className="stm-flabel">{t(`settlement.${f}`)}</label>
                    <input className="stm-finput" placeholder={t('settlement.pleaseEnter')}
                      value={bank[f] || ''} onChange={(e) => setBankVal(f, e.target.value)} />
                  </div>
                ))}
                <button type="button" className="stm-confirm" onClick={onBindBank}>{t('settlement.confirmBinding')}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
