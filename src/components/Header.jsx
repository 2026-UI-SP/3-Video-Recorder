import { Link, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material'
import { useThemeMode } from '../context/ThemeModeContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
]

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

function Header() {
  const location = useLocation()
  const { mode, toggleMode } = useThemeMode()

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar sx={{ py: 1.25, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="span" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Video Recorder
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="nav" sx={{ display: 'flex', gap: 1 }}>
            {navLinks.map(({ to, label }) => (
              <Typography
                key={to}
                component={Link}
                to={to}
                color="inherit"
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textDecoration: 'none',
                  fontWeight: 500,
                  opacity: location.pathname === to ? 1 : 0.9,
                  bgcolor: location.pathname === to ? 'rgba(255,255,255,0.12)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)',
                    opacity: 1,
                  },
                  transition: 'background-color 0.2s ease, opacity 0.2s ease',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
          <IconButton
            onClick={toggleMode}
            aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            sx={{
              ml: 1,
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              '& .MuiTouchRipple-root': { color: 'white' },
            }}
          >
            {mode === 'light' ? <MoonIcon /> : <SunIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
