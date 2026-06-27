// App-wide constants.

// Support/chat link (used by the floating chat, deposit bank transfer,
// and the login contact action). LINE click-to-chat link.
export const LINE_URL = 'https://line.me/ti/p/YXavSXfRqc'

// Open an external URL in a new browser tab/window, reliably on both desktop and
// mobile. A programmatic anchor click is more robust than window.open(), which mobile
// browsers and popup blockers sometimes coerce into the current tab.
export function openExternal(url) {
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
