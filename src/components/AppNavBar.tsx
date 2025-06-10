import React, { useState, Suspense } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon, 
  ListItemText, 
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Button,
  CircularProgress,
  useTheme,
  CssBaseline
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  LocalHospital as DoctorIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const drawerWidth = 240;

interface AppNavBarProps {
  window?: () => Window;
}

const AppNavBar: React.FC<AppNavBarProps> = ({ window }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.type_utilisateur === 'administrateur' || user?.type_utilisateur === 'admin';

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  
  const getInitials = (nom?: string, prenom?: string) => {
    if (!nom || !prenom) return '?';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  // Menu accessible à tous les utilisateurs (connectés ou non)
  const publicMenuItems = [
    {
      text: 'Tableau de bord',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Médecins',
      icon: <DoctorIcon />,
      path: '/medecins',
    },
    {
      text: 'Médicaments',
      icon: <MedicationIcon />,
      path: '/medicaments',
    },
  ];

  // Menu accessible uniquement aux utilisateurs connectés
  const authenticatedMenuItems = [
    {
      text: 'Rapports',
      icon: <DescriptionIcon />,
      path: '/rapports',
    },
  ];

  // Combiner les menus en fonction de l'état d'authentification
  const menuItems = user 
    ? [...publicMenuItems, ...authenticatedMenuItems] 
    : publicMenuItems;

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={1}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerOpen}
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
              mr: 4
            }}
          >
            GSB-Rapport
          </Typography>
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  color: theme.palette.primary.contrastText,
                  fontWeight: location.pathname.startsWith(item.path) ? 'bold' : 'normal',
                  borderBottom: location.pathname.startsWith(item.path) 
                    ? `2px solid ${theme.palette.secondary.main}` 
                    : '2px solid transparent',
                  borderRadius: 0,
                  '&:hover': {
                    bgcolor: 'transparent',
                    borderBottom: `2px solid ${theme.palette.secondary.main}`,
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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="large"
                edge="end"
                aria-label="compte de l'utilisateur actuel"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                      {getInitials(user.nom, user.prenom)}
                </Avatar>
              </IconButton>
            </motion.div>
              </>
            ) : (
              <Button 
                color="inherit" 
                variant="outlined" 
                onClick={() => navigate('/login')}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.8)',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Connexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="nav">
        <Drawer
          container={container}
          variant="temporary"
          open={open}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: drawerWidth,
              bgcolor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
            },
          }}
        >
          <Box sx={{ bgcolor: theme.palette.secondary.main, height: '100%' }}>
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" component="div" sx={{ color: theme.palette.secondary.contrastText }}>
                GSB-Rapport
              </Typography>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={location.pathname.startsWith(item.path)}
                    sx={{
                      color: theme.palette.secondary.contrastText,
                      '&.Mui-selected': {
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.15)',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: theme.palette.secondary.contrastText, minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}

              {/* Bouton de connexion dans le drawer si l'utilisateur n'est pas connecté */}
              {!user && (
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation('/login')}
                    sx={{
                      color: theme.palette.secondary.contrastText,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: theme.palette.secondary.contrastText, minWidth: 40 }}>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText primary="Connexion" />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </Box>
        </Drawer>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate('/profile');
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Mon Profil" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          handleMenuClose();
          handleLogout();
        }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Déconnexion" />
        </MenuItem>
      </Menu>
      
      {/* Espacement pour compenser la barre d'app fixe */}
      <Box component="div" sx={{ height: 64 }} />
    </Box>
  );
};

export default AppNavBar; 