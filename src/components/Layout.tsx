import React, { useState, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Container,
  useTheme,
  CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import PageTitle from './PageTitle';

// Crimson red for accents
const crimsonRed = '#DC143C';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const getInitials = (nom?: string, prenom?: string) => {
    if (!nom || !prenom) return '?';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  // Menu items selon les modules définis dans la documentation
  const getMenuItems = () => {
    const baseItems = [
    {
      text: 'Tableau de bord',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Médecins',
      icon: <LocalHospitalIcon />,
      path: '/medecins',
    },
    {
      text: 'Médicaments',
      icon: <MedicationIcon />,
      path: '/medicaments',
    }
  ];

    // Si utilisateur non connecté, retourner seulement les pages publiques
    if (!user) {
      return baseItems;
    }
    
    // Fiches de frais - non visible pour les administrateurs
    if (!isAdmin) {
      baseItems.push({
        text: 'Fiches de Frais',
        icon: <DescriptionIcon />,
        path: '/fiches-frais',
      });
    }

    // Module Visiteur - saisie des comptes-rendus
    if (user?.type_utilisateur === 'visiteur') {
      baseItems.push(
        {
          text: 'Mes Rapports',
          icon: <AssignmentIcon />,
          path: '/rapports',
        }
      );
    }

    // Module Délégué/Responsable - vision activité + saisie CR
    if (user?.type_utilisateur === 'delegue' || user?.type_utilisateur === 'responsable') {
      baseItems.push(
        {
          text: 'Rapports Équipe',
          icon: <AssignmentIcon />,
          path: '/rapports',
        },
        {
          text: 'Validation Rapports',
          icon: <AssignmentIcon />,
          path: '/validation-rapports',
        }
      );
    }

    // Pour les administrateurs, ajout de la page Rapports également
    if (isAdmin) {
      baseItems.push(
        {
          text: 'Rapports',
          icon: <AssignmentIcon />,
          path: '/rapports',
        },
        {
          text: 'Utilisateurs',
          icon: <PeopleIcon />,
          path: '/users',
        }
      );
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <PageTitle title={title} />
      <AppBar 
        position="fixed" 
        elevation={3}
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: { xs: 1, md: 0 }, 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 'bold',
              mr: 4,
              color: theme.palette.primary.contrastText,
            }}
          >
            GSB Rapports
          </Typography>
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
            {menuItems.map((item) => (
                <Button
                  key={item.text}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    mx: 1,
                    color: theme.palette.primary.contrastText,
                    fontWeight: location.pathname.startsWith(item.path) ? 'bold' : 'normal',
                    borderBottom: location.pathname.startsWith(item.path) 
                      ? `2px solid ${crimsonRed}` 
                      : '2px solid transparent',
                    borderRadius: 0,
                    '&:hover': {
                      bgcolor: 'transparent',
                      borderBottom: `2px solid ${crimsonRed}`,
                    }
                  }}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user ? (
              <>
            <Typography variant="body1" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
                  {user.prenom} {user.nom}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="compte de l'utilisateur actuel"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                {user ? getInitials(user.nom, user.prenom) : '?'}
              </Avatar>
            </IconButton>
              </>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                startIcon={<ExitToAppIcon />}
                sx={{ 
                  border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: 2,
                  px: 2
                }}
              >
                Connexion
              </Button>
            )}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              keepMounted
            >
              <MenuItem onClick={() => {
                handleNavigate('/profile');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" sx={{ color: '#2E2E2E' }} />
                </ListItemIcon>
                <ListItemText>Mon profil</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" sx={{ color: '#2E2E2E' }} />
                </ListItemIcon>
                <ListItemText>Déconnexion</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              width: 240, 
              bgcolor: 'white',
              color: '#2E2E2E',
            },
          }}
        >
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress color="inherit" />
            </Box>
          }>
            <Box sx={{ bgcolor: 'white', height: '100%' }}>
              <Toolbar>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 'bold' 
                  }}
                >
                  GSB Rapports
                </Typography>
              </Toolbar>
              <Divider sx={{ bgcolor: 'rgba(0,0,0,0.1)' }} />
              <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => navigate(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                        color: location.pathname === item.path ? theme.palette.primary.contrastText : '#2E2E2E',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(220,20,60,0.15)',
                            '&:hover': {
                              bgcolor: 'rgba(220,20,60,0.25)',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'rgba(220,20,60,0.1)',
                          },
                        fontWeight: 'medium'
                        }}
                      >
                      <ListItemIcon sx={{ 
                        color: location.pathname === item.path ? theme.palette.primary.contrastText : '#2E2E2E', 
                        minWidth: 40 
                      }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </ListItem>
                ))}
                
                {!user && (
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => navigate('/login')}
                      sx={{
                        mt: 2,
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                        '&:hover': {
                          bgcolor: 'rgba(220,20,60,0.1)',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 40 }}>
                        <ExitToAppIcon />
                      </ListItemIcon>
                      <ListItemText primary="Connexion" />
                    </ListItemButton>
                  </ListItem>
                )}
              </List>
            </Box>
          </Suspense>
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
          mt: '64px', // hauteur de la barre d'app
        }}
      >
        <Container maxWidth="xl">
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: 3, 
              fontWeight: 'medium',
              color: theme.palette.secondary.main,
              borderLeft: `4px solid ${theme.palette.secondary.main}`,
              pl: 2,
              py: 1
            }}
          >
            {title}
          </Typography>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 