import { useTranslation } from 'react-i18next'
import { Card } from 'antd'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="container section">
      <h1 className="section-title">{t('menu.aboutUs')}</h1>

      <Card className="about-card">
        <h2 className="about-h">{t('about.profileTitle')}</h2>
        <p className="about-p">{t('about.profileBody')}</p>
      </Card>

      <Card className="about-card">
        <h2 className="about-h">{t('about.techTitle')}</h2>
        <p className="about-p">{t('about.techBody')}</p>
      </Card>

      <Card className="about-card">
        <h2 className="about-h">{t('about.advTitle')}</h2>

        <h3 className="about-sub">{t('about.adv1Title')}</h3>
        <p className="about-p">{t('about.adv1Body')}</p>

        <h3 className="about-sub">{t('about.adv2Title')}</h3>
        <p className="about-p">{t('about.adv2Body')}</p>

        <h3 className="about-sub">{t('about.adv3Title')}</h3>
        <p className="about-p">{t('about.adv3Body')}</p>

        <h3 className="about-sub">{t('about.adv4Title')}</h3>
        <p className="about-p">{t('about.adv4Body')}</p>
      </Card>
    </div>
  )
}
