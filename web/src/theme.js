// src/theme.js
const THEME_KEY = 'fb_theme'

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

export function applyTheme(theme = getTheme()) {
  document.documentElement.setAttribute('data-bs-theme', theme)
  return theme
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
  return next
}
