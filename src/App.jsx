import { Routes, Route } from 'react-router-dom'
import { Container } from '@mui/material'
import Header from './components/Header'
import Home from './pages/Home'
import Annotations from './pages/Annotations'
import About from './pages/About'
import './App.css'

function App() {
  return (
    <>
      <Header />
      <Container sx={{ mt: 2, px: { xs: 2, sm: 3 } }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/annotations" element={<Annotations />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Container>
    </>
  )
}

export default App
