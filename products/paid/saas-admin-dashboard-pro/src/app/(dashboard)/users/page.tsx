'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Box, Typography, Chip, IconButton, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { DataTable } from '@/components/ui/DataTable';

// Define the User type
type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Manager';
  status: 'Active' | 'Inactive' | 'Pending';
  lastActive: string;
};

// Mock Data
const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    lastActive: '2023-10-25',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Active',
    lastActive: '2023-10-24',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'Inactive',
    lastActive: '2023-09-15',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'Manager',
    status: 'Active',
    lastActive: '2023-10-26',
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'User',
    status: 'Pending',
    lastActive: 'Never',
  },
  // Add more mock data to test pagination
  { id: '6', name: 'David Lee', email: 'david@example.com', role: 'User', status: 'Active', lastActive: '2023-10-20' },
  { id: '7', name: 'Eva Green', email: 'eva@example.com', role: 'Manager', status: 'Active', lastActive: '2023-10-21' },
  { id: '8', name: 'Frank White', email: 'frank@example.com', role: 'User', status: 'Inactive', lastActive: '2023-08-10' },
  { id: '9', name: 'Grace Hall', email: 'grace@example.com', role: 'User', status: 'Active', lastActive: '2023-10-23' },
  { id: '10', name: 'Henry Ford', email: 'henry@example.com', role: 'Admin', status: 'Active', lastActive: '2023-10-27' },
  { id: '11', name: 'Ivy Wilson', email: 'ivy@example.com', role: 'User', status: 'Pending', lastActive: 'Never' },
  { id: '12', name: 'Jack King', email: 'jack@example.com', role: 'Manager', status: 'Active', lastActive: '2023-10-22' },
];

export default function UsersPage() {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';

        switch (role) {
          case 'Admin': color = 'error'; break;
          case 'Manager': color = 'info'; break;
          case 'User': color = 'default'; break;
        }

        return <Chip label={role} color={color} size="small" variant="outlined" />;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';

        switch (status) {
          case 'Active': color = 'success'; break;
          case 'Inactive': color = 'default'; break;
          case 'Pending': color = 'warning'; break;
        }

        return <Chip label={status} color={color} size="small" />;
      },
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Active',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <IconButton size="small">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add User
        </Button>
      </Box>

      <DataTable columns={columns} data={users} searchPlaceholder="Search users..." />
    </Box>
  );
}
