import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Form, Input, Button, Alert, Card } from 'antd'
import { useAuth } from '../store/auth.jsx'
import { LINE_URL, openExternal } from '../constants.js'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onFinish = async (values) => {
    setError('')
    setBusy(true)
    try {
      await login(values)
      // Re-arm the home announcement so it greets the user right after login.
      try { sessionStorage.removeItem('cv_home_ann_seen') } catch { /* noop */ }
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
          <button type="button" className="link-btn" onClick={() => openExternal(LINE_URL)}>
            {t('login.forgot')}
          </button>
        </div>
      </Card>
    </div>
  )
}
