import { useTranslation } from 'react-i18next'
import { Card, Empty } from 'antd'

// Generic placeholder for menu sections that don't have real content yet.
export default function Placeholder({ titleKey }) {
  const { t } = useTranslation()
  const heading = t(titleKey)
  return (
    <div className="container section">
      <h1 className="section-title">{heading}</h1>
      <Card>
        <Empty description={<span className="muted">{t('menu.comingSoon')}</span>} />
      </Card>
    </div>
  )
}
