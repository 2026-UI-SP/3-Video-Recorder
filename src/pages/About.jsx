import { Box, List, ListItem, ListItemText, Paper, Typography } from '@mui/material'

function About() {
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        About
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        Created for CS4760 at Michigan Technological University during the Spring 2026 semester.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
          Group Members
        </Typography>
        <List dense sx={{ pl: 1 }}>
          <ListItem>
            <ListItemText primary="Simon Novak" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Levi Peltomaa" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Josh Kozlowski" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Andrew Dzik" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Evan Jacobson" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Grace Fenech" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>
        <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
          UI Consultant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Karah McElhone
        </Typography>
      </Paper>
    </Box>
  )
}

export default About
