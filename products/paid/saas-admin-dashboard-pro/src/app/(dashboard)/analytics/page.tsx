'use client';

import * as React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// Mock Data
const trafficData = [
  { name: 'Jan', organic: 4000, referral: 2400, social: 2400 },
  { name: 'Feb', organic: 3000, referral: 1398, social: 2210 },
  { name: 'Mar', organic: 2000, referral: 9800, social: 2290 },
  { name: 'Apr', organic: 2780, referral: 3908, social: 2000 },
  { name: 'May', organic: 1890, referral: 4800, social: 2181 },
  { name: 'Jun', organic: 2390, referral: 3800, social: 2500 },
];

const deviceData = [
  { name: 'Desktop', value: 400 },
  { name: 'Mobile', value: 300 },
  { name: 'Tablet', value: 300 },
  { name: 'Other', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const userGrowthData = [
  { name: 'Week 1', users: 100 },
  { name: 'Week 2', users: 200 },
  { name: 'Week 3', users: 150 },
  { name: 'Week 4', users: 300 },
  { name: 'Week 5', users: 250 },
  { name: 'Week 6', users: 400 },
];

export default function AnalyticsPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Traffic Sources Bar Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Traffic Sources
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={trafficData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="organic" fill="#8884d8" name="Organic Search" />
                <Bar dataKey="referral" fill="#82ca9d" name="Referral" />
                <Bar dataKey="social" fill="#ffc658" name="Social Media" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Device Distribution Pie Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Device Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Growth Line Chart */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              User Growth
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={userGrowthData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
