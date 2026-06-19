import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/auth.jsx'
import {
  ImportOutlined, TranslationOutlined, SoundOutlined, NotificationOutlined,
} from '@ant-design/icons'
import HomeAnnouncement from '../components/HomeAnnouncement.jsx'

const FEATURES = [
  { img: '/assets/img/AudioSummarization-1778224829196-c2ef1d74.png', icon: <ImportOutlined />, title: 'importTitle', sub: 'importSub', c: '#7c3aed', bg: '#f3ecff' },
  { img: '/assets/img/High-AccuracyVideoTranslation-1778224829196-869f9d88.png', icon: <TranslationOutlined />, title: 'accuracyTitle', sub: 'accuracySub', c: '#0ea5a3', bg: '#e6fbfa' },
  { img: '/assets/img/TranslateBothVoiceovers-1778224829196-a07049db.png', icon: <SoundOutlined />, title: 'voiceTitle', sub: 'voiceSub', c: '#f59e0b', bg: '#fff5e6' },
]

// Supported languages shown as scrolling chips (4 rows). cc = /assets/flags/<cc>.svg
const LANG_ROWS = [
  [['English', 'us'], ['Chinese', 'cn'], ['French', 'fr'], ['Korean', 'kr']],
  [['German', 'de'], ['Japanese', 'jp'], ['Portuguese', 'pt'], ['Malay', 'my']],
  [['Italian', 'it'], ['Spanish', 'es'], ['Arabic', 'ae'], ['Thai', 'th']],
  [['Hindi', 'in'], ['Russian', 'ru'], ['Dutch', 'nl'], ['Vietnamese', 'vn']],
]

export default function Home() {
  const { user } = useAuth()
  const { t } = useTranslation()
  // Try Now: go to the video section if logged in, otherwise to login/register
  const ctaTo = user ? '/videos' : '/login'
  // Optional licensed background video at /public/assets/video/hero.mp4; falls back to animated CSS water.
  const [showVideo, setShowVideo] = useState(true)
  const rootRef = useRef(null)

  // Scroll-reveal: fade/slide elements in as they enter the viewport.
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('.reveal') || []
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.18 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="lp" ref={rootRef}>
      <HomeAnnouncement />

      <section className="lp-hero">
        {showVideo && (
          <video className="lp-hero-video" autoPlay muted loop playsInline preload="auto" onError={() => setShowVideo(false)}>
            <source src="/assets/video/hero.mp4" type="video/mp4" />
          </video>
        )}
        <div className="lp-hero-inner reveal">
          <h1 className="lp-hero-title"><span className="lp-hero-strong">{t('home.heroTitle1')}</span>{t('home.heroTitle2')}</h1>
          <p className="lp-hero-sub">{t('home.heroSub')}</p>
          <Link to={ctaTo} className="lp-hero-btn">{t('home.tryNow')}</Link>
        </div>
      </section>

      <section className="lp-langs reveal">
        <h2 className="lp-feature-title">{t('home.langTitle')}</h2>
        <p className="lp-feature-sub">{t('home.langSub')}</p>
        <div className="lp-marquee">
          {LANG_ROWS.map((row, ri) => (
            <div className={`lp-mq-row ${ri % 2 ? 'rev' : ''}`} key={ri}>
              <div className="lp-mq-track">
                {[...row, ...row, ...row].map(([name, cc], i) => (
                  <span className="lp-chip" key={i}>
                    <img className="lp-chip-flag" src={`/assets/flags/${cc}.svg`} alt="" />{name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {FEATURES.map((f) => (
        <section className="lp-feature reveal" key={f.title}>
          <img className="lp-feature-img" src={f.img} alt="" loading="lazy" />
          <div className="lp-feature-ico" style={{ color: f.c, background: f.bg }}>{f.icon}</div>
          <h2 className="lp-feature-title">{t(`home.${f.title}`)}</h2>
          <p className="lp-feature-sub">{t(`home.${f.sub}`)}</p>
        </section>
      ))}

      <section className="lp-feature reveal">
        <img className="lp-feature-img" src="/assets/img/aiImage-1778224829196-5bc3563a.png" alt="" loading="lazy" />
        <div className="lp-feature-ico" style={{ color: '#e11d8f', background: '#fdeaf5' }}><NotificationOutlined /></div>
        <h2 className="lp-feature-title">{t('home.adTitle')}</h2>
        <p className="lp-feature-sub">{t('home.adSub')}</p>
        <Link to={ctaTo} className="lp-hero-btn lp-feature-btn">{t('home.tryNow')}</Link>
      </section>

      <section className="lp-cta reveal">
        <img className="lp-cta-logo" src="/assets/img/clipverse-logo.png" alt="ClipVerse" />
        <h2 className="lp-cta-title">{t('home.ctaTitle')}</h2>
        <p className="lp-cta-sub">{t('home.ctaSub')}</p>
      </section>
    </div>
  )
}
