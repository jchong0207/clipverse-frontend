import { useTranslation } from 'react-i18next'

// Orders page: currently shows the "under review" applying state.
export default function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className="container section">
      <div className="applying">
        <svg className="applying-icon" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="applyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1f6dff" />
              <stop offset="1" stopColor="#36b0ff" />
            </linearGradient>
          </defs>
          <path d="M20 4 H80 A16 16 0 0 1 96 20 V96 L50 74 L4 96 V20 A16 16 0 0 1 20 4 Z" fill="url(#applyGrad)" />
          <path d="M33 47 L50 34 L67 47" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="applying-title">{t('orders.applyingTitle')}</h1>
        <p className="applying-sub">{t('orders.applyingBody')}</p>
      </div>
    </div>
  )
}
