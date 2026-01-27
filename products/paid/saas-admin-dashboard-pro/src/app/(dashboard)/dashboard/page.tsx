'use client';

import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
];

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        {[
          { title: 'Total Revenue', value: '$45,231.89', change: '+20.1% from last month' },
          { title: 'Active Users', value: '+2350', change: '+180.1% from last month' },
          { title: 'Sales', value: '+12,234', change: '+19% from last month' },
          { title: 'Active Now', value: '+573', change: '+201 since last hour' },
        ].map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                {stat.title}
              </Typography>
              <Typography component="p" variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {stat.value}
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 'auto' }}>
                {stat.change}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Revenue Over Time
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="uv" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Traffic Sources
            </Typography>
            {/* Placeholder for Pie Chart or List */}
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Traffic Source Data</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
