import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  useTheme,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  SelectChangeEvent,
  Pagination,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalHospital,
  Phone,
  LocationOn,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getAllMedecins, getMedecinById, addMedecin, updateMedecin } from '../services/api';
import Layout from '../components/Layout';
import CustomGrid from '../components/CustomGrid';

// Types pour les données
interface Medecin {
  id: string | number;
  nom: string;
  prenom: string;
  adresse: string;
  tel: string;
  specialitecomplementaire?: string;
  departement: string;
}

const Medecins: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [filteredMedecins, setFilteredMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentMedecin, setCurrentMedecin] = useState<Medecin | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterSpecialite, setFilterSpecialite] = useState('');
  const [openFilter, setOpenFilter] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);

  // Nouvelles valeurs pour l'édition/création
  const [formValues, setFormValues] = useState<Partial<Medecin>>({
    nom: '',
    prenom: '',
    adresse: '',
    tel: '',
    specialitecomplementaire: '',
    departement: ''
  });

  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur';

  // Récupérer les médecins
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getAllMedecins();
        console.log("Médecins data:", response.data);
        if (response.data && Array.isArray(response.data.data)) {
          setMedecins(response.data.data);
          setFilteredMedecins(response.data.data);
        } else {
          setMedecins([]);
          setFilteredMedecins([]);
          setError('Aucune donnée trouvée');
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des médecins:", error);
        setError('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrer les médecins
  useEffect(() => {
    if (medecins.length > 0) {
      let result = [...medecins];

      // Filtre par recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        result = result.filter(
          (medecin) =>
            medecin.nom.toLowerCase().includes(search) ||
            medecin.prenom.toLowerCase().includes(search) ||
            medecin.adresse.toLowerCase().includes(search)
        );
      }

      // Filtre par département
      if (filterDept) {
        result = result.filter(
          (medecin) => medecin.departement.toLowerCase() === filterDept.toLowerCase()
        );
      }

      // Filtre par spécialité
      if (filterSpecialite) {
        result = result.filter(
          (medecin) =>
            medecin.specialitecomplementaire &&
            medecin.specialitecomplementaire.toLowerCase() === filterSpecialite.toLowerCase()
        );
      }

      setFilteredMedecins(result);
    }
  }, [searchTerm, filterDept, filterSpecialite, medecins]);

  const handleAddMedecin = () => {
    setFormValues({
      nom: '',
      prenom: '',
      adresse: '',
      tel: '',
      specialitecomplementaire: '',
      departement: ''
    });
    setOpenAddDialog(true);
  };

  const handleEditMedecin = (medecin: Medecin) => {
    setCurrentMedecin(medecin);
    setFormValues({
      nom: medecin.nom,
      prenom: medecin.prenom,
      adresse: medecin.adresse,
      tel: medecin.tel,
      specialitecomplementaire: medecin.specialitecomplementaire || '',
      departement: medecin.departement
    });
    setOpenEditDialog(true);
  };

  const handleViewMedecin = (medecin: Medecin) => {
    setCurrentMedecin(medecin);
    setOpenViewDialog(true);
  };

  const handleDeleteMedecin = (medecin: Medecin) => {
    setCurrentMedecin(medecin);
    setOpenDeleteDialog(true);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name as string]: value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<unknown>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name as string]: value
    });
  };

  const handleSaveMedecin = async () => {
    try {
      if (openAddDialog) {
        // Add new doctor
        const response = await addMedecin(
          formValues.nom || '',
          formValues.prenom || '',
          formValues.adresse || '',
          formValues.tel || '',
          formValues.specialitecomplementaire || '',
          formValues.departement || ''
        );
        
        if (response.data && response.data.status === "success") {
          // Refresh the list
          const updatedResponse = await getAllMedecins();
          setMedecins(updatedResponse.data.data);
          setFilteredMedecins(updatedResponse.data.data);
          setSnackbar({ open: true, message: 'Médecin ajouté avec succès', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Erreur lors de l\'ajout du médecin', severity: 'error' });
        }
      } else {
        // Update existing doctor
        if (currentMedecin) {
          const response = await updateMedecin(
            currentMedecin.id.toString(),
            formValues.adresse || '',
            formValues.tel || '',
            formValues.specialitecomplementaire || ''
          );
          
          if (response.data && response.data.status === "success") {
            // Refresh the list
            const updatedResponse = await getAllMedecins();
            setMedecins(updatedResponse.data.data);
            setFilteredMedecins(updatedResponse.data.data);
            setSnackbar({ open: true, message: 'Médecin mis à jour avec succès', severity: 'success' });
          } else {
            setSnackbar({ open: true, message: 'Erreur lors de la mise à jour du médecin', severity: 'error' });
          }
        }
      }
      setOpenAddDialog(false);
      setOpenEditDialog(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement du médecin', severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    // In a real app, you would call an API to delete the doctor
    if (currentMedecin) {
      try {
        // Assuming there's a delete endpoint
        // const response = await deleteMedecin(currentMedecin.id);
        
        // For now, we'll just remove it from the local state
        const updatedMedecins = medecins.filter(m => m.id !== currentMedecin.id);
        setMedecins(updatedMedecins);
        setFilteredMedecins(updatedMedecins);
        setSnackbar({ open: true, message: 'Médecin supprimé avec succès', severity: 'success' });
        setOpenDeleteDialog(false);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setSnackbar({ open: true, message: 'Erreur lors de la suppression du médecin', severity: 'error' });
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDept('');
    setFilterSpecialite('');
    setOpenFilter(false);
  };

  const getAvatarColor = (id: string | number) => {
    const colors = [
      '#1976d2', // primary
      '#dc004e', // secondary
      '#4caf50', // success
      '#ff9800', // warning
      '#9c27b0'  // purple
    ];
    // Convert id to string and generate an index based on it
    const idString = String(id);
    const index = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Card variants for animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        type: 'spring',
        stiffness: 100
      }
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  // Départements disponibles (exemple)
  const departements = [
    { id: '75', nom: 'Paris' },
    { id: '69', nom: 'Rhône' },
    { id: '13', nom: 'Bouches-du-Rhône' },
    { id: '33', nom: 'Gironde' },
    { id: '59', nom: 'Nord' }
  ];

  // Spécialités disponibles (exemple)
  const specialites = [
    { id: 'cardio', nom: 'Cardiologie' },
    { id: 'dermato', nom: 'Dermatologie' },
    { id: 'gastro', nom: 'Gastro-entérologie' },
    { id: 'neuro', nom: 'Neurologie' },
    { id: 'pediatrie', nom: 'Pédiatrie' }
  ];

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate pagination
  const paginatedMedecins = filteredMedecins.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Layout title="Médecins">
      <Box sx={{ mb: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher par nom, prénom ou adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: { sm: 400 } }}
            />
          </Box>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' }
            }}
          >
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setOpenFilter(!openFilter)}
              variant={openFilter ? "contained" : "outlined"}
              color="primary"
              size="small"
              sx={{
                minWidth: 100,
                '&:hover': {
                  boxShadow: theme.shadows[2]
                }
              }}
            >
              Filtres
            </Button>

            {isAdmin && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMedecin}
                sx={{
                  fontWeight: 500,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                Nouveau Médecin
              </Button>
            )}
          </Box>
        </Box>

        {/* Filtres supplémentaires */}
        <AnimatePresence>
          {openFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <FormControl size="small" fullWidth variant="outlined">
                    <InputLabel id="departement-label">Département</InputLabel>
                    <Select
                      labelId="departement-label"
                      id="departement"
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value as string)}
                      label="Département"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {departements.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth variant="outlined">
                    <InputLabel id="specialite-label">Spécialité</InputLabel>
                    <Select
                      labelId="specialite-label"
                      id="specialite"
                      value={filterSpecialite}
                      onChange={(e) => setFilterSpecialite(e.target.value as string)}
                      label="Spécialité"
                    >
                      <MenuItem value="">Toutes</MenuItem>
                      {specialites.map((spec) => (
                        <MenuItem key={spec.id} value={spec.id}>
                          {spec.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button 
                    color="primary" 
                    onClick={clearFilters} 
                    sx={{ alignSelf: { sm: 'center' } }}
                  >
                    Réinitialiser
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <AnimatePresence>
            <CustomGrid container spacing={3}>
              {filteredMedecins.length === 0 ? (
                <CustomGrid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">Aucun médecin trouvé</Typography>
                  </Paper>
                </CustomGrid>
              ) : (
                paginatedMedecins.map((medecin, index) => (
                  <CustomGrid item xs={12} sm={6} md={4} key={medecin.id}>
                    <motion.div
                      layout
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={cardVariants}
                    >
                      <Card
                        elevation={2}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: theme.palette.background.paper,
                          borderRadius: 2,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8]
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar 
                              sx={{ 
                                bgcolor: getAvatarColor(medecin.id),
                                mr: 2
                              }}
                            >
                              {medecin.prenom[0]}{medecin.nom[0]}
                            </Avatar>
                            <Typography variant="h6" component="div">
                              Dr. {medecin.prenom} {medecin.nom}
                            </Typography>
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          {medecin.specialitecomplementaire && (
                            <Chip
                              label={medecin.specialitecomplementaire}
                              size="small"
                              sx={{ mb: 2 }}
                            />
                          )}

                          <Box display="flex" alignItems="center" mb={1}>
                            <LocationOn fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                            <Typography variant="body2" color="text.secondary">
                              {medecin.adresse}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center" mb={1}>
                            <Phone fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                            <Typography variant="body2" color="text.secondary">
                              {medecin.tel}
                            </Typography>
                          </Box>
                        </CardContent>

                        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewMedecin(medecin)}
                            color="primary"
                            sx={{
                              '&:hover': {
                                backgroundColor: theme.palette.primary.light + '20'
                              }
                            }}
                          >
                            <InfoIcon />
                          </IconButton>
                          
                          {isAdmin && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleEditMedecin(medecin)}
                                color="primary"
                                sx={{
                                  '&:hover': {
                                    backgroundColor: theme.palette.primary.light + '20'
                                  }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMedecin(medecin)}
                                color="error"
                                sx={{
                                  '&:hover': {
                                    backgroundColor: theme.palette.error.light + '20'
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </CardActions>
                      </Card>
                    </motion.div>
                  </CustomGrid>
                ))
              )}
            </CustomGrid>
            
            {/* Pagination */}
            {filteredMedecins.length > 0 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div"
                  count={filteredMedecins.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[9, 18, 36, 72]}
                  labelRowsPerPage="Médecins par page:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                  sx={{
                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                      margin: 0,
                    },
                  }}
                />
              </Box>
            )}
          </AnimatePresence>
        )}

        {/* Dialog d'ajout/édition */}
        <Dialog
          open={openAddDialog || openEditDialog}
          onClose={() => {
            setOpenAddDialog(false);
            setOpenEditDialog(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {openAddDialog ? 'Ajouter un médecin' : 'Modifier un médecin'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <CustomGrid container spacing={2}>
                <CustomGrid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    name="nom"
                    value={formValues.nom}
                    onChange={handleTextInputChange}
                    required
                  />
                </CustomGrid>
                <CustomGrid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    name="prenom"
                    value={formValues.prenom}
                    onChange={handleTextInputChange}
                    required
                  />
                </CustomGrid>
                <CustomGrid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresse"
                    name="adresse"
                    value={formValues.adresse}
                    onChange={handleTextInputChange}
                    required
                  />
                </CustomGrid>
                <CustomGrid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    name="tel"
                    value={formValues.tel}
                    onChange={handleTextInputChange}
                    required
                  />
                </CustomGrid>
                <CustomGrid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Département</InputLabel>
                    <Select
                      name="departement"
                      value={formValues.departement}
                      onChange={handleSelectChange}
                      label="Département"
                      required
                    >
                      {departements.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CustomGrid>
                <CustomGrid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Spécialité complémentaire</InputLabel>
                    <Select
                      name="specialitecomplementaire"
                      value={formValues.specialitecomplementaire}
                      onChange={handleSelectChange}
                      label="Spécialité complémentaire"
                    >
                      <MenuItem value="">Aucune</MenuItem>
                      {specialites.map((spec) => (
                        <MenuItem key={spec.id} value={spec.id}>
                          {spec.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CustomGrid>
              </CustomGrid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenAddDialog(false);
                setOpenEditDialog(false);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveMedecin} variant="contained" color="primary">
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de suppression */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer le médecin {currentMedecin?.prenom} {currentMedecin?.nom} ?
              Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
            <Button onClick={handleConfirmDelete} color="error">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de visualisation */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          fullWidth
          maxWidth="md"
        >
          {currentMedecin && (
            <>
              <DialogTitle>
                Dr. {currentMedecin.prenom} {currentMedecin.nom}
                <IconButton
                  aria-label="close"
                  onClick={() => setOpenViewDialog(false)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Box sx={{ p: 2 }}>
                  <CustomGrid container spacing={3}>
                    <CustomGrid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Nom complet
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Dr. {currentMedecin.prenom} {currentMedecin.nom}
                      </Typography>
                    </CustomGrid>
                    <CustomGrid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Département
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {departements.find(d => d.id === currentMedecin.departement)?.nom || currentMedecin.departement}
                      </Typography>
                    </CustomGrid>
                    <CustomGrid item xs={12}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Adresse
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {currentMedecin.adresse}
                      </Typography>
                    </CustomGrid>
                    <CustomGrid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Téléphone
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {currentMedecin.tel}
                      </Typography>
                    </CustomGrid>
                    <CustomGrid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Spécialité complémentaire
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {specialites.find(s => s.id === currentMedecin.specialitecomplementaire)?.nom || currentMedecin.specialitecomplementaire || 'Aucune'}
                      </Typography>
                    </CustomGrid>
                  </CustomGrid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Dernières visites
                  </Typography>
                  {/* Ici on pourrait afficher l'historique des visites si disponible */}
                  <Typography variant="body2" color="textSecondary">
                    Aucune visite enregistrée
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenViewDialog(false)}>
                  Fermer
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => {
                      setOpenViewDialog(false);
                      handleEditMedecin(currentMedecin);
                    }}
                    color="primary"
                  >
                    Modifier
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Snackbar de notification */}
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

export default Medecins; 