import { useRef, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Typography,
  Box,
  Paper,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import videojs from '../videojs-setup'
// Load markers plugin after videojs is on window (see videojs-setup.js)
import 'videojs-markers/dist/videojs-markers.js'

const LABEL_COLORS = [
  '#e53935', // red
  '#fb8c00', // orange
  '#43a047', // green
  '#1e88e5', // blue
  '#8e24aa', // purple
  '#d81b60', // hot pink
  '#00897b', // teal
  '#f4511e', // deep orange
  '#00acc1', // cyan
  '#5e35b1', // deep purple
]

function Annotations() {
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [labels, setLabels] = useState([])
  const [addLabelOpen, setAddLabelOpen] = useState(false)
  const [labelName, setLabelName] = useState('')
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [addAnnotationOpen, setAddAnnotationOpen] = useState(false)
  const [annotationType, setAnnotationType] = useState('point')
  const [annotationLabelId, setAnnotationLabelId] = useState('')
  const [annotationNotes, setAnnotationNotes] = useState('')
  const [annotationStartTime, setAnnotationStartTime] = useState(0)
  const [annotationEndTime, setAnnotationEndTime] = useState(0)
  const [removingAnnotationId, setRemovingAnnotationId] = useState(null)

  const videoFile = location.state?.videoFile // Get the video file from the location state

  useEffect(() => {
    if (!videoFile) return
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return

    const player = videojs(videoRef.current, {
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{ src: videoUrl, type: videoFile?.type || 'video/mp4' }],
    })

    playerRef.current = player

    const onTimeUpdate = () => setCurrentTime(player.currentTime())
    const onDurationChange = () => setDuration(player.duration())

    player.on('timeupdate', onTimeUpdate)
    player.on('durationchange', onDurationChange)

    player.ready(() => {
      player.markers({
        markers: [],
        markerTip: {
          display: true,
          text: (marker) => marker.text || '',
          time: (marker) => marker.time,
        },
        markerStyle: {
          width: '8px',
          'border-radius': '30%',
          'background-color': '#2563eb',
        },
      })
    })

    return () => {
      player.off('timeupdate', onTimeUpdate)
      player.off('durationchange', onDurationChange)
      if (player.markers && typeof player.markers.destroy === 'function') {
        player.markers.destroy()
      }
      player.dispose()
      playerRef.current = null
    }
  }, [videoUrl, videoFile?.type])

  // Sync annotations to videojs-markers on the player progress bar
  useEffect(() => {
    const player = playerRef.current
    if (!player?.markers?.reset) return
    const markerList = annotations.map((a) => ({
      time: a.start,
      text: [a.labelName, a.notes].filter(Boolean).join(' – ') || a.labelName,
    }))
    player.markers.reset(markerList)
  }, [annotations])

  // Open the add label dialog
  const openAddLabel = () => {
    setLabelName('')
    setLabelColor(LABEL_COLORS[0])
    setAddLabelOpen(true)
  }

  const closeAddLabel = () => {
    setAddLabelOpen(false)
  }

  // Create a new label
  const handleCreateLabel = () => {
    const trimmed = labelName.trim()
    if (!trimmed) return
    setLabels((prev) => [...prev, { id: crypto.randomUUID(), name: trimmed, color: labelColor }])
    closeAddLabel()
  }

  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Open the add annotation dialog
  const openAddAnnotation = () => {
    if (playerRef.current) {
      const t = playerRef.current.currentTime()
      setCurrentTime(t)
      setAnnotationStartTime(t)
      setAnnotationEndTime(t)
    }
    setAnnotationLabelId('')
    setAnnotationNotes('')
    setAnnotationType('point')
    setAddAnnotationOpen(true)
  }

  // Close the add annotation dialog
  const closeAddAnnotation = () => {
    setAddAnnotationOpen(false)
  }

  // Seek to a specific time on the timeline
  const handleTimelineSeek = (e) => {
    if (!playerRef.current || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    playerRef.current.currentTime(pct * duration)
  }

  // Add an annotation to the video
  const handleAddAnnotation = () => {
    const label = labels.find((l) => l.id === annotationLabelId)
    if (!label) return
    const start = annotationStartTime
    const end = annotationType === 'range' ? annotationEndTime : annotationStartTime
    const annotation = {
      id: crypto.randomUUID(),
      type: annotationType,
      start,
      end,
      labelId: label.id,
      labelName: label.name,
      labelColor: label.color,
      notes: annotationNotes.trim() || undefined,
    }
    setAnnotations((prev) => [...prev, annotation])
    closeAddAnnotation()
  }

  // Export annotations to CSV
  const handleExportCsv = () => {
    const header = 'start,end,label,description\n'
    const rows = annotations.map((a) => `${a.start},${a.end},${a.labelName || ''},${a.notes || ''}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url 
    const baseName =
      (videoFile?.name && videoFile.name.replace(/\.[^/.]+$/, '')) || 'annotations'
    a.download = `${baseName}-annotations.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteAnnotation = (id) => {
    setRemovingAnnotationId(id)
    window.setTimeout(() => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id))
      setRemovingAnnotationId((current) => (current === id ? null : current))
    }, 180)
  }

  if (!videoFile) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No video selected
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Select a video
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Video Annotator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Annotate your video with labels
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left panel - Labels */}
        <Paper sx={{ p: 2, width: { md: 260 }, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Labels
              </Typography>
              <Tooltip title="Create custom labels with colors to categorize your video annotations. Labels can be applied to specific timestamps or time ranges during playback.">
                <Box
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: 'text.secondary',
                  }}
                >
                  i
                </Box>
              </Tooltip>
            </Box>
            <Button variant="contained" size="small" disableElevation onClick={openAddLabel}>
              + Add Label
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {labels.length === 0 ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  No labels yet
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Create labels to start annotating
                </Typography>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {labels.map((label) => (
                  <Box
                    key={label.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: label.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">{label.name}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Add Annotation section - only when labels exist */}
          {labels.length > 0 && (
            <Paper sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'primary.light' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Add Annotation
                </Typography>
              <Tooltip title="Add a timestamp or time range with a label and optional notes.">
                <Box
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: 'text.secondary',
                  }}
                >
                  i
                </Box>
                </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current time: {formatTime(currentTime)}
              </Typography>
              <Button variant="contained" fullWidth onClick={openAddAnnotation}>
                + Add Annotation at Current Time
              </Button>
            </Paper>
          )}
        </Paper>

        {/* Add Annotation dialog */}
        <Dialog open={addAnnotationOpen} onClose={closeAddAnnotation} maxWidth="xs" fullWidth>
          <DialogTitle>Add Annotation</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current time: {formatTime(currentTime)}
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
              Start time (seconds)
            </Typography>
            <TextField
              fullWidth
              type="number"
              size="small"
              value={annotationStartTime}
              onChange={(e) => setAnnotationStartTime(Number(e.target.value) || 0)}
              inputProps={{ min: 0, step: 0.1 }}
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
              Annotation Type
            </Typography>
            <ToggleButtonGroup
              value={annotationType}
              exclusive
              onChange={(_, v) => v != null && setAnnotationType(v)}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="point">Point in Time</ToggleButton>
              <ToggleButton value="range">Time Range</ToggleButton>
            </ToggleButtonGroup>
            {annotationType === 'range' && (
              <>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                  End time (seconds)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  value={annotationEndTime}
                  onChange={(e) => setAnnotationEndTime(Number(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.1 }}
                  sx={{ mb: 2 }}
                />
              </>
            )}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
              Select Label
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="annotation-label-label">Choose a label...</InputLabel>
              <Select
                labelId="annotation-label-label"
                value={annotationLabelId}
                label="Choose a label..."
                onChange={(e) => setAnnotationLabelId(e.target.value)}
              >
                {labels.map((label) => (
                  <MenuItem key={label.id} value={label.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: label.color,
                        }}
                      />
                      {label.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
              Notes (optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add any additional notes..."
              value={annotationNotes}
              onChange={(e) => setAnnotationNotes(e.target.value)}
              variant="outlined"
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
            <Button onClick={closeAddAnnotation}>Cancel</Button>
            <Button variant="contained" onClick={handleAddAnnotation} disabled={!annotationLabelId}>
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Label dialog */}
        <Dialog open={addLabelOpen} onClose={closeAddLabel} maxWidth="xs" fullWidth>
          <DialogTitle>Add Label Dialogue</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1, mb: 0.5 }}>
              Label Name
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g. Smile, Surprise"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              inputProps={{ 'aria-label': 'Label name' }}
            />
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {LABEL_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setLabelColor(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: '3px solid',
                    borderColor: labelColor === color ? 'grey.800' : 'transparent',
                    '&:hover': { opacity: 0.9 },
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
            <Button onClick={closeAddLabel} sx={{ bgcolor: 'grey.200', color: 'grey.800' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreateLabel} disabled={!labelName.trim()}>
              Create Label
            </Button>
          </DialogActions>
        </Dialog>

        {/* Right panel - Video and annotations */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Video player */}
          <Paper sx={{ overflow: 'hidden', mb: 2 }}>
            <Box sx={{ position: 'relative', bgcolor: 'grey.900' }}>
              <div data-vjs-player>
                <video
                  ref={videoRef}
                  className="video-js vjs-big-play-centered vjs-fluid"
                  playsInline
                />
              </div>
            </Box>

            {/* Timeline */}
            <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Timeline
              </Typography>
              <Box
                onClick={handleTimelineSeek}
                sx={{
                  height: 32,
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                {/* Annotation segments (time ranges) and points */}
                {duration > 0 &&
                  annotations.map((a) => {
                    const left = (a.start / duration) * 100
                    const width = a.type === 'range' ? ((a.end - a.start) / duration) * 100 : 1
                    return (
                      <Box
                        key={a.id}
                        sx={{
                          position: 'absolute',
                          left: `${left}%`,
                          top: 0,
                          bottom: 0,
                          width: `${Math.max(width, 1)}%`,
                          minWidth: 4,
                          bgcolor: a.labelColor,
                          borderRadius: 0.5,
                          pointerEvents: 'none',
                        }}
                        title={`${a.labelName}${a.notes ? ` – ${a.notes}` : ''}`}
                      />
                    )
                  })}
                {/* Playhead */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: duration > 0 ? `${(currentTime / duration) * 100}%` : 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    bgcolor: 'error.main',
                    transform: 'translateX(-1px)',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Annotations list + Export CSV */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Annotations ({annotations.length})
              </Typography>
              <Button variant="outlined" size="small" onClick={handleExportCsv}>
                Export CSV
              </Button>
            </Box>
            {annotations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No annotations yet. Markers appear on the video progress bar when added.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {annotations
                  .slice()
                  .sort((a, b) => a.start - b.start)
                  .map((a) => (
                    <Box
                      key={a.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 0.5,
                          opacity: removingAnnotationId === a.id ? 0 : 1,
                          transform:
                            removingAnnotationId === a.id ? 'translateX(-6px)' : 'translateX(0)',
                          transition: 'opacity 180ms ease, transform 180ms ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: a.labelColor,
                          mt: 0.5,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2">
                          {a.labelName}{' '}
                          <Typography component="span" variant="caption" color="text.secondary">
                            ({formatTime(a.start)}
                            {a.type === 'range' ? `–${formatTime(a.end)}` : ''})
                          </Typography>
                        </Typography>
                        {a.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {a.notes}
                          </Typography>
                        )}
                      </Box>
                      <Tooltip title="Delete annotation">
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAnnotation(a.id)}
                          sx={{ minWidth: 0, px: 1.25, fontSize: '0.9rem', lineHeight: 1.2 }}
                        >
                          ✕
                        </Button>
                      </Tooltip>
                    </Box>
                  ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export default Annotations
