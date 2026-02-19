import { createTheme } from '@mui/material/styles'

const getTheme = (mode) => {
  const resolvedMode = mode === 'dark' ? 'dark' : 'light'
  return createTheme({
    palette: {
      mode: resolvedMode,
      primary: {
        main: '#2563eb',
        light: '#3b82f6',
        dark: '#1d4ed8',
        contrastText: '#fff',
        50: '#eff6ff',
      },
      secondary: {
        main: '#323232',
        light: '#5c5c5c',
        dark: '#1a1a1a',
      },
      ...(resolvedMode === 'dark' && {
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
      }),
      ...(resolvedMode === 'light' && {
        background: {
          default: '#f5f7fa',
          paper: '#ffffff',
        },
      }),
      error: {
        main: '#d32f2f',
        50: resolvedMode === 'light' ? '#ffebee' : 'rgba(211, 47, 47, 0.16)',
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: resolvedMode === 'light' ? '0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            boxShadow: resolvedMode === 'light' ? '0 1px 0 rgba(0,0,0,0.06)' : '0 1px 0 rgba(0,0,0,0.2)',
          },
        },
      },
    },
  })
}

export default getTheme
