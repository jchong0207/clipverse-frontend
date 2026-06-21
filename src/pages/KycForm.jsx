import { useRef, useState } from 'react'
import SubPageHeader from '../components/SubPageHeader.jsx'
import { useTranslation } from 'react-i18next'
import { App, Dropdown } from 'antd'
import { DownOutlined, SafetyCertificateFilled, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { flagSrc } from '../data/fiatCurrencies.js'
import { DOC_SAMPLES, DocFrontSample } from '../components/kycSamples.jsx'

// Countries selectable for verification (flag asset must exist in /public/assets/flags).
const COUNTRIES = [
  { code: 'US', cc: 'us', name: 'United States' },
  { code: 'GB', cc: 'gb', name: 'United Kingdom' },
  { code: 'CA', cc: 'ca', name: 'Canada' },
  { code: 'AU', cc: 'au', name: 'Australia' },
  { code: 'SG', cc: 'sg', name: 'Singapore' },
  { code: 'MY', cc: 'my', name: 'Malaysia' },
  { code: 'ID', cc: 'id', name: 'Indonesia' },
  { code: 'VN', cc: 'vn', name: 'Vietnam' },
  { code: 'TH', cc: 'th', name: 'Thailand' },
  { code: 'PH', cc: 'ph', name: 'Philippines' },
  { code: 'JP', cc: 'jp', name: 'Japan' },
  { code: 'KR', cc: 'kr', name: 'South Korea' },
  { code: 'TW', cc: 'tw', name: 'Taiwan' },
  { code: 'HK', cc: 'hk', name: 'Hong Kong' },
  { code: 'CN', cc: 'cn', name: 'China' },
]

const DOC_TYPES = ['idCard', 'passport', 'driverLicense']

// The three required document shots, in display order.
const SLOTS = ['front', 'back', 'handheld']

export default function KycForm({ onSubmitted }) {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const fileRefs = { front: useRef(null), back: useRef(null), handheld: useRef(null) }

  const [countryCode, setCountryCode] = useState('US')
  const [docType, setDocType] = useState('idCard')
  const [photos, setPhotos] = useState({ front: null, back: null, handheld: null })
  const [submitting, setSubmitting] = useState(false)

  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0]

  const onFile = (slot) => (e) => {
    const f = e.target.files?.[0]
    if (f) setPhotos((p) => ({ ...p, [slot]: URL.createObjectURL(f) }))
  }

  const submit = async () => {
    if (!photos.front || !photos.back || !photos.handheld) {
      message.error(t('kyc.form.uploadAll'))
      return
    }
    setSubmitting(true)
    try {
      await onSubmitted?.({ country: country.code, docType })
      message.success(t('kyc.form.submitted'))
    } catch {
      message.error(t('kyc.form.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const countryMenu = {
    selectable: true,
    selectedKeys: [countryCode],
    onClick: ({ key }) => setCountryCode(key),
    items: COUNTRIES.map((c) => ({
      key: c.code,
      label: c.name,
      icon: <img className="kf-flag" src={flagSrc(c.cc)} alt="" />,
    })),
  }
  const docMenu = {
    selectable: true,
    selectedKeys: [docType],
    onClick: ({ key }) => setDocType(key),
    items: DOC_TYPES.map((d) => ({ key: d, label: t(`kyc.form.docTypes.${d}`) })),
  }

  return (
    <div className="subpage kyc-form">
      <SubPageHeader title={t('kyc.form.title')} />

      <div className="kf-hero">
        <div className="kf-hero-title">{t('kyc.form.heading')}</div>
        <span className="kf-shield"><SafetyCertificateFilled /></span>
      </div>

      <div className="kf-body">
        <div className="kf-field">
          <label className="kf-label">{t('kyc.form.country')}</label>
          <Dropdown trigger={['click']} menu={countryMenu}>
            <button type="button" className="kf-select">
              <img className="kf-flag" src={flagSrc(country.cc)} alt="" />
              <span className="kf-select-text">{country.name}</span>
              <DownOutlined className="kf-caret" />
            </button>
          </Dropdown>
        </div>

        <div className="kf-field">
          <label className="kf-label">{t('kyc.form.docType')}</label>
          <Dropdown trigger={['click']} menu={docMenu}>
            <button type="button" className="kf-select">
              <span className="kf-select-text">{t(`kyc.form.docTypes.${docType}`)}</span>
              <DownOutlined className="kf-caret" />
            </button>
          </Dropdown>
        </div>

        <div className="kf-field">
          <label className="kf-label">{t('kyc.form.photos')}</label>
          <p className="kf-hint">{t('kyc.form.photosHint')}</p>
          <div className="kf-uploads">
            {SLOTS.map((slot) => {
              const Sample = DOC_SAMPLES[slot]
              return (
                <div key={slot} className="kf-upload">
                  <button type="button" className="kf-upbox" onClick={() => fileRefs[slot].current?.click()}>
                    {photos[slot]
                      ? <img className="kf-upimg" src={photos[slot]} alt="" />
                      : <span className="kf-sample"><Sample /><span className="kf-plus">+</span></span>}
                  </button>
                  <span className="kf-upcap">{t(`kyc.form.slots.${slot}`)}</span>
                  <input ref={fileRefs[slot]} type="file" accept="image/*" hidden onChange={onFile(slot)} />
                </div>
              )
            })}
          </div>
        </div>

        <div className="kf-field">
          <label className="kf-label">{t('kyc.form.requirements')}</label>
          <p className="kf-hint">{t('kyc.form.requirementsHint')}</p>
          <div className="kf-examples">
            {[true, false, false].map((ok, i) => (
              <div className={`kf-example ${ok ? 'ok' : 'bad'}`} key={i}>
                <div className="kf-example-card"><DocFrontSample /></div>
                <span className="kf-example-badge">
                  {ok ? <CheckCircleFilled /> : <CloseCircleFilled />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wd-footer">
        <button type="button" className="wd-submit" disabled={submitting} onClick={submit}>
          {submitting ? t('kyc.form.submitting') : t('kyc.form.submit')}
        </button>
      </div>
    </div>
  )
}
