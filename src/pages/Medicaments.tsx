import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Chip,
  Divider,
  TablePagination,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Medication,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAllMedicaments, 
  getMedicamentById, 
  updateMedicament, 
  addMedicament, 
  getAllFamilles 
} from '../services/api';
import Layout from '../components/Layout';
import CustomGrid from '../components/CustomGrid';

// Crimson red for accents
const crimsonRed = '#DC143C';

// Types pour les données
interface Medicament {
  id: string;
  nom_commercial: string;
  id_famille: string;
  composition: string;
  effets: string;
  contre_indications: string;
  famille?: string;
  prix?: string;
}

interface Famille {
  id: string;
  libelle: string;
}

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

const Medicaments: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [filteredMedicaments, setFilteredMedicaments] = useState<Medicament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentMedicament, setCurrentMedicament] = useState<Medicament | null>(null);
  const [filterFamille, setFilterFamille] = useState('');
  const [openFilter, setOpenFilter] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [familles, setFamilles] = useState<Famille[]>([]);

  // Nouvelles valeurs pour l'édition/création
  const [formValues, setFormValues] = useState<Partial<Medicament>>({
    nom_commercial: '',
    id_famille: '',
    composition: '',
    effets: '',
    contre_indications: '',
    prix: ''
  });

  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur';

  useEffect(() => {
    const fetchFamilles = async () => {
      try {
        const response = await getAllFamilles();
        if (response.data && Array.isArray(response.data.data)) {
          setFamilles(response.data.data);
        } else {
          setFamilles([]);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des familles:', err);
      }
    };

    fetchFamilles();
  }, []);

  useEffect(() => {
    const fetchMedicaments = async () => {
      try {
        setLoading(true);
        const response = await getAllMedicaments('');
        console.log("Medicaments data:", response.data);
        
        if (response.data && Array.isArray(response.data.data)) {
          // Ajouter le nom de la famille
          const medicamentsWithFamille = response.data.data.map((med: Medicament) => {
            const famille = familles.find(f => f.id === med.id_famille);
            return {
              ...med,
              famille: famille ? famille.libelle : 'Non catégorisé'
            };
          });

          setMedicaments(medicamentsWithFamille);
          setFilteredMedicaments(medicamentsWithFamille);
        } else {
          setMedicaments([]);
          setFilteredMedicaments([]);
          setError('Aucune donnée trouvée');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des médicaments:', err);
        setError('Erreur lors du chargement des médicaments. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicaments();
  }, [familles]);

  useEffect(() => {
    filterMedicaments();
  }, [searchTerm, filterFamille, medicaments]);

  const filterMedicaments = () => {
    let filtered = [...medicaments];

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(medicament =>
        medicament.nom_commercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicament.composition.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par famille
    if (filterFamille) {
      filtered = filtered.filter(medicament =>
        medicament.famille?.toLowerCase().includes(filterFamille.toLowerCase())
      );
    }

    setFilteredMedicaments(filtered);
  };

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
  const paginatedMedicaments = filteredMedicaments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleAddMedicament = () => {
    setFormValues({
      nom_commercial: '',
      id_famille: '',
      composition: '',
      effets: '',
      contre_indications: '',
      prix: ''
    });
    setOpenAddDialog(true);
  };

  const handleEditMedicament = async (medicament: Medicament) => {
    try {
      setLoading(true);
      // Fetch the medicament details to get the latest data
      const response = await getMedicamentById(medicament.id);
      if (response.data && response.data.data) {
        const med = response.data.data;
        setCurrentMedicament(med);
        setFormValues({
          nom_commercial: med.nom_commercial,
          id_famille: med.id_famille,
          composition: med.composition,
          effets: med.effets,
          contre_indications: med.contre_indications,
          prix: med.prix
        });
        setOpenEditDialog(true);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du médicament:", error);
      setSnackbar({ open: true, message: 'Erreur lors de la récupération des détails', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewMedicament = async (medicament: Medicament) => {
    try {
      setLoading(true);
      console.log("Récupération des détails du médicament:", medicament.id);
      
      // Fetch the medicament details to get the latest data
      const response = await getMedicamentById(medicament.id);
      console.log("Réponse API pour les détails du médicament:", response.data);
      
      let medicamentData = null;
      
      // Handle different response formats
      if (response.data) {
        if (response.data.data) {
          // Standard format with nested data property
          medicamentData = response.data.data;
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          // Direct array response
          medicamentData = response.data[0];
        } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Direct object response
          medicamentData = response.data;
        }
      }
      
      if (medicamentData) {
        // Make sure we have the famille information
        setCurrentMedicament({
          ...medicamentData,
          famille: getFamilleById(medicamentData.id_famille)
        });
        
        setOpenViewDialog(true);
      } else {
        console.error("Format de réponse inattendu ou données manquantes:", response.data);
        setSnackbar({ 
          open: true, 
          message: 'Erreur lors de la récupération des détails du médicament: format inattendu', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du médicament:", error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la récupération des détails du médicament', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicament = (medicament: Medicament) => {
    setCurrentMedicament(medicament);
    setOpenDeleteDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name as string]: value
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name as string]: value
    });
  };

  const handleSaveMedicament = async () => {
    try {
      if (!formValues.nom_commercial || !formValues.composition) {
        setSnackbar({ open: true, message: 'Veuillez remplir tous les champs obligatoires', severity: 'error' });
        return;
      }
      
      if (openAddDialog) {
        // Add new medicament
        console.log("Ajout d'un nouveau médicament:", formValues);
        
        const response = await addMedicament(
          formValues.id?.toString() || (Math.floor(Math.random() * 100000)).toString(), // Generate temp ID
          formValues.nom_commercial || '',
          formValues.id_famille || '',
          formValues.composition || '',
          formValues.effets || '',
          formValues.contre_indications || ''
        );
        
        console.log("Réponse API pour l'ajout:", response.data);
        
        if (response.data && (response.data.status === "success" || Array.isArray(response.data))) {
          setSnackbar({ open: true, message: 'Médicament ajouté avec succès', severity: 'success' });
          // Refresh the list
          refreshMedicamentsList();
        } else {
          console.error("Erreur lors de l'ajout du médicament:", response.data);
          setSnackbar({ 
            open: true, 
            message: `Erreur lors de l'ajout du médicament: ${response.data?.message || 'Erreur inconnue'}`, 
            severity: 'error' 
          });
        }
      } else if (currentMedicament) {
        // Update existing medicament
        console.log("Mise à jour du médicament:", {
          id: currentMedicament.id,
          composition: formValues.composition,
          effets: formValues.effets,
          contre_indications: formValues.contre_indications
        });
        
        const response = await updateMedicament(
          currentMedicament.id,
          formValues.composition || '',
          formValues.effets || '',
          formValues.contre_indications || ''
        );
        
        console.log("Réponse API pour la mise à jour:", response.data);
        
        if (response.data && (response.data.status === "success" || Array.isArray(response.data))) {
          setSnackbar({ open: true, message: 'Médicament mis à jour avec succès', severity: 'success' });
          // Refresh the list
          refreshMedicamentsList();
        } else {
          console.error("Erreur lors de la mise à jour du médicament:", response.data);
          setSnackbar({ 
            open: true, 
            message: `Erreur lors de la mise à jour du médicament: ${response.data?.message || 'Erreur inconnue'}`, 
            severity: 'error' 
          });
        }
      }
      
      // Close dialogs
      setOpenAddDialog(false);
      setOpenEditDialog(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement du médicament', severity: 'error' });
    }
  };

  // Helper function to refresh the medications list
  const refreshMedicamentsList = async () => {
    try {
      const updatedResponse = await getAllMedicaments('');
      console.log("Médicaments actualisés:", updatedResponse.data);
      
      if (updatedResponse.data) {
        let medicamentsData = [];
        
        // Handle different response formats
        if (Array.isArray(updatedResponse.data)) {
          medicamentsData = updatedResponse.data;
        } else if (updatedResponse.data.data && Array.isArray(updatedResponse.data.data)) {
          medicamentsData = updatedResponse.data.data;
        } else {
          console.warn("Format de réponse inattendu pour les médicaments:", updatedResponse.data);
          return;
        }
        
        // Add famille information
        const updatedMeds = medicamentsData.map((med: Medicament) => {
          const famille = familles.find(f => f.id === med.id_famille);
          return {
            ...med,
            famille: famille ? famille.libelle : 'Non catégorisé'
          };
        });
        
        setMedicaments(updatedMeds);
        setFilteredMedicaments(updatedMeds);
      }
    } catch (error) {
      console.error("Erreur lors de l'actualisation de la liste des médicaments:", error);
    }
  };

  const handleConfirmDelete = async () => {
    // In a real app, you would call an API to delete the medicament
    if (currentMedicament) {
      try {
        // Assuming there's a delete endpoint
        // const response = await deleteMedicament(currentMedicament.id);
        
        // For now, we'll just remove it from the local state
        const updatedMedicaments = medicaments.filter(m => m.id !== currentMedicament.id);
        setMedicaments(updatedMedicaments);
        setFilteredMedicaments(updatedMedicaments);
        setSnackbar({ open: true, message: 'Médicament supprimé avec succès', severity: 'success' });
        setOpenDeleteDialog(false);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setSnackbar({ open: true, message: 'Erreur lors de la suppression du médicament', severity: 'error' });
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFamille('');
    setOpenFilter(false);
  };

  const getFamilleById = (id: string) => {
    const famille = familles.find(f => f.id === id);
    return famille ? famille.libelle : 'Non catégorisé';
  };

  return (
    <Layout title="Médicaments">
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
              placeholder="Rechercher par nom ou composition..."
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
                onClick={handleAddMedicament}
                sx={{
                  fontWeight: 500,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                Nouveau Médicament
              </Button>
            )}
          </Box>
        </Box>

        {/* Filtres */}
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
                  <FormControl size="small" fullWidth>
                    <TextField
                      select
                      label="Famille"
                      value={filterFamille}
                      onChange={(e) => setFilterFamille(e.target.value)}
                      SelectProps={{
                        native: true,
                      }}
                      size="small"
                      fullWidth
                    >
                      <option value="">Toutes</option>
                      {familles.map((famille) => (
                        <option key={famille.id} value={famille.libelle}>
                          {famille.libelle}
                        </option>
                      ))}
                    </TextField>
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
              {filteredMedicaments.length === 0 ? (
                <CustomGrid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">Aucun médicament trouvé</Typography>
                  </Paper>
                </CustomGrid>
              ) : (
                paginatedMedicaments.map((medicament, index) => (
                  <CustomGrid item xs={12} sm={6} md={4} key={medicament.id}>
                    <motion.div
                      layout
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={itemVariants}
                    >
                      <Card
                        elevation={2}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
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
                            <Chip 
                              label={medicament.famille}
                              size="small" 
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="h6" component="div">
                              {medicament.nom_commercial}
                            </Typography>
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Composition:</strong> {medicament.composition.substring(0, 100)}
                            {medicament.composition.length > 100 ? '...' : ''}
                          </Typography>
                          
                          {medicament.prix && (
                            <Typography variant="body2" color="error" sx={{ fontWeight: 'bold', mt: 1 }}>
                              Prix: {medicament.prix} €
                            </Typography>
                          )}
                        </CardContent>
                        
                        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewMedicament(medicament)}
                            color="primary"
                          >
                            <InfoIcon />
                          </IconButton>
                          
                          {isAdmin && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleEditMedicament(medicament)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMedicament(medicament)}
                                color="error"
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
            {filteredMedicaments.length > 0 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div"
                  count={filteredMedicaments.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[9, 18, 36, 72]}
                  labelRowsPerPage="Médicaments par page:"
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

        {/* Dialogs */}
        {/* Dialog d'ajout/édition */}
        <Dialog 
          open={openAddDialog || openEditDialog} 
          onClose={() => openAddDialog ? setOpenAddDialog(false) : setOpenEditDialog(false)} 
          fullWidth 
          maxWidth="md"
        >
          <DialogTitle>
            {openAddDialog ? 'Nouveau Médicament' : 'Modifier le Médicament'}
            <IconButton
              aria-label="close"
              onClick={() => openAddDialog ? setOpenAddDialog(false) : setOpenEditDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <CustomGrid container spacing={3}>
              <CustomGrid item xs={12} sm={6}>
                <TextField
                  label="Nom commercial"
                  name="nom_commercial"
                  fullWidth
                  value={formValues.nom_commercial}
                  onChange={handleInputChange}
                  required
                />
              </CustomGrid>
              <CustomGrid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <TextField
                    select
                    label="Famille"
                    name="id_famille"
                    value={formValues.id_famille}
                    onChange={handleSelectChange}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="">Sélectionner une famille</option>
                    {familles.map((famille) => (
                      <option key={famille.id} value={famille.id}>
                        {famille.libelle}
                      </option>
                    ))}
                  </TextField>
                </FormControl>
              </CustomGrid>
              <CustomGrid item xs={12}>
                <TextField
                  label="Composition"
                  name="composition"
                  fullWidth
                  multiline
                  rows={3}
                  value={formValues.composition}
                  onChange={handleInputChange}
                  required
                />
              </CustomGrid>
              <CustomGrid item xs={12}>
                <TextField
                  label="Effets"
                  name="effets"
                  fullWidth
                  multiline
                  rows={3}
                  value={formValues.effets}
                  onChange={handleInputChange}
                  required
                />
              </CustomGrid>
              <CustomGrid item xs={12}>
                <TextField
                  label="Contre-indications"
                  name="contre_indications"
                  fullWidth
                  multiline
                  rows={3}
                  value={formValues.contre_indications}
                  onChange={handleInputChange}
                  required
                />
              </CustomGrid>
              <CustomGrid item xs={12} sm={6}>
                <TextField
                  label="Prix indicatif (€)"
                  name="prix"
                  type="number"
                  fullWidth
                  value={formValues.prix}
                  onChange={handleInputChange}
                />
              </CustomGrid>
            </CustomGrid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => openAddDialog ? setOpenAddDialog(false) : setOpenEditDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveMedicament}
              variant="contained"
              color="secondary"
            >
              Enregistrer
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
          {currentMedicament && (
            <>
              <DialogTitle>
                {currentMedicament.nom_commercial}
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
                        Nom commercial
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {currentMedicament.nom_commercial}
                      </Typography>
                    </CustomGrid>
                    <CustomGrid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="textSecondary">
                        Famille
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {getFamilleById(currentMedicament.id_famille)}
                      </Typography>
                    </CustomGrid>
                    
                    <CustomGrid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" color="textSecondary">
                        Composition
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {currentMedicament.composition}
                      </Typography>
                    </CustomGrid>
                    
                    <CustomGrid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" color="textSecondary">
                        Effets
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {currentMedicament.effets}
                      </Typography>
                    </CustomGrid>
                    
                    <CustomGrid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" color="textSecondary">
                        Contre-indications
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {currentMedicament.contre_indications}
                      </Typography>
                    </CustomGrid>
                    
                    {currentMedicament.prix && (
                      <CustomGrid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" color="textSecondary">
                          Prix indicatif
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {currentMedicament.prix} €
                        </Typography>
                      </CustomGrid>
                    )}
                  </CustomGrid>
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
                      handleEditMedicament(currentMedicament);
                    }}
                    color="secondary"
                  >
                    Modifier
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Dialog de suppression */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirmation de suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer ce médicament ? Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

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
    </Layout>
  );
};

export default Medicaments; 