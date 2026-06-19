import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import ko from './locales/ko.json'
import ja from './locales/ja.json'
import ar from './locales/ar.json'
import ms from './locales/ms.json'
import vi from './locales/vi.json'
import es from './locales/es.json'
import id from './locales/id.json'
import zhTW from './locales/zh-TW.json'

// Add a language by dropping in a JSON file and registering it here.
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'es', label: 'Español' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'zh-TW', label: '繁體中文' },
]

// Layout is locked to LTR for every language (per design choice), so Arabic text
// is translated but the layout does not flip to RTL. To re-enable proper RTL
// mirroring for Arabic etc., add the codes back here, e.g. ['ar', 'he', 'fa', 'ur'].
const RTL_LANGS = []

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      ja: { translation: ja },
      ar: { translation: ar },
      ms: { translation: ms },
      vi: { translation: vi },
      es: { translation: es },
      id: { translation: id },
      'zh-TW': { translation: zhTW },
    },
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ct_lang',
    },
  })

// Apply text direction (RTL for the codes listed above) and lang attribute.
function applyDir(lng) {
  const base = (lng || 'en').split('-')[0]
  const dir = RTL_LANGS.includes(base) ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', lng || 'en')
}
applyDir(i18n.resolvedLanguage)
i18n.on('languageChanged', applyDir)

export default i18n
