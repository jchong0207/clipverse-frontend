import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckOutlined } from '@ant-design/icons'

export default function KycStatus() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="kyc">
      <div className="kyc-card">
        <div className="kyc-check"><CheckOutlined /></div>
        <h1 className="kyc-title">{t('kyc.title')}</h1>
        <p className="kyc-desc">{t('kyc.desc')}</p>
        <button type="button" className="kyc-return" onClick={() => navigate(-1)}>{t('kyc.return')}</button>
      </div>
    </div>
  )
}
