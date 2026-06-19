import { useNavigate } from 'react-router-dom'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useTranslation } from 'react-i18next'
import { Card } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

// 👉 EDIT THIS: the ad sections shown on the page. Each currently shows an empty state.
const SECTIONS = ['activeAds']

export default function ProductAds() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="subpage">
      <SubPageHeader title={t('account.productAds')} />

      <div className="subpage-body">
        {SECTIONS.map((key) => (
          <Card className="pa-card" key={key}>
            <h2 className="pa-h">{t(`ads.${key}`)}</h2>
            <div className="pa-empty">
              <InboxOutlined className="pa-empty-icon" />
              <p className="pa-empty-text">{t('ads.empty')}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
