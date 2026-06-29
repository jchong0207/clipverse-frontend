import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Form, Input, Button, Alert, Card, Checkbox, Modal, App } from 'antd'
import { useAuth } from '../store/auth.jsx'
import { getUserAgreement } from '../data/userAgreement.js'

export default function Register() {
  const { t, i18n } = useTranslation()
  const agreement = getUserAgreement(i18n.resolvedLanguage)
  const { register } = useAuth()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)

  const onGetCode = async () => {
    try { await form.validateFields(['email']) } catch { message.warning(t('register.emailFirst')); return }
    message.success(t('register.codeSent'))
  }

  const onFinish = async (values) => {
    if (!agree) { setError(t('register.agreeRequired')); return }
    setError('')
    setBusy(true)
    try {
      await register({
        name: values.email.split('@')[0],
        email: values.email,
        password: values.password,
        code: values.code,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container narrow section">
      <Card>
        <h1 style={{ marginTop: 0 }}>{t('register.title')}</h1>
        <p className="muted">{t('register.subtitle')}</p>
        {error && <Alert type="error" message={error} showIcon style={{ margin: '12px 0' }} />}
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('register.enterEmail') }]}>
            <Input size="large" placeholder={t('register.enterEmail')} autoComplete="email" />
          </Form.Item>
          <Form.Item name="code" rules={[{ required: true, message: t('register.enterCode') }]}>
            <Input size="large" placeholder={t('register.enterCode')} inputMode="numeric"
              suffix={<button type="button" className="reg-getcode" onClick={onGetCode}>{t('register.getCode')}</button>} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('register.enterPassword') }, { min: 6, message: t('register.pwLen') }]}>
            <Input.Password size="large" placeholder={t('register.enterPassword')} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: t('register.enterPasswordAgain') },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (!v || getFieldValue('password') === v) return Promise.resolve()
                  return Promise.reject(new Error(t('register.pwdMismatch')))
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder={t('register.enterPasswordAgain')} autoComplete="new-password" />
          </Form.Item>

          <div className="reg-agree">
            <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)}>{t('register.agreePrefix')}</Checkbox>
            <button type="button" className="reg-agreement-link" onClick={() => setShowAgreement(true)}>{t('register.userAgreement')}</button>
          </div>

          <Button type="primary" htmlType="submit" size="large" block loading={busy} style={{ marginTop: '1.1rem' }}>
            {t('register.submit')}
          </Button>
        </Form>
        <p className="muted center" style={{ marginTop: 16 }}>
          {t('register.have')} <Link to="/login">{t('register.login')}</Link>
        </p>
      </Card>

      <Modal
        open={showAgreement}
        title={t('register.userAgreement')}
        onCancel={() => setShowAgreement(false)}
        footer={<Button type="primary" onClick={() => { setAgree(true); setShowAgreement(false) }}>{t('register.agreeBtn')}</Button>}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        <p className="reg-ag-intro">{agreement.intro}</p>
        {agreement.sections.map((sec) => (
          <div className="reg-ag-section" key={sec.h}>
            <h4 className="reg-ag-h">{sec.h}</h4>
            {sec.items.map((it, i) => <p className="reg-ag-p" key={i}>{it}</p>)}
          </div>
        ))}
      </Modal>
    </div>
  )
}
