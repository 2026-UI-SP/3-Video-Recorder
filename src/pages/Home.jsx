import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Box, Button } from '@mui/material'
import VideoFileDropZone from '../components/VideoFileDropZone'

function Home() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileSelect = (file) => {
    setSelectedFile(file ?? null)
  }

  const handleProceed = () => {
    if (selectedFile) {
      navigate('/annotations', { state: { videoFile: selectedFile } })
    }
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary', textAlign: 'center' }}
      >
        Add a video to get started
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6, textAlign: 'center' }}>
        Select a video to create timestamp entries, add labels and descriptions, and export your annotations as CSV.
      </Typography>
      <Typography
        variant="caption"
        component="p"
        sx={{
          mb: 3,
          textAlign: 'center',
          fontStyle: 'italic',
          color: 'text.secondary',
          opacity: 0.85,
        }}
      >
        Files stay on your device and are not uploaded to any server.
      </Typography>
      <VideoFileDropZone onFileSelect={handleFileSelect} />
      {selectedFile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="contained" size="large" onClick={handleProceed}>
            Begin Annotation
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default Home
