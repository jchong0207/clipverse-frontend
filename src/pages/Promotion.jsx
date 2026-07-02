import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Button, Empty, Card } from 'antd'
import { CalendarOutlined, GlobalOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { PROMOS } from '../data/promos.js'
import { api } from '../api/client.js'

// Format a DECIMAL(12,2) price ('299.00') the way the promo cards have always shown it: '$299'.
const fmtPrice = (n) => `$${Number(n)}`

// Map a backend plan (/app-api/plan/list) to the exact card shape this page has always rendered.
const toPromo = (p) => ({
  key: `p${p.id}`,
  featured: true,
  title: p.title,
  price: fmtPrice(p.price),
  rentalDays: String(p.durationDays),
  accounts: String(p.accountCount),
  followers: p.followerRange ?? '',
  views: p.viewRange ?? '',
  revenue: p.revenueRange ?? '',
})

export default function Promotion() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [promos, setPromos] = useState([])
  const [loaded, setLoaded] = useState(false)

  // Fetch the live plan catalog; fall back to the bundled PROMOS if the API is unavailable.
  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(() => api.plan.list())
      .then((plans) => { if (active) setPromos((plans || []).map(toPromo)) })
      .catch(() => { if (active) setPromos(PROMOS) })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  if (!loaded) {
    return <div className="container section" />
  }

  if (promos.length === 0) {
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
        {promos.map((p) => {
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

                <Button className="promo-btn" block onClick={() => navigate('/select-video', { state: { pkgKey: p.key, pkg: p } })}>
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
