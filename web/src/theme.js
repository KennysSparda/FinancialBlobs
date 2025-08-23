const THEME_KEY = 'fb_theme_mode' // 'light' | 'dark' | 'auto'
let mediaQuery

export function getThemeMode() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

export function resolveTheme(mode = getThemeMode()) {
  if (mode === 'auto') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }
  return mode
}

export function applyTheme(mode = getThemeMode()) {
  const theme = resolveTheme(mode)
  document.documentElement.setAttribute('data-bs-theme', theme)
  document.documentElement.setAttribute('data-theme-mode', mode)

  // quando "auto", escuta mudança do SO
  if (mediaQuery) mediaQuery.onchange = null
  if (mode === 'auto' && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.onchange = () => applyTheme('auto')
  }
  return theme
}

export function setThemeMode(mode) {
  localStorage.setItem(THEME_KEY, mode)
  applyTheme(mode)
  return mode
}
