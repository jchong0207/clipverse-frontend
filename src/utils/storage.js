// Small localStorage JSON helpers shared across pages that persist form state.
export const loadJSON = (key, fallback = {}) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export const saveJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* noop */ }
}
