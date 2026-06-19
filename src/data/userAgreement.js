// User Agreement (provided by the platform owner), localized per language.
// Each JSON has the shape: { intro: string, sections: [ { h: string, items: string[] } ] }
import en from './agreements/en.json'
import ko from './agreements/ko.json'
import ja from './agreements/ja.json'
import ar from './agreements/ar.json'
import ms from './agreements/ms.json'
import vi from './agreements/vi.json'
import es from './agreements/es.json'
import id from './agreements/id.json'
import zhTW from './agreements/zh-TW.json'

const AGREEMENTS = { en, ko, ja, ar, ms, vi, es, id, 'zh-TW': zhTW }

// Pick the agreement for the active language, falling back to English.
export function getUserAgreement(lng) {
  if (!lng) return en
  return AGREEMENTS[lng] || AGREEMENTS[String(lng).split('-')[0]] || en
}
