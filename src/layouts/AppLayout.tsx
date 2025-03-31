import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import AppNavBar from '../components/AppNavBar';

const AppLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavBar />
      <Box component="main" sx={{ flexGrow: 1, py: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout; 