import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Form, Input, Button, Alert, Card } from 'antd'
import { useAuth } from '../store/auth.jsx'
import { useCustomerService } from '../store/customerService.jsx'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { available, open } = useCustomerService()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onFinish = async (values) => {
    setError('')
    setBusy(true)
    try {
      await login(values)
      navigate(location.state?.from || '/videos', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container narrow section">
      <Card>
        <h1 style={{ marginTop: 0 }}>{t('login.title')}</h1>
        <p className="muted">{t('login.subtitle')}</p>
        {error && <Alert type="error" message={error} showIcon style={{ margin: '12px 0' }} />}
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('register.enterEmail') }]}>
            <Input size="large" placeholder={t('register.enterEmail')} autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('register.enterPassword') }]}>
            <Input.Password size="large" placeholder={t('register.enterPassword')} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={busy}>
            {t('login.submit')}
          </Button>
        </Form>
        <div className="login-bottom">
          <span className="muted">{t('login.noAccount')} <Link to="/register">{t('login.create')}</Link></span>
          {available && (
            <button type="button" className="link-btn" onClick={open}>
              {t('login.forgot')}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
