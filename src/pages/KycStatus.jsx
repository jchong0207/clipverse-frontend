import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../store/auth.jsx'
import { api } from '../api/client.js'
import KycForm from './KycForm.jsx'

// Single entry for /kyc. Branches on the user's verification status:
//   unverified → fill-in form;  pending → under-review notice;  verified → success card.
export default function KycStatus() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()

  const status = user?.kycStatus || 'unverified'

  if (status === 'unverified') {
    const handleSubmit = async (payload) => {
      await api.submitKyc(payload)
      await refresh()
    }
    return <KycForm onSubmitted={handleSubmit} />
  }

  const pending = status === 'pending'
  return (
    <div className={`kyc ${pending ? 'kyc-pending' : ''}`}>
      <div className="kyc-card">
        <div className={`kyc-check ${pending ? 'pending' : ''}`}>
          {pending ? <ClockCircleOutlined /> : <CheckOutlined />}
        </div>
        <h1 className="kyc-title">{pending ? t('kyc.pending.title') : t('kyc.title')}</h1>
        <p className="kyc-desc">{pending ? t('kyc.pending.desc') : t('kyc.desc')}</p>
        <button type="button" className="kyc-return" onClick={() => navigate(-1)}>{t('kyc.return')}</button>
      </div>
    </div>
  )
}
