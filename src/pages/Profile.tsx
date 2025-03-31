import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import CustomGrid from '../components/CustomGrid';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const Profile: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // États pour les informations utilisateur
  const [userInfo, setUserInfo] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    cp: '',
    ville: '',
    email: '',
    dateEmbauche: '',
    login: ''
  });

  // États pour le changement de mot de passe
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      // Initialiser les informations de l'utilisateur
      setUserInfo({
        nom: user.nom || '',
        prenom: user.prenom || '',
        adresse: user.adresse || '',
        cp: user.cp || '',
        ville: user.ville || '',
        email: user.email || '',
        dateEmbauche: user.dateEmbauche || '',
        login: user.login || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo({
      ...userInfo,
      [name]: value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords({
      ...passwords,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simuler la sauvegarde des informations
    setTimeout(() => {
      setLoading(false);
      setEditMode(false);
      setSnackbar({
        open: true,
        message: 'Profil mis à jour avec succès',
        severity: 'success'
      });
    }, 1000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider que les mots de passe correspondent
    if (passwords.newPassword !== passwords.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Les mots de passe ne correspondent pas',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    // Simuler la mise à jour du mot de passe
    setTimeout(() => {
      setLoading(false);
      setPasswordMode(false);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSnackbar({
        open: true,
        message: 'Mot de passe mis à jour avec succès',
        severity: 'success'
      });
    }, 1000);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setPasswordMode(false);
  };

  const togglePasswordMode = () => {
    setPasswordMode(!passwordMode);
    setEditMode(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <motion.div variants={itemVariants}>
              <Typography variant="h4" component="h1" gutterBottom>
                Mon Profil
              </Typography>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Box>
                <Button
                  variant={passwordMode ? "contained" : "outlined"}
                  color="secondary"
                  startIcon={<LockIcon />}
                  onClick={togglePasswordMode}
                  sx={{ mr: 1 }}
                >
                  Changer mot de passe
                </Button>
                <Button
                  variant={editMode ? "contained" : "outlined"}
                  color="secondary"
                  startIcon={<EditIcon />}
                  onClick={toggleEditMode}
                >
                  {editMode ? "En cours d'édition" : "Modifier profil"}
                </Button>
              </Box>
            </motion.div>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {passwordMode ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h6" gutterBottom>
                Changement de mot de passe
              </Typography>
              <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 3 }}>
                <CustomGrid container spacing={3}>
                  <CustomGrid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mot de passe actuel"
                      name="currentPassword"
                      type="password"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </CustomGrid>
                  <CustomGrid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nouveau mot de passe"
                      name="newPassword"
                      type="password"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </CustomGrid>
                  <CustomGrid item xs={12}>
                    <TextField
                      fullWidth
                      label="Confirmer le nouveau mot de passe"
                      name="confirmPassword"
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </CustomGrid>
                  <CustomGrid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{ mt: 2 }}
                    >
                      Enregistrer le nouveau mot de passe
                    </Button>
                  </CustomGrid>
                </CustomGrid>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: theme.palette.secondary.main,
                    fontSize: '2rem',
                    mr: 4
                  }}
                >
                  {userInfo.prenom?.[0]}{userInfo.nom?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {userInfo.prenom} {userInfo.nom}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur' 
                      ? 'Administrateur' 
                      : 'Visiteur médical'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Identifiant: {userInfo.login}
                  </Typography>
                </Box>
              </Box>

              {editMode ? (
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                  <CustomGrid container spacing={3}>
                    <CustomGrid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nom"
                        name="nom"
                        value={userInfo.nom}
                        onChange={handleInputChange}
                        required
                      />
                    </CustomGrid>
                    <CustomGrid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Prénom"
                        name="prenom"
                        value={userInfo.prenom}
                        onChange={handleInputChange}
                        required
                      />
                    </CustomGrid>
                    <CustomGrid item xs={12}>
                      <TextField
                        fullWidth
                        label="Adresse"
                        name="adresse"
                        value={userInfo.adresse}
                        onChange={handleInputChange}
                      />
                    </CustomGrid>
                    <CustomGrid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Code postal"
                        name="cp"
                        value={userInfo.cp}
                        onChange={handleInputChange}
                      />
                    </CustomGrid>
                    <CustomGrid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Ville"
                        name="ville"
                        value={userInfo.ville}
                        onChange={handleInputChange}
                      />
                    </CustomGrid>
                    <CustomGrid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={userInfo.email}
                        onChange={handleInputChange}
                        required
                      />
                    </CustomGrid>
                    <CustomGrid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{ mt: 2 }}
                      >
                        Enregistrer les modifications
                      </Button>
                    </CustomGrid>
                  </CustomGrid>
                </Box>
              ) : (
                <CustomGrid container spacing={3}>
                  <CustomGrid item xs={12}>
                    <motion.div variants={itemVariants}>
                      <Typography variant="body2" color="textSecondary">
                        Adresse
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {userInfo.adresse || 'Non renseignée'}
                      </Typography>
                    </motion.div>
                  </CustomGrid>
                  <CustomGrid item xs={12} sm={6}>
                    <motion.div variants={itemVariants}>
                      <Typography variant="body2" color="textSecondary">
                        Code postal
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {userInfo.cp || 'Non renseigné'}
                      </Typography>
                    </motion.div>
                  </CustomGrid>
                  <CustomGrid item xs={12} sm={6}>
                    <motion.div variants={itemVariants}>
                      <Typography variant="body2" color="textSecondary">
                        Ville
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {userInfo.ville || 'Non renseignée'}
                      </Typography>
                    </motion.div>
                  </CustomGrid>
                  <CustomGrid item xs={12}>
                    <motion.div variants={itemVariants}>
                      <Typography variant="body2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {userInfo.email || 'Non renseigné'}
                      </Typography>
                    </motion.div>
                  </CustomGrid>
                  <CustomGrid item xs={12}>
                    <motion.div variants={itemVariants}>
                      <Typography variant="body2" color="textSecondary">
                        Date d'embauche
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {userInfo.dateEmbauche ? new Date(userInfo.dateEmbauche).toLocaleDateString('fr-FR') : 'Non renseignée'}
                      </Typography>
                    </motion.div>
                  </CustomGrid>
                </CustomGrid>
              )}
            </motion.div>
          )}
        </Paper>
      </motion.div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 