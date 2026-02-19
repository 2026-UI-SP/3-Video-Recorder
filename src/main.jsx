import { StrictMode, useMemo, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import getTheme from './theme'
import { ThemeModeProvider, useThemeMode } from './context/ThemeModeContext'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 600 }}>
          <h1>Something went wrong</h1>
          <pre style={{ overflow: 'auto', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function ThemedApp() {
  const { mode } = useThemeMode()
  const theme = useMemo(() => getTheme(mode), [mode])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <ThemeModeProvider>
            <ThemedApp />
          </ThemeModeProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}
