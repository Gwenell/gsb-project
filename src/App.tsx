import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medecins from './pages/Medecins';
import Medicaments from './pages/Medicaments';
import Rapports from './pages/Rapports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AssignMedicaments from './pages/AssignMedicaments';

const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return user ? <>{element}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/medecins" element={<ProtectedRoute element={<Medecins />} />} />
            <Route path="/medicaments" element={<ProtectedRoute element={<Medicaments />} />} />
            <Route path="/assign-medicaments" element={<ProtectedRoute element={<AssignMedicaments />} />} />
            <Route path="/rapports" element={<ProtectedRoute element={<Rapports />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
