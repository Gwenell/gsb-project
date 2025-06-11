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
  username: string;
  adresse: string;
  cp: string;
  ville: string;
  dateEmbauche: string;
  type_utilisateur: string;
}

// Initial form state
const initialFormState = {
  nom: '',
  prenom: '',
  username: '',
  adresse: '',
  cp: '',
  ville: '',
  dateEmbauche: new Date().toISOString().slice(0, 10),
  type_utilisateur: 'visiteur',
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
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      console.log("Réponse de l'API pour les utilisateurs:", response);
      
      if (response.status === 'error') {
        setError(response.message || "Erreur lors de la récupération des utilisateurs");
        setUsers([]);
        setFilteredUsers([]);
        return;
      }
      
      let userData = [];
      
      if (Array.isArray(response.data)) {
        console.log("Format tableau direct");
        userData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        console.log("Format avec data.data");
        userData = response.data.data;
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        console.log("Format avec data.users");
        userData = response.data.users;
      } else if (response.data) {
        console.log("Tentative d'extraction manuelle");
        // Tenter d'extraire n'importe quel tableau dans la réponse
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          userData = possibleArrays[0] as any[];
        }
      }
      
      if (userData.length === 0) {
        console.warn("Aucun utilisateur trouvé dans les données:", response.data);
        setError('Aucun utilisateur trouvé');
      } else {
        console.log(`${userData.length} utilisateurs trouvés`);
        // Validation et nettoyage des données
        const validatedUsers = userData
          .filter((user: any) => user && typeof user === 'object' && user.id)
          .map((user: any) => ({
            id: user.id,
            nom: user.nom || '',
            prenom: user.prenom || '',
            username: user.username || '',
            adresse: user.adresse || '',
            cp: user.cp || '',
            ville: user.ville || '',
            dateEmbauche: user.dateEmbauche || '',
            type_utilisateur: user.type_utilisateur || 'visiteur',
          }));
        
        setUsers(validatedUsers);
        setFilteredUsers(validatedUsers);
        setError('');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Erreur lors du chargement des utilisateurs');
      setUsers([]);
      setFilteredUsers([]);
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
      username: user.username,
      adresse: user.adresse || '',
      cp: user.cp || '',
      ville: user.ville || '',
      dateEmbauche: user.dateEmbauche || new Date().toISOString().slice(0, 10),
      type_utilisateur: user.type_utilisateur,
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
    if (!formValues.nom || !formValues.prenom || !formValues.username) {
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
          username: formValues.username,
          adresse: formValues.adresse,
          cp: formValues.cp,
          ville: formValues.ville,
          dateEmbauche: formValues.dateEmbauche,
          type_utilisateur: formValues.type_utilisateur,
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
          username: formValues.username,
          adresse: formValues.adresse,
          cp: formValues.cp,
          ville: formValues.ville,
          dateEmbauche: formValues.dateEmbauche,
          type_utilisateur: formValues.type_utilisateur,
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
      
      if (response.status === 'success') {
        // Remove from local state
        const updatedUsers = users.filter(u => u.id !== currentUser.id);
        setUsers(updatedUsers);
        setSnackbar({
          open: true,
          message: 'Utilisateur supprimé avec succès',
          severity: 'success'
        });
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression de l\'utilisateur');
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return 'Date invalide';
    }
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Prénom</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nom d'utilisateur</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ville</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rôle</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date d'embauche</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
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
                      <TableCell>{user.nom}</TableCell>
                      <TableCell>{user.prenom}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.ville}</TableCell>
                      <TableCell>
                        <Chip
                          label={getUserRoleLabel(user.type_utilisateur)}
                          color={getUserRoleColor(user.type_utilisateur)}
                          size="small"
                          icon={user.type_utilisateur.includes('admin') ? <AdminIcon /> : <PersonIcon />}
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.dateEmbauche)}</TableCell>
                      <TableCell sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Voir les détails">
                          <IconButton onClick={() => handleViewUser(user)} color="info">
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
                label="Nom d'utilisateur"
                name="username"
                value={formValues.username}
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
                name="dateEmbauche"
                type="date"
                value={formValues.dateEmbauche}
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
                label="Nom d'utilisateur"
                name="username"
                value={formValues.username}
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
                name="dateEmbauche"
                type="date"
                value={formValues.dateEmbauche}
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
                <Typography>{currentUser.nom} {currentUser.prenom}</Typography>
                
                <Typography variant="subtitle2">Nom d'utilisateur:</Typography>
                <Typography>{currentUser.username}</Typography>
                
                <Typography variant="subtitle2">Adresse:</Typography>
                <Typography>
                  {currentUser.adresse}<br />
                  {currentUser.cp} {currentUser.ville}
                </Typography>
                
                <Typography variant="subtitle2">Rôle:</Typography>
                <Chip
                  label={getUserRoleLabel(currentUser.type_utilisateur)}
                  color={getUserRoleColor(currentUser.type_utilisateur)}
                  size="small"
                />
                
                <Typography variant="subtitle2">Date d'embauche:</Typography>
                <Typography>{formatDate(currentUser.dateEmbauche)}</Typography>
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
                {currentUser.nom} {currentUser.prenom} ({currentUser.username})
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