'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import CreditCardIcon from '@mui/icons-material/CreditCard';

export default function BillingPage() {
  const plans = [
    {
      title: 'Free',
      price: '$0',
      period: '/mo',
      features: ['5 Users', 'Basic Analytics', 'Community Support'],
      current: false,
    },
    {
      title: 'Pro',
      price: '$29',
      period: '/mo',
      features: ['Unlimited Users', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
      current: true,
      color: 'primary',
    },
    {
      title: 'Enterprise',
      price: '$99',
      period: '/mo',
      features: ['Unlimited Everything', 'Dedicated Manager', 'SLA', 'SSO'],
      current: false,
    },
  ];

  const invoices = [
    { id: 'INV-001', date: 'Oct 01, 2023', amount: '$29.00', status: 'Paid' },
    { id: 'INV-002', date: 'Sep 01, 2023', amount: '$29.00', status: 'Paid' },
    { id: 'INV-003', date: 'Aug 01, 2023', amount: '$29.00', status: 'Paid' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Billing & Subscription
      </Typography>

      {/* Plans Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {plans.map((plan) => (
          <Grid size={{ xs: 12, md: 4 }} key={plan.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: plan.current ? 2 : 1,
                borderColor: plan.current ? 'primary.main' : 'divider',
                position: 'relative'
              }}
            >
              {plan.current && (
                <Chip
                  label="Current Plan"
                  color="primary"
                  size="small"
                  sx={{ position: 'absolute', top: 16, right: 16 }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom>
                  {plan.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                  <Typography variant="h3" component="span" fontWeight="bold">
                    {plan.price}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {plan.period}
                  </Typography>
                </Box>
                <List dense>
                  {plan.features.map((feature) => (
                    <ListItem key={feature} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant={plan.current ? 'outlined' : 'contained'}
                  color={plan.current ? 'primary' : 'primary'}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Payment Method */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CreditCardIcon sx={{ fontSize: 40, mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Visa ending in 4242
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expires 12/24
                </Typography>
              </Box>
            </Box>
            <Button variant="text" size="small">Edit Payment Method</Button>
          </Paper>
        </Grid>

        {/* Invoice History */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Invoice History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>
                        <Chip label={invoice.status} size="small" color="success" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
