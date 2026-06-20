import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Descriptions, Tag, Button, Alert, Space, Result } from 'antd'
import { api } from '../api/client.js'
import { useAuth } from '../store/auth.jsx'

const STATUS_KEY = { UNPAID: 'orders.statusUnpaid', PAID: 'orders.statusPaid', CANCELLED: 'orders.statusCancelled' }
const TAG_COLOR = { PAID: 'success', UNPAID: 'warning', CANCELLED: 'default' }
const JOB_KEY = {
  AWAITING_PAYMENT: 'order.jobAwaiting', IN_PRODUCTION: 'order.jobInProduction',
  COMPLETED: 'order.jobCompleted', CANCELLED: 'order.jobCancelled',
}

export default function OrderDetail() {
  const { id } = useParams()
  const { refresh } = useAuth()
  const { t } = useTranslation()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = () => {
    setLoading(true)
    return api.getOrder(id).then(setOrder).catch((e) => setError(e.message || t('order.notFound'))).finally(() => setLoading(false))
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

  const pay = async () => {
    setBusy('pay'); setError('')
    try { setOrder(await api.payOrder(id)); await refresh() }
    catch (e) { setError(e.message || 'Payment failed') } finally { setBusy('') }
  }
  const cancel = async () => {
    setBusy('cancel'); setError('')
    try { setOrder(await api.cancelOrder(id)) }
    catch (e) { setError(e.message || 'Could not cancel') } finally { setBusy('') }
  }

  if (loading) return <div className="container narrow section"><p className="muted">{t('common.loading')}</p></div>
  if (!order) return (
    <div className="container narrow section">
      <Result status="404" title={error || t('order.notFound')}
        extra={<Link to="/videos"><Button type="primary">{t('order.backToOrders')}</Button></Link>} />
    </div>
  )

  const minutes = Math.max(1, Math.ceil(order.durationSeconds / 60))
  const items = [
    { key: 'video', label: t('orders.video'), children: order.filename },
    { key: 'lang', label: t('orders.languages'), children: `${order.sourceLanguage} → ${order.targetLanguage}` },
    { key: 'dur', label: t('order.durationBilled'), children: t('order.minutes', { n: minutes }) },
    { key: 'job', label: t('order.jobStatus'), children: t(JOB_KEY[order.jobStatus] || order.jobStatus) },
    { key: 'total', label: t('order.total'), children: <b>{order.amount} {order.currency}</b> },
  ]

  return (
    <div className="container narrow section">
      <Link to="/videos" className="link">{t('order.backToOrders')}</Link>
      <Card style={{ marginTop: 12 }}
        title={<Space>{order.packageName}<Tag color={TAG_COLOR[order.status]}>{t(STATUS_KEY[order.status])}</Tag></Space>}>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

        <Descriptions column={1} bordered size="small" items={items} />

        {order.status === 'UNPAID' && (
          <div style={{ marginTop: 16 }}>
            <p className="muted">{t('order.unpaidNote')}</p>
            <Space wrap>
              <Button type="primary" loading={busy === 'pay'} onClick={pay}>{t('order.payBtn', { n: order.amount })}</Button>
              <Button loading={busy === 'cancel'} onClick={cancel}>{t('order.cancelBtn')}</Button>
            </Space>
          </div>
        )}
        {order.status === 'PAID' && <Alert type="success" showIcon message={t('order.paidMsg')} style={{ marginTop: 16 }} />}
        {order.status === 'CANCELLED' && <Alert type="info" showIcon message={t('order.cancelledMsg')} style={{ marginTop: 16 }} />}
      </Card>
    </div>
  )
}
