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
import CompteRenduVisite from './pages/CompteRenduVisite';
import ValidationRapports from './pages/ValidationRapports';
import Users from './pages/Users';
import FicheFraisList from './pages/FichesFrais/FicheFraisList';
import FicheFraisForm from './pages/FichesFrais/FicheFraisForm';
import FicheFraisDetails from './pages/FichesFrais/FicheFraisDetails';

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

// Route qui nécessite des privilèges d'administrateur
const AdminRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur';
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return isAdmin ? <>{element}</> : <Navigate to="/dashboard" replace />;
};

// Route qui nécessite des privilèges de comptable
const ComptableRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const isComptable = user?.type_utilisateur === 'comptable' || user?.type_utilisateur === 'responsable';
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return isComptable ? <>{element}</> : <Navigate to="/dashboard" replace />;
};

// Route qui nécessite des privilèges de non-admin (bloque les administrateurs)
const NonAdminRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur';
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si c'est un admin, rediriger vers dashboard
  return !isAdmin ? <>{element}</> : <Navigate to="/dashboard" replace />;
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
            
            {/* Pages publiques accessibles sans authentification */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/medecins" element={<Medecins />} />
            <Route path="/medicaments" element={<Medicaments />} />
            
            {/* Pages protégées nécessitant une authentification */}
            <Route path="/assign-medicaments" element={<ProtectedRoute element={<AssignMedicaments />} />} />
            <Route path="/rapports" element={<ProtectedRoute element={<Rapports />} />} />
            <Route path="/rapports/nouveau" element={<ProtectedRoute element={<CompteRenduVisite />} />} />
            <Route path="/validation-rapports" element={<ComptableRoute element={<ValidationRapports />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="/users" element={<AdminRoute element={<Users />} />} />

            {/* Fiches de frais - non accessibles aux administrateurs */}
            <Route path="/fiches-frais" element={<NonAdminRoute element={<FicheFraisList />} />} />
            <Route path="/fiches-frais/new" element={<NonAdminRoute element={<FicheFraisForm />} />} />
            <Route path="/fiches-frais/:id" element={<NonAdminRoute element={<FicheFraisDetails />} />} />
            <Route path="/fiches-frais/edit/:id" element={<NonAdminRoute element={<FicheFraisForm />} />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
