import { useEffect } from 'react'
import type { Theme } from './settings'

const THEME_COLORS = { light: '#fbfaf7', sepia: '#f4ecd8', dark: '#1c1b19' }
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function resolve(theme: Theme): keyof typeof THEME_COLORS {
  if (theme === 'system') return darkQuery.matches ? 'dark' : 'light'
  return theme
}

function apply(theme: Theme) {
  const resolved = resolve(theme)
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved])
  // Read by the inline script in index.html to avoid a flash on next launch.
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Storage may be unavailable; the theme still applies for this session.
  }
}

export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    const onChange = () => apply(theme)
    darkQuery.addEventListener('change', onChange)
    return () => darkQuery.removeEventListener('change', onChange)
  }, [theme])
}
