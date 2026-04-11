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
  Snackbar,
  Alert,
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

function parseNonNegativeDurationInput(input) {
  const raw = String(input).trim()
  if (raw === '') return 0
  const n = parseFloat(raw)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}
const keycapSx = {
  px: 0.6,
  py: 0.15,
  mx: 0.2,
  borderRadius: 0.75,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  fontWeight: 700,
  lineHeight: 1.2,
}

function Annotations() {
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [undoneAnnotations, setUndoneAnnotations] = useState([])
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
  const [annotationDurationInput, setAnnotationDurationInput] = useState('0')
  const [removingAnnotationId, setRemovingAnnotationId] = useState(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const holdHTimeoutRef = useRef(null)
  const isHoldingHRef = useRef(false)
  const annotationsRef = useRef([])
  const undoneAnnotationsRef = useRef([])
  const [playbackRate, setPlaybackRate] = useState(1)
  const [durationMismatchOpen, setDurationMismatchOpen] = useState(false)
  const pendingImportRef = useRef(null)

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

  useEffect(() => {
    annotationsRef.current = annotations
  }, [annotations])

  useEffect(() => {
    undoneAnnotationsRef.current = undoneAnnotations
  }, [undoneAnnotations])

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
    }
    setAnnotationDurationInput('0')
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
    const start = Math.max(0, annotationStartTime)
    const rangeDuration = parseNonNegativeDurationInput(annotationDurationInput)
    const end = annotationType === 'range' ? start + rangeDuration : start
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
    setUndoneAnnotations([])
    closeAddAnnotation()
    setToastMessage(`Added annotation "${annotation.labelName}"`)
    setToastOpen(true)
  }

  // Export annotations to CSV
  const handleExportCsv = () => {
    const metadata = `# Duration: ${duration}\n`
    const header = 'start,end,label,description\n'
    const rows = annotations
      .slice()
      .sort((a, b) => a.start - b.start)
      .map((a) => `${a.start},${a.end},${a.labelName || ''},${a.notes || ''}`)
      .join('\n')
    const blob = new Blob([metadata + header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const baseName =
      (videoFile?.name && videoFile.name.replace(/\.[^/.]+$/, '')) || 'annotations'
    a.download = `${baseName}-annotations.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Process imported annotations
  const processImportedAnnotations = (importedAnnotations, newLabels) => {
    // Filter out annotations that exceed video duration
    const validAnnotations = importedAnnotations.filter(
      ann => ann.start <= duration && ann.end <= duration
    )
    const outOfBoundsCount = importedAnnotations.length - validAnnotations.length

    // Update labels and annotations, filtering out duplicates
    setLabels(newLabels)
    setAnnotations(prev => {
      const existing = new Set(
        prev.map(ann => `${ann.labelName}|${ann.start}`)
      )
      const filtered = validAnnotations.filter(
        ann => !existing.has(`${ann.labelName}|${ann.start}`)
      )
      const duplicateCount = validAnnotations.length - filtered.length
      
      let message = `Imported ${filtered.length} annotation${filtered.length !== 1 ? 's' : ''}`
      if (duplicateCount > 0) {
        message += ` (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped)`
      }
      if (outOfBoundsCount > 0) {
        message += ` (${outOfBoundsCount} outside video duration skipped)`
      }
      setToastMessage(message)
      return [...prev, ...filtered]
    })
    setUndoneAnnotations([])
    setToastOpen(true)
  }

  // Parse and import annotations from CSV
  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      
      if (lines.length < 2) {
        setToastMessage('CSV file must have a header row and at least one data row')
        setToastOpen(true)
        return
      }

      // Check for duration metadata
      let headerLineIdx = 0
      let csvDuration = null
      let hasDurationMismatch = false
      
      if (lines[0].startsWith('# Duration:')) {
        csvDuration = parseFloat(lines[0].split(':')[1].trim())
        // Allow 1 second tolerance for duration mismatch
        if (!isNaN(csvDuration) && Math.abs(csvDuration - duration) > 1) {
          hasDurationMismatch = true
        }
        headerLineIdx = 1
      }

      // Parse header
      const headers = lines[headerLineIdx].split(',').map(h => h.trim().toLowerCase())
      const startIdx = headers.indexOf('start')
      const endIdx = headers.indexOf('end')
      const labelIdx = headers.indexOf('label')
      const descIdx = headers.indexOf('description')

      if (startIdx === -1 || labelIdx === -1) {
        setToastMessage('CSV must have "start" and "label" columns')
        setToastOpen(true)
        event.target.value = ''
        return
      }

      // Parse data rows
      const importedAnnotations = []
      const newLabels = [...labels]

      for (let i = headerLineIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(',').map(p => p.trim())
        const startTime = parseFloat(parts[startIdx])
        const labelName = parts[labelIdx]
        const description = descIdx !== -1 ? parts[descIdx] : ''
        const endTime = endIdx !== -1 ? parseFloat(parts[endIdx]) : startTime

        if (isNaN(startTime) || !labelName) continue

        // Find or create label
        let label = newLabels.find(l => l.name.toLowerCase() === labelName.toLowerCase())
        if (!label) {
          const colorIdx = newLabels.length % LABEL_COLORS.length
          label = {
            id: crypto.randomUUID(),
            name: labelName,
            color: LABEL_COLORS[colorIdx],
          }
          newLabels.push(label)
        }

        importedAnnotations.push({
          id: crypto.randomUUID(),
          type: isNaN(endTime) || endTime === startTime ? 'point' : 'range',
          start: startTime,
          end: isNaN(endTime) ? startTime : endTime,
          labelId: label.id,
          labelName: label.name,
          labelColor: label.color,
          notes: description || undefined,
        })
      }

      if (importedAnnotations.length === 0) {
        setToastMessage('No valid annotations found in CSV file')
        setToastOpen(true)
        return
      }

      // If there's a duration mismatch, show confirmation dialog
      if (hasDurationMismatch) {
        pendingImportRef.current = { importedAnnotations, newLabels }
        setDurationMismatchOpen(true)
        return
      }

      // Otherwise proceed with import
      processImportedAnnotations(importedAnnotations, newLabels)
      event.target.value = ''
    } catch (error) {
      console.error('Error importing CSV:', error)
      setToastMessage('Error reading CSV file')
      setToastOpen(true)
    }

    // Reset file input
    event.target.value = ''
  }

  const handleConfirmImport = () => {
    if (pendingImportRef.current) {
      const { importedAnnotations, newLabels } = pendingImportRef.current
      processImportedAnnotations(importedAnnotations, newLabels)
      pendingImportRef.current = null
    }
    setDurationMismatchOpen(false)
  }

  const handleCancelImport = () => {
    pendingImportRef.current = null
    setDurationMismatchOpen(false)
    // Find and reset the file input
    const fileInputs = document.querySelectorAll('input[type="file"]')
    fileInputs.forEach(input => {
      if (input.getAttribute('accept')?.includes('csv')) {
        input.value = ''
      }
    })
  }

  const handleDeleteAnnotation = (id) => {
    const annotationToRemove = annotations.find((a) => a.id === id)
    setRemovingAnnotationId(id)
    window.setTimeout(() => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id))
      if (annotationToRemove) {
        setUndoneAnnotations([])
      }
      setRemovingAnnotationId((current) => (current === id ? null : current))
      if (annotationToRemove) {
        setToastMessage(`Removed annotation "${annotationToRemove.labelName}"`)
      } else {
        setToastMessage('Removed annotation')
      }
      setToastOpen(true)
    }, 180)
  }

  const handleUndoLastAnnotation = () => {
    const currentAnnotations = annotationsRef.current
    if (currentAnnotations.length === 0) return
    const removed = currentAnnotations[currentAnnotations.length - 1]
    setAnnotations((prev) => prev.slice(0, -1))
    setUndoneAnnotations((redoPrev) => [...redoPrev, removed])
    setToastMessage(`Removed annotation "${removed.labelName}"`)
    setToastOpen(true)
  }

  const handleRedoLastAnnotation = () => {
    const currentUndone = undoneAnnotationsRef.current
    if (currentUndone.length === 0) return
    const restored = currentUndone[currentUndone.length - 1]
    setUndoneAnnotations((prev) => prev.slice(0, -1))
    setAnnotations((annotationPrev) => {
      if (annotationPrev.some((a) => a.id === restored.id)) return annotationPrev
      return [...annotationPrev, restored]
    })
    setToastMessage(`Restored annotation "${restored.labelName}"`)
    setToastOpen(true)
  }

  // Keyboard shortcuts:
  // - space: play/pause
  // - a: open "add annotation at current time"
  // - l: open "add label"
  // - u: undo (remove latest annotation)
  // - r: redo the last undone annotation
  // - hold h: show shortcuts dialog
  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!target) return false
      const tagName = target.tagName?.toLowerCase()
      return (
        target.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select'
      )
    }

    const clearHoldTimeout = () => {
      if (holdHTimeoutRef.current) {
        window.clearTimeout(holdHTimeoutRef.current)
        holdHTimeoutRef.current = null
      }
    }

    const onKeyDown = (e) => {
      if (isEditableTarget(e.target)) return
      if (e.altKey || e.ctrlKey || e.metaKey) return

      const key = e.key.toLowerCase()

      if (key === ' ') {
        e.preventDefault()
        if (playerRef.current) {
          playerRef.current.paused() ? playerRef.current.play() : playerRef.current.pause()
        }
        return
      }

      if (key === 'a') {
        if (labels.length === 0) return
        e.preventDefault()
        openAddAnnotation()
        return
      }

      if (key === 'l') {
        e.preventDefault()
        openAddLabel()
        return
      }

      if (key === 'u') {
        e.preventDefault()
        handleUndoLastAnnotation()
        return
      }

      if (key === 'r') {
        e.preventDefault()
        handleRedoLastAnnotation()
        return
      }

      if (key === 'h') {
        if (e.repeat || isHoldingHRef.current) return
        isHoldingHRef.current = true
        clearHoldTimeout()
        holdHTimeoutRef.current = window.setTimeout(() => {
          setShortcutsOpen(true)
        }, 550)
      }
    }

    const onKeyUp = (e) => {
      if (e.key.toLowerCase() !== 'h') return
      isHoldingHRef.current = false
      clearHoldTimeout()
    }

    const onWindowBlur = () => {
      isHoldingHRef.current = false
      clearHoldTimeout()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onWindowBlur)

    return () => {
      clearHoldTimeout()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onWindowBlur)
    }
  }, [labels.length])

  const handlePlaybackRateChange = (_, value) => {
    if (value == null || !playerRef.current) return
    playerRef.current.playbackRate(value)
    setPlaybackRate(value)
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
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Tip: hold <Box component="kbd" sx={keycapSx}>H</Box> to view keyboard shortcuts.
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
                  Duration (seconds)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  value={annotationDurationInput}
                  onChange={(e) => setAnnotationDurationInput(e.target.value)}
                  inputProps={{ min: 0, step: 0.1 }}
                  sx={{ mb: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  End time: {formatTime(Math.max(0, annotationStartTime) + parseNonNegativeDurationInput(annotationDurationInput))}
                </Typography>
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

        {/* Duration mismatch confirmation dialog */}
        <Dialog open={durationMismatchOpen} onClose={handleCancelImport}>
          <DialogTitle>Duration Mismatch</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              The CSV file appears to be from a different video. Are you sure you want to upload it to this video? Annotations outside the video duration will be skipped.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
            <Button onClick={handleCancelImport} sx={{ bgcolor: 'grey.200', color: 'grey.800' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleConfirmImport} color="warning">
              Upload Anyway
            </Button>
          </DialogActions>
        </Dialog>

        {/* Keyboard shortcuts dialog */}
        <Dialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <Box component="kbd" sx={keycapSx}>Space</Box> - Play / Pause
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <Box component="kbd" sx={keycapSx}>A</Box> - Add annotation at current time
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <Box component="kbd" sx={keycapSx}>L</Box> - Add label
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <Box component="kbd" sx={keycapSx}>U</Box> - Undo last annotation
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <Box component="kbd" sx={keycapSx}>R</Box> - Redo last undone annotation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hold <Box component="kbd" sx={keycapSx}>H</Box> - Open this shortcuts dialog
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
            <Button onClick={() => setShortcutsOpen(false)}>Close</Button>
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Playback speed
                </Typography>
                <ToggleButtonGroup
                  value={playbackRate}
                  exclusive
                  size="small"
                  onChange={handlePlaybackRateChange}
                  aria-label="Video playback speed"
                >
                  <ToggleButton value={0.5}>0.5x</ToggleButton>
                  <ToggleButton value={1}>1x</ToggleButton>
                  <ToggleButton value={1.5}>1.5x</ToggleButton>
                  <ToggleButton value={2}>2x</ToggleButton>
                </ToggleButtonGroup>
              </Box>
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

          {/* Annotations list + Export/Import CSV */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Annotations ({annotations.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCsv}
                  style={{ display: 'none' }}
                  id="csv-import-input"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => document.getElementById('csv-import-input')?.click()}
                >
                  Import CSV
                </Button>
                <Button variant="outlined" size="small" onClick={handleExportCsv}>
                  Export CSV
                </Button>
              </Box>
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
      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return
          setToastOpen(false)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Annotations
