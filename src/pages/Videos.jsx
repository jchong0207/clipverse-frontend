import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, App } from 'antd'
import {
  CloudUploadOutlined, GlobalOutlined, ProfileOutlined, UploadOutlined, DownOutlined,
  LinkOutlined, PlaySquareOutlined, CloseOutlined, CheckOutlined,
} from '@ant-design/icons'

const MAX_UPLOAD_SECS = 90 // uploads must be 90 seconds or shorter

const fmt = (s) => {
  if (!s || !isFinite(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// 👉 EDIT THIS: seed list shown before any upload. `thumb` is any CSS background.
const SEED = [
  { id: 'v1', title: '去了日本才知道🇯🇵動漫不是假的😲', duration: '00:44', language: 'Traditional Chinese', thumb: 'linear-gradient(135deg, #c3d3e2 0%, #7e96ad 55%, #d9534f 130%)' },
  { id: 'v2', title: '🇰🇷그가 너를 차갑게 만들었다면, 차라리 한국에 와라', duration: '00:23', language: 'Korean', thumb: 'linear-gradient(135deg, #f6d365 0%, #3aa0a0 60%, #2d3436 130%)' },
  { id: 'v3', title: '街頭美食大挑戰 🍜 一天吃十家', duration: '01:02', language: 'Simplified Chinese', thumb: 'linear-gradient(135deg, #fda085 0%, #f6d365 60%, #b91c1c 130%)' },
]

const LANGS = [
  'English', 'Korean', 'Japanese', 'Thai', 'Vietnamese', 'Spanish', 'Indonesian', 'Traditional Chinese',
]

// 👉 "Video Source" grid — real brand logos bundled in /public/assets/sources/.
// Most are <key>.png; bilibili uses a clean SVG; roposo has no available logo so it falls back to a text chip.
const SOURCES = [
  { k: 'youtube' }, { k: 'tiktok' }, { k: 'instagram' }, { k: 'x' }, { k: 'facebook' },
  { k: 'zalo' }, { k: 'ok' }, { k: 'snapchat' }, { k: 'kakao' }, { k: 'bilibili', img: '/assets/sources/bilibili.svg' },
  { k: 'weibo' }, { k: 'momo' }, { k: 'vk' }, { k: 'rutube' }, { k: 'yappy' },
  { k: 'moj' }, { k: 'josh' }, { k: 'roposo', text: 'roposo', bg: '#3B0A57', color: '#fff' },
].map((s) => ({ img: `/assets/sources/${s.k}.png`, ...s }))

// Center the trailing (incomplete) row of the 5-column source grid.
const SRC_COLS = 5
const SRC_REM = SOURCES.length % SRC_COLS
const SRC_LAST_ROW_START = SRC_REM ? SOURCES.length - SRC_REM : -1
const SRC_LAST_ROW_OFFSET = SRC_REM ? Math.floor((SRC_COLS - SRC_REM) / 2) : 0

export default function Videos() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const fileRef = useRef(null)
  const idRef = useRef(0)
  const [videos, setVideos] = useState(SEED)

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('file') // 'link' | 'file'
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [lang, setLang] = useState('English')
  const [file, setFile] = useState(null)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  // Close the language dropdown when clicking outside it.
  useEffect(() => {
    if (!langOpen) return
    const onDown = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [langOpen])

  const resetForm = () => { setTab('file'); setTitle(''); setUrl(''); setLang('English'); setFile(null); setLangOpen(false) }
  const close = () => { setOpen(false); resetForm() }

  // Open the import modal straight away when navigated here via "Import Video".
  useEffect(() => {
    if (location.state?.openImport) setOpen(true)
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

  // Read a picked video locally: add once metadata loads, upgrade thumbnail when a frame is grabbable.
  const processFile = (f, finalTitle, language) => {
    const objUrl = URL.createObjectURL(f)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = objUrl
    const id = `up-${idRef.current++}`
    const gradient = 'linear-gradient(135deg, #a1c4fd 0%, #45aaf2 60%, #2d3436 130%)'
    let added = false
    const ensure = (duration) => {
      if (added) return
      added = true
      setVideos((prev) => [{ id, title: finalTitle, duration, language, thumb: gradient }, ...prev])
    }
    video.onloadedmetadata = () => {
      if (isFinite(video.duration) && video.duration > MAX_UPLOAD_SECS) {
        message.error(t('video.tooLong'))
        URL.revokeObjectURL(objUrl)
        return
      }
      ensure(fmt(video.duration))
      try { video.currentTime = Math.min(1, (video.duration || 2) / 2) } catch { /* noop */ }
    }
    video.onseeked = () => {
      try {
        const c = document.createElement('canvas')
        const w = 320
        const ratio = video.videoHeight / video.videoWidth || 0.7
        c.width = w
        c.height = Math.round(w * ratio)
        c.getContext('2d').drawImage(video, 0, 0, c.width, c.height)
        const thumb = `center / cover no-repeat url(${c.toDataURL('image/jpeg', 0.7)})`
        setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, thumb } : v)))
      } catch { /* keep gradient */ }
      URL.revokeObjectURL(objUrl)
    }
    video.onerror = () => { ensure('00:00'); URL.revokeObjectURL(objUrl) }
  }

  const onPick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    // Reject anything longer than 90 seconds before accepting the file.
    const url = URL.createObjectURL(f)
    const probe = document.createElement('video')
    probe.preload = 'metadata'
    probe.src = url
    probe.onloadedmetadata = () => {
      const dur = probe.duration
      URL.revokeObjectURL(url)
      if (isFinite(dur) && dur > MAX_UPLOAD_SECS) { message.error(t('video.tooLong')); return }
      setFile(f)
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    }
    probe.onerror = () => { URL.revokeObjectURL(url); message.error(t('video.cannotRead')) }
  }

  const canApply = tab === 'file' ? !!file : !!url.trim()

  const apply = () => {
    if (!canApply) return
    if (tab === 'file') {
      processFile(file, title.trim() || file.name.replace(/\.[^.]+$/, ''), lang)
    } else {
      let name = title.trim()
      if (!name) { try { name = new URL(url).hostname.replace(/^www\./, '') } catch { name = url.trim() } }
      setVideos((prev) => [{
        id: `link-${idRef.current++}`, title: name, duration: '00:00', language: lang,
        thumb: 'linear-gradient(135deg, #c3d3e2 0%, #7e96ad 55%, #d9534f 130%)',
      }, ...prev])
    }
    close()
  }

  return (
    <div className="container section">
      <button type="button" className="vid-drop" onClick={() => setOpen(true)}>
        <CloudUploadOutlined /> <span>{t('video.import')}</span>
      </button>

      <div className="vid-head">
        <h2 className="vid-count">{t('video.listTitle')}({videos.length})</h2>
        <Button className="vid-review" icon={<ProfileOutlined />} onClick={() => navigate('/review-content')}>{t('video.reviewContent')}</Button>
      </div>

      <div className="vid-list">
        {videos.map((v) => (
          <div className="vid-card" key={v.id}>
            <div className="vid-top">
              <div className="vid-thumb" style={{ background: v.thumb }} />
              <div className="vid-info">
                <div className="vid-title">{v.title}</div>
                <div className="vid-meta">
                  <span className="vid-dur">{v.duration}</span>
                  <span className="vid-lang"><GlobalOutlined /> {v.language}</span>
                </div>
              </div>
            </div>
            <div className="vid-foot">
              <Button type="primary" className="vid-promote" onClick={() => navigate('/promotion')}>
                {t('video.startPromote')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="iv-overlay" role="dialog" aria-modal="true" onClick={close}>
          <div className="iv-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="iv-close" onClick={close} aria-label="Close"><CloseOutlined /></button>

            <div className="iv-header">
              <svg className="iv-cloud" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden="true">
                <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
              </svg>
              <h2 className="iv-title">{t('video.import')}</h2>
            </div>

            <div className="iv-tabs">
              <button className={`iv-tab ${tab === 'link' ? 'active' : ''}`} onClick={() => setTab('link')}>{t('video.importLink')}</button>
              <button className={`iv-tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>{t('video.fileUpload')}</button>
            </div>

            {tab === 'file' ? (
              <>
                <button type="button" className="iv-upload" onClick={() => fileRef.current?.click()}>
                  <UploadOutlined /> <span>{file ? file.name : t('video.clickToUpload')}</span>
                </button>
                <input ref={fileRef} type="file" accept="video/*" hidden onChange={onPick} />
                <p className="iv-hint">{t('video.maxLen')}</p>
                <div className="iv-field">
                  <PlaySquareOutlined className="iv-fic" />
                  <input className="iv-inp" placeholder={t('video.enterTitle')} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="iv-field">
                <LinkOutlined className="iv-fic" />
                <input className="iv-inp" placeholder={t('video.videoUrl')} value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            )}

            <div className="iv-dd" ref={langRef}>
              <button type="button" className="iv-dd-trigger" onClick={() => setLangOpen((o) => !o)}>
                <GlobalOutlined className="iv-fic" />
                <span className="iv-dd-value">{lang}</span>
                <DownOutlined className={`iv-caret ${langOpen ? 'iv-caret-open' : ''}`} />
              </button>
              {langOpen && (
                <ul className="iv-dd-menu">
                  {LANGS.map((l) => (
                    <li key={l}>
                      <button type="button" className={`iv-dd-item ${l === lang ? 'active' : ''}`}
                        onClick={() => { setLang(l); setLangOpen(false) }}>
                        <span>{l}</span>{l === lang && <CheckOutlined />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="button" className="iv-apply" onClick={apply}>
              {t('video.applyImport')}
            </button>

            <div className="iv-source-label">- {t('video.videoSource')} -</div>
            <div className="iv-sources">
              {SOURCES.map((s, idx) => (
                <span key={s.k} className="iv-src"
                  style={{ ...(s.bg ? { background: s.bg } : null), ...(idx === SRC_LAST_ROW_START ? { gridColumnStart: SRC_LAST_ROW_OFFSET + 1 } : null) }}>
                  {s.text
                    ? <span className="iv-src-text" style={{ color: s.color }}>{s.text}</span>
                    : <img src={s.img} alt={s.k} loading="lazy" />}
                </span>
              ))}
            </div>

            <div className="iv-help">
              <h3 className="iv-help-title">{t('video.help.title')}</h3>
              {['1', '2', '3'].map((n) => (
                <div className="iv-help-item" key={n}>
                  <div className="iv-help-h">{t(`video.help.s${n}t`)}</div>
                  <p className="iv-help-b">{t(`video.help.s${n}b`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
