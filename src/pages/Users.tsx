import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, addUser, updateUser, deleteUser } from '../services/api';
import Layout from '../components/Layout';

// Define the User interface
interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
  cp: string;
  ville: string;
  date_embauche: string;
  type_utilisateur: string;
  login: string;
}

// Initial form state
const initialFormState = {
  nom: '',
  prenom: '',
  email: '',
  adresse: '',
  cp: '',
  ville: '',
  date_embauche: new Date().toISOString().slice(0, 10),
  type_utilisateur: 'visiteur',
  login: '',
  password: '',
  confirmPassword: ''
};

const Users: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  
  // Current user being edited/deleted/viewed
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [formValues, setFormValues] = useState(initialFormState);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Check if current user is admin
  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur';
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.ville.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);
  
  // Fetch all users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("Récupération des utilisateurs...");
      
      const response = await getAllUsers();
      console.log("Réponse de l'API pour les utilisateurs:", response.data);
      
      if (!response.data) {
        console.error("Pas de données reçues de l'API");
        setError("Aucune donnée reçue du serveur");
        setUsers([]);
        setFilteredUsers([]);
        return;
      }
      
      if (response.data && Array.isArray(response.data.data)) {
        // Validate each user object
        const validatedUsers = response.data.data.filter((user: any) => {
          if (!user.id || !user.nom) {
            console.warn("Utilisateur invalide trouvé dans les données:", user);
            return false;
          }
          return true;
        });
        
        setUsers(validatedUsers);
        setFilteredUsers(validatedUsers);
      } else {
        console.warn("Format de données inattendu:", response.data);
        setUsers([]);
        setFilteredUsers([]);
        setError('Aucun utilisateur trouvé ou format de données incorrect');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name as string]: value
    });
  };
  
  // Open add user dialog
  const handleAddUser = () => {
    setFormValues(initialFormState);
    setOpenAddDialog(true);
  };
  
  // Open edit user dialog
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormValues({
      ...initialFormState,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      adresse: user.adresse || '',
      cp: user.cp || '',
      ville: user.ville || '',
      date_embauche: user.date_embauche || new Date().toISOString().slice(0, 10),
      type_utilisateur: user.type_utilisateur,
      login: user.login
    });
    setOpenEditDialog(true);
  };
  
  // Open view user dialog
  const handleViewUser = (user: User) => {
    setCurrentUser(user);
    setOpenViewDialog(true);
  };
  
  // Open delete user dialog
  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setOpenDeleteDialog(true);
  };
  
  // Save user (add or edit)
  const handleSaveUser = async () => {
    // Validation
    if (!formValues.nom || !formValues.prenom || !formValues.email || !formValues.login) {
      setSnackbar({
        open: true,
        message: 'Veuillez remplir tous les champs obligatoires',
        severity: 'error'
      });
      return;
    }
    
    // Password validation for new users
    if (openAddDialog && (!formValues.password || formValues.password !== formValues.confirmPassword)) {
      setSnackbar({
        open: true,
        message: 'Les mots de passe ne correspondent pas ou sont vides',
        severity: 'error'
      });
      return;
    }
    
    try {
      if (openAddDialog) {
        // Add new user
        const response = await addUser({
          nom: formValues.nom,
          prenom: formValues.prenom,
          email: formValues.email,
          adresse: formValues.adresse,
          cp: formValues.cp,
          ville: formValues.ville,
          date_embauche: formValues.date_embauche,
          type_utilisateur: formValues.type_utilisateur,
          login: formValues.login,
          password: formValues.password
        });
        
        if (response.data && response.data.status === 'success') {
          setSnackbar({
            open: true,
            message: 'Utilisateur ajouté avec succès',
            severity: 'success'
          });
          fetchUsers(); // Refresh the user list
        } else {
          throw new Error(response.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur');
        }
      } else if (currentUser) {
        // Update existing user
        const userData = {
          nom: formValues.nom,
          prenom: formValues.prenom,
          email: formValues.email,
          adresse: formValues.adresse,
          cp: formValues.cp,
          ville: formValues.ville,
          date_embauche: formValues.date_embauche,
          type_utilisateur: formValues.type_utilisateur,
          login: formValues.login
        };
        
        // Add password only if it's provided
        if (formValues.password && formValues.password === formValues.confirmPassword) {
          Object.assign(userData, { password: formValues.password });
        }
        
        const response = await updateUser(currentUser.id, userData);
        
        if (response.data && response.data.status === 'success') {
          setSnackbar({
            open: true,
            message: 'Utilisateur mis à jour avec succès',
            severity: 'success'
          });
          fetchUsers(); // Refresh the user list
        } else {
          throw new Error(response.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur');
        }
      }
      
      // Close dialogs
      setOpenAddDialog(false);
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'opération',
        severity: 'error'
      });
    }
  };
  
  // Confirm delete user
  const handleConfirmDelete = async () => {
    if (!currentUser) return;
    
    try {
      const response = await deleteUser(currentUser.id);
      
      if (response.data && response.data.status === 'success') {
        // Remove from local state
        const updatedUsers = users.filter(u => u.id !== currentUser.id);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        
        setSnackbar({
          open: true,
          message: 'Utilisateur supprimé avec succès',
          severity: 'success'
        });
      } else {
        throw new Error(response.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
      
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        severity: 'error'
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  // Get user role label
  const getUserRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
      case 'administrateur':
        return 'Administrateur';
      case 'visiteur':
        return 'Visiteur médical';
      case 'delegue':
        return 'Délégué régional';
      case 'responsable':
        return 'Responsable secteur';
      default:
        return role;
    }
  };
  
  // Get user role chip color
  const getUserRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case 'admin':
      case 'administrateur':
        return 'error';
      case 'delegue':
        return 'primary';
      case 'responsable':
        return 'secondary';
      case 'visiteur':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  if (!isAdmin) {
    return (
      <Layout title="Gestion des utilisateurs">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Accès restreint. Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Typography>
        </Box>
      </Layout>
    );
  }
  
  return (
    <Layout title="Gestion des utilisateurs">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Rechercher un utilisateur..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: '300px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
          >
            Nouvel utilisateur
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Identifiant</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Date d'embauche</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.prenom} {user.nom}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.login}</TableCell>
                      <TableCell>
                        <Chip
                          icon={user.type_utilisateur === 'admin' || user.type_utilisateur === 'administrateur' ? <AdminIcon /> : <PersonIcon />}
                          label={getUserRoleLabel(user.type_utilisateur)}
                          color={getUserRoleColor(user.type_utilisateur)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.date_embauche)}</TableCell>
                      <TableCell>
                        <Tooltip title="Voir les détails">
                          <IconButton size="small" onClick={() => handleViewUser(user)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => handleEditUser(user)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleDeleteUser(user)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
        
        {/* Add User Dialog */}
        <Dialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogContent dividers>
            <Box component="form" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              <TextField
                label="Nom"
                name="nom"
                value={formValues.nom}
                onChange={handleInputChange}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label="Prénom"
                name="prenom"
                value={formValues.prenom}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Identifiant"
                name="login"
                value={formValues.login}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Mot de passe"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formValues.password}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirmer le mot de passe"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formValues.confirmPassword}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  label="Rôle"
                  name="type_utilisateur"
                  value={formValues.type_utilisateur}
                  onChange={handleInputChange as (event: SelectChangeEvent<string>) => void}
                >
                  <MenuItem value="visiteur">Visiteur médical</MenuItem>
                  <MenuItem value="delegue">Délégué régional</MenuItem>
                  <MenuItem value="responsable">Responsable secteur</MenuItem>
                  <MenuItem value="admin">Administrateur</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Date d'embauche"
                name="date_embauche"
                type="date"
                value={formValues.date_embauche}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Adresse"
                name="adresse"
                value={formValues.adresse}
                onChange={handleInputChange}
                fullWidth
                sx={{ gridColumn: { sm: 'span 2' } }}
              />
              <TextField
                label="Code postal"
                name="cp"
                value={formValues.cp}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Ville"
                name="ville"
                value={formValues.ville}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveUser} variant="contained" color="primary">
              Ajouter
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Edit User Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogContent dividers>
            <Box component="form" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              <TextField
                label="Nom"
                name="nom"
                value={formValues.nom}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Prénom"
                name="prenom"
                value={formValues.prenom}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Identifiant"
                name="login"
                value={formValues.login}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label="Mot de passe (laisser vide pour ne pas modifier)"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formValues.password}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirmer le mot de passe"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formValues.confirmPassword}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  label="Rôle"
                  name="type_utilisateur"
                  value={formValues.type_utilisateur}
                  onChange={handleInputChange as (event: SelectChangeEvent<string>) => void}
                >
                  <MenuItem value="visiteur">Visiteur médical</MenuItem>
                  <MenuItem value="delegue">Délégué régional</MenuItem>
                  <MenuItem value="responsable">Responsable secteur</MenuItem>
                  <MenuItem value="admin">Administrateur</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Date d'embauche"
                name="date_embauche"
                type="date"
                value={formValues.date_embauche}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Adresse"
                name="adresse"
                value={formValues.adresse}
                onChange={handleInputChange}
                fullWidth
                sx={{ gridColumn: { sm: 'span 2' } }}
              />
              <TextField
                label="Code postal"
                name="cp"
                value={formValues.cp}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Ville"
                name="ville"
                value={formValues.ville}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveUser} variant="contained" color="primary">
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* View User Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Détails de l'utilisateur</DialogTitle>
          <DialogContent dividers>
            {currentUser && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                <Typography variant="subtitle2">Nom complet:</Typography>
                <Typography>{currentUser.prenom} {currentUser.nom}</Typography>
                
                <Typography variant="subtitle2">Email:</Typography>
                <Typography>{currentUser.email}</Typography>
                
                <Typography variant="subtitle2">Identifiant:</Typography>
                <Typography>{currentUser.login}</Typography>
                
                <Typography variant="subtitle2">Rôle:</Typography>
                <Chip
                  label={getUserRoleLabel(currentUser.type_utilisateur)}
                  color={getUserRoleColor(currentUser.type_utilisateur)}
                  size="small"
                />
                
                <Typography variant="subtitle2">Date d'embauche:</Typography>
                <Typography>{formatDate(currentUser.date_embauche)}</Typography>
                
                {currentUser.adresse && (
                  <>
                    <Typography variant="subtitle2">Adresse:</Typography>
                    <Typography>
                      {currentUser.adresse}<br />
                      {currentUser.cp} {currentUser.ville}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
            <Button
              onClick={() => {
                setOpenViewDialog(false);
                currentUser && handleEditUser(currentUser);
              }}
              color="primary"
            >
              Modifier
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmation de suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </Typography>
            {currentUser && (
              <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                {currentUser.prenom} {currentUser.nom} ({currentUser.email})
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
            <Button onClick={handleConfirmDelete} color="error">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default Users; 