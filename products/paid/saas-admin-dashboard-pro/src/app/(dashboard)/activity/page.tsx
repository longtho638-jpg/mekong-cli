'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import LoginIcon from '@mui/icons-material/Login';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';

// Mock Data
const logs = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Logged in',
    target: 'System',
    timestamp: '2023-10-27 09:00 AM',
    type: 'auth',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Updated profile',
    target: 'User Profile',
    timestamp: '2023-10-27 10:30 AM',
    type: 'update',
  },
  {
    id: 3,
    user: 'Admin User',
    action: 'Deleted user',
    target: 'Bob Johnson',
    timestamp: '2023-10-26 02:15 PM',
    type: 'delete',
  },
  {
    id: 4,
    user: 'Alice Williams',
    action: 'Created new project',
    target: 'Project Alpha',
    timestamp: '2023-10-26 11:45 AM',
    type: 'create',
  },
  {
    id: 5,
    user: 'John Doe',
    action: 'Changed settings',
    target: 'Email Notifications',
    timestamp: '2023-10-25 04:20 PM',
    type: 'settings',
  },
  {
    id: 6,
    user: 'System',
    action: 'Backup completed',
    target: 'Database',
    timestamp: '2023-10-25 01:00 AM',
    type: 'system',
  },
  {
    id: 7,
    user: 'Jane Smith',
    action: 'Logged out',
    target: 'System',
    timestamp: '2023-10-24 05:30 PM',
    type: 'auth',
  },
  {
    id: 8,
    user: 'Admin User',
    action: 'Updated role',
    target: 'Alice Williams',
    timestamp: '2023-10-24 10:00 AM',
    type: 'update',
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'auth': return <LoginIcon color="primary" />;
    case 'update': return <EditIcon color="info" />;
    case 'delete': return <DeleteIcon color="error" />;
    case 'create': return <AddCircleIcon color="success" />;
    case 'settings': return <SettingsIcon color="action" />;
    default: return <HistoryIcon />;
  }
};

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;

  const filteredLogs = logs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredLogs.length / rowsPerPage);
  const displayedLogs = filteredLogs.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Activity Logs
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <List>
          {displayedLogs.map((log, index) => (
            <React.Fragment key={log.id}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {getIcon(log.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {log.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.timestamp}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        sx={{ display: 'inline', mr: 1 }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {log.action}
                      </Typography>
                      <Chip label={log.target} size="small" variant="outlined" sx={{ ml: 1 }} />
                    </React.Fragment>
                  }
                />
              </ListItem>
              {index < displayedLogs.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
          {displayedLogs.length === 0 && (
            <ListItem>
              <ListItemText primary="No logs found matching your search." />
            </ListItem>
          )}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      </Paper>
    </Box>
  );
}
