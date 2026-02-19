import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'video-recorder-theme-mode'

function normalizeMode(value) {
  if (value === 'dark' || value === 'light') return value
  return 'light'
}

const ThemeModeContext = createContext(null)

export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return normalizeMode(localStorage.getItem(STORAGE_KEY) || 'light')
  })

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  const setMode = useCallback((next) => {
    const normalized = typeof next === 'function' ? normalizeMode(next(mode)) : normalizeMode(next)
    setModeState(normalized)
    localStorage.setItem(STORAGE_KEY, normalized)
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [setMode])

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider')
  return ctx
}
