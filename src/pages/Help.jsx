import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material'

function Help() {
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        Help &amp; Quick Start
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        This guide walks you through the basic workflow for recording, labeling, and exporting
        annotations from your videos.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          1. Select and open a video
        </Typography>
        <Typography variant="body2" color="text.secondary">
          On the <strong>Home</strong> page, choose a video file from your computer. After you
          confirm, the app will open the <strong>Video Annotator</strong> screen where you can add
          labels and annotations.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          2. Create labels
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Labels are categories you can reuse across many timestamps (for example:
          &nbsp;<em>Smile</em>, <em>Error</em>, <em>Interesting event</em>). Each label has a color,
          which is used in the timeline and marker bar.
        </Typography>
        <List dense sx={{ pl: 1 }}>
          <ListItem>
            <ListItemText
              primary="Open the “Labels” panel on the left."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Click “+ Add Label”, give it a name, and choose a color."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Create as many labels as you need before you start annotating."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          3. Add annotations while watching
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Annotations mark important moments or ranges in the video. They are shown:
        </Typography>
        <List dense sx={{ pl: 1, mb: 1 }}>
          <ListItem>
            <ListItemText
              primary="as colored markers on the video progress bar"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="as colored segments in the “Timeline” bar below the player"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="in the “Annotations” list under the player"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          To create a new annotation:
        </Typography>
        <List dense sx={{ pl: 1 }}>
          <ListItem>
            <ListItemText
              primary="Play or scrub the video to the moment you want to mark."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary='In the left panel, click “+ Add Annotation at Current Time”.'
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Choose whether this is a single point in time or a time range."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Pick a label, adjust start/end times if needed, and optionally add notes."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary='Click “Add” to save it. It will appear in the list and on the timeline.'
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          4. Navigate using the timeline
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Below the player, the <strong>Timeline</strong> bar shows all annotations as colored
          segments. You can click anywhere on this bar to jump the video to that position. The red
          vertical line shows the current playback position.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 900 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          5. Review, edit, and export
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          At the bottom, the <strong>Annotations</strong> section lists everything you have added,
          ordered by time.
        </Typography>
        <List dense sx={{ pl: 1, mb: 1 }}>
          <ListItem>
            <ListItemText
              primary="Each entry shows the label, the time (or time range), and any notes."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Use the ✕ button next to an entry if you want to remove an annotation."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          When you are ready to export your work:
        </Typography>
        <List dense sx={{ pl: 1 }}>
          <ListItem>
            <ListItemText
              primary='Click “Export CSV” to download a CSV file with all annotations.'
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="The CSV contains start time, end time, label, and description for each annotation."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="text.secondary">
        Tip: you can switch between light and dark mode using the button in the top-right corner of
        the header.
      </Typography>
    </Box>
  )
}

export default Help

