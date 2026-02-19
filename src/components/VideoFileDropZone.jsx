import { useState, useCallback, useRef } from 'react'
import { Box, Paper, Typography, Button, useTheme } from '@mui/material'

const UploadIcon = ({ sx, ...props }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    sx={{ width: 56, height: 56, ...sx }}
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Box>
)

const VideoIcon = ({ sx, ...props }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    sx={{ width: 56, height: 56, ...sx }}
    {...props}
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </Box>
)

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
]

function isVideoFile(file) {
  return ACCEPTED_VIDEO_TYPES.includes(file.type) || /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(file.name)
}

export default function VideoFileDropZone({ onFileSelect }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const processFile = useCallback(
    (file) => {
      setError(null)
      if (!file) return
      if (!isVideoFile(file)) {
        setError('Please choose a video file (e.g. MP4, WebM, OGG, MOV, AVI).')
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
      onFileSelect?.(file)
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const file = e.dataTransfer?.files?.[0]
      processFile(file)
    },
    [processFile]
  )

  const handleFileInputChange = useCallback(
    (e) => {
      const file = e.target?.files?.[0]
      processFile(file)
      e.target.value = ''
    },
    [processFile]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    onFileSelect?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onFileSelect])

  return (
    <Paper
      elevation={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: error ? 'error.main' : isDragOver ? 'primary.main' : isDark ? 'grey.600' : 'grey.300',
        borderRadius: 3,
        bgcolor: error
          ? 'error.50'
          : isDragOver
            ? isDark
              ? 'rgba(37, 99, 235, 0.22)'
              : 'primary.50'
            : 'background.paper',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
        '&:hover':
          !selectedFile && !isDragOver && !error
            ? isDark
              ? { borderColor: 'grey.500', bgcolor: 'grey.800', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }
              : { borderColor: 'grey.400', bgcolor: 'grey.50', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
            : {},
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(',') + ',.mp4,.webm,.ogg,.mov,.avi'}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        aria-hidden
      />
      <Box
        sx={{
          py: 5,
          px: 3,
          textAlign: 'center',
          cursor: selectedFile ? 'default' : 'pointer',
        }}
        onClick={selectedFile ? undefined : handleClick}
      >
        {selectedFile ? (
          <>
            <VideoIcon sx={{ color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" color="text.primary" gutterBottom>
              {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleClick}>
                Choose another file
              </Button>
              <Button variant="outlined" onClick={handleClear}>
                Clear
              </Button>
            </Box>
          </>
        ) : (
          <>
            <UploadIcon
              sx={{ color: isDragOver ? 'primary.main' : 'text.secondary', mb: 1 }}
            />
            <Typography variant="h6" color="text.primary" gutterBottom>
              Select your video here, or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MP4, WebM, OGG, MOV, AVI
            </Typography>
          </>
        )}
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}
