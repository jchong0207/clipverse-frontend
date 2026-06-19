import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Button, Empty, Card } from 'antd'
import { CalendarOutlined, GlobalOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { PROMOS } from '../data/promos.js'

export default function Promotion() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (PROMOS.length === 0) {
    return (
      <div className="container section">
        <h1 className="section-title">{t('promotion.title')}</h1>
        <Card><Empty description={<><b>{t('promotion.heading')}</b><br /><span className="muted">{t('promotion.body')}</span></>} /></Card>
      </div>
    )
  }

  return (
    <div className="container section">
      <div className="row-between promo-head">
        <h1 className="section-title left" style={{ margin: 0 }}>{t('promotion.title')}</h1>
        <Button icon={<FileTextOutlined />} onClick={() => navigate('/deploy-history')}>{t('menu.deployHistory')}</Button>
      </div>
      <Row gutter={[16, 16]}>
        {PROMOS.map((p) => {
          const rows = [
            { icon: <CalendarOutlined />, label: t('promotion.rentalPeriod'), value: p.rentalDays },
            { icon: <GlobalOutlined />, label: t('promotion.numberOfAccounts'), value: p.accounts },
            { icon: <ClockCircleOutlined />, label: t('promotion.totalFollowers'), value: p.followers },
            { icon: <FileTextOutlined />, label: t('promotion.estimatedViews'), value: p.views },
          ]
          return (
            <Col xs={24} md={12} lg={8} key={p.key}>
              <div className={`promo-card ${p.featured ? 'featured' : ''}`}>
                <div className="promo-top">
                  <div>
                    <div className="promo-title">{p.title}</div>
                    <div className="promo-price">{p.price}</div>
                  </div>
                  <div className="promo-emblem"><img src="/assets/img/package-logo.png" alt="" /></div>
                </div>

                <div className="promo-divider"><span>{t('promotion.details')}</span></div>

                <ul className="promo-details">
                  {rows.map((d) => (
                    <li key={d.label}>
                      <span className="pd-left">{d.icon}{d.label}</span>
                      <span className="pd-val">{d.value}</span>
                    </li>
                  ))}
                </ul>

                <Button className="promo-btn" block onClick={() => navigate('/select-video', { state: { pkgKey: p.key } })}>
                  {t('common.rent')}
                </Button>
              </div>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}
