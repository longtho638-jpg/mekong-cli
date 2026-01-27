'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

export default function SettingsPage() {
  const [successMessage, setSuccessMessage] = React.useState('');

  const handleSave = () => {
    setSuccessMessage('Settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Settings
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Profile Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              alt="Admin User"
              src="/static/images/avatar/2.jpg"
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            <Button variant="outlined" size="small">
              Change Avatar
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="First Name" defaultValue="Admin" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Last Name" defaultValue="User" fullWidth />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Email Address" defaultValue="admin@example.com" fullWidth />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Bio" multiline rows={3} placeholder="Tell us about yourself" fullWidth />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email Notifications"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
              Receive emails about your account activity.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Push Notifications"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
              Receive push notifications on your device.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch />}
              label="Marketing Emails"
            />
             <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
              Receive emails about new products, features, and more.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Security Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Security
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
             <Button variant="outlined" color="primary">
               Change Password
             </Button>
          </Grid>
           <Grid size={{ xs: 12 }}>
             <Button variant="outlined" color="secondary">
               Enable Two-Factor Authentication
             </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
