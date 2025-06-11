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
  Close as CloseIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAllMedicaments, 
  getMedicamentById, 
  updateMedicament, 
  addMedicament, 
  getAllFamilles,
  deleteMedicament
} from '../services/api';
import Layout from '../components/Layout';
import CustomGrid from '../components/CustomGrid';

// Types pour les données
interface Medicament {
  id: string;
  nom_commercial: string;
  nomCommercial?: string;
  id_famille: string;
  idFamille?: string;
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

// Animations des cartes
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

  // Ajout du state pour le tri
  const [sortBy, setSortBy] = useState<{
    field: keyof Medicament | '';
    order: 'asc' | 'desc';
  }>({
    field: 'nom_commercial',
    order: 'asc'
  });

  // Nouvelles valeurs pour l'édition/création
  const [formValues, setFormValues] = useState<Partial<Medicament>>({
    nom_commercial: '',
    id_famille: '',
    composition: '',
    effets: '',
    contre_indications: '',
    prix: ''
  });

  const isAdmin = user?.type_utilisateur === 'admin' || user?.type_utilisateur === 'administrateur' || user?.type_utilisateur === 'responsable';

  useEffect(() => {
    const fetchFamilles = async () => {
      try {
        const response = await getAllFamilles();
        console.log("Familles data:", response);
        
        if (response.status === 'success') {
          let famillesData = response.data;
          if (Array.isArray(famillesData) && famillesData.length > 0) {
            setFamilles(famillesData);
          } else if (response.data && Array.isArray(response.data.data)) {
            // Fallback pour une structure alternative
          setFamilles(response.data.data);
        } else {
            console.warn("Format inattendu pour les familles:", response.data);
            setFamilles([]);
          }
        } else {
          console.error("Erreur lors de la récupération des familles:", response.message);
          setFamilles([]);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des familles:', err);
        setFamilles([]);
      }
    };

    fetchFamilles();
  }, []);

  useEffect(() => {
    const fetchMedicaments = async () => {
      try {
        setLoading(true);
        const response = await getAllMedicaments('');
        console.log("Medicaments data:", response);
        
        if (response.status === 'success') {
          let medicamentsData = response.data;
          if (Array.isArray(medicamentsData) && medicamentsData.length > 0) {
            // S'assurer que chaque médicament a les bons champs
            const medicamentsNormalized = medicamentsData.map((med: any) => {
              // Utiliser nomCommercial si nom_commercial n'existe pas
              const nom = med.nom_commercial || med.nomCommercial || '';
              const idFamille = med.id_famille || med.idFamille || '';
              
              // Trouver la famille correspondante
              const famille = familles.find(f => f.id === idFamille);
              
            return {
              ...med,
                id: med.id || '',
                nom_commercial: nom,
                nomCommercial: nom,
                id_famille: idFamille,
                idFamille: idFamille,
              famille: famille ? famille.libelle : 'Non catégorisé'
            };
          });

            console.log("Médicaments normalisés:", medicamentsNormalized);
            setMedicaments(medicamentsNormalized);
            setFilteredMedicaments(medicamentsNormalized);
        } else {
          setMedicaments([]);
          setFilteredMedicaments([]);
            setError('Aucun médicament trouvé');
          }
        } else {
          setMedicaments([]);
          setFilteredMedicaments([]);
          setError(response.message || 'Erreur lors de la récupération des données');
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
  }, [searchTerm, filterFamille, medicaments, sortBy]);

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

    // Tri des résultats
    if (sortBy.field) {
      filtered.sort((a, b) => {
        let valueA = a[sortBy.field as keyof Medicament];
        let valueB = b[sortBy.field as keyof Medicament];
        
        // Cas spécial pour le prix (conversion numérique)
        if (sortBy.field === 'prix') {
          const numA = valueA ? parseFloat(valueA as string) : 0;
          const numB = valueB ? parseFloat(valueB as string) : 0;
          return sortBy.order === 'asc' ? numA - numB : numB - numA;
        }
        // Pour les champs textuels
        else if (typeof valueA === 'string' && typeof valueB === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) {
          return sortBy.order === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortBy.order === 'asc' ? 1 : -1;
        }
        return 0;
      });
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
        
        const response = await addMedicament({
          id: formValues.id?.toString() || (Math.floor(Math.random() * 100000)).toString(), // Generate temp ID
          nomCommercial: formValues.nom_commercial || '',
          idFamille: formValues.id_famille || '',
          composition: formValues.composition || '',
          effets: formValues.effets || '',
          contreIndications: formValues.contre_indications || ''
        });
        
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
        console.log("Mise à jour du médicament avec les valeurs:", {
          id: currentMedicament.id,
          composition: formValues.composition,
          effets: formValues.effets,
          contre_indications: formValues.contre_indications
        });
        
        const response = await updateMedicament(
          currentMedicament.id,
          {
            composition: formValues.composition || '',
            effets: formValues.effets || '',
            contreIndications: formValues.contre_indications || ''
          }
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
    if (currentMedicament) {
      try {
        setLoading(true);
        const response = await deleteMedicament(currentMedicament.id);
        
        if (response.status === 'success') {
          // Refresh the list
          const updatedResponse = await getAllMedicaments();
          if (updatedResponse.status === 'success') {
            // Recréer la liste avec les familles
            const medicamentsWithFamille = updatedResponse.data.map((med: Medicament) => {
              const famille = familles.find(f => f.id === med.id_famille);
              return {
                ...med,
                famille: famille ? famille.libelle : 'Non catégorisé'
              };
            });
            
            setMedicaments(medicamentsWithFamille);
            setFilteredMedicaments(medicamentsWithFamille);
          } else {
            // If refreshing fails, just remove locally
        const updatedMedicaments = medicaments.filter(m => m.id !== currentMedicament.id);
        setMedicaments(updatedMedicaments);
        setFilteredMedicaments(updatedMedicaments);
          }
        setSnackbar({ open: true, message: 'Médicament supprimé avec succès', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: response.message || 'Erreur lors de la suppression du médicament', severity: 'error' });
        }
        setOpenDeleteDialog(false);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setSnackbar({ open: true, message: 'Erreur lors de la suppression du médicament', severity: 'error' });
      } finally {
        setLoading(false);
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

  // Ajouter cette fonction pour gérer les changements de tri
  const handleSortChange = (field: keyof Medicament) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Layout title="Médicaments">
      <Box sx={{ mb: 4 }}>
        <Box 
          sx={{ 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: { xs: 2, sm: 1 }
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, maxWidth: { xs: '100%', sm: 500 } }}>
            <TextField
              placeholder="Rechercher un médicament..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#2E2E2E' }} />
                  </InputAdornment>
                )
              }}
              fullWidth
            />
            <Button
              variant={openFilter ? "contained" : "outlined"}
              startIcon={<FilterIcon sx={{ color: openFilter ? 'inherit' : '#2E2E2E' }} />}
              onClick={() => setOpenFilter(!openFilter)}
              size="small"
              color="secondary"
            >
              Filtres
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Options de tri */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: '#2E2E2E' }}>
                Trier par:
              </Typography>
              <Button
                variant={sortBy.field === 'nom_commercial' ? "contained" : "outlined"}
                color="secondary"
                onClick={() => handleSortChange('nom_commercial')}
                endIcon={sortBy.field === 'nom_commercial' && (sortBy.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                size="small"
                sx={{ minWidth: 'auto' }}
          >
                Nom
              </Button>
            <Button
                variant={sortBy.field === 'id_famille' ? "contained" : "outlined"}
              color="secondary"
                onClick={() => handleSortChange('id_famille')}
                endIcon={sortBy.field === 'id_famille' && (sortBy.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
              size="small"
                sx={{ minWidth: 'auto' }}
            >
                Famille
            </Button>
              <Button
                variant={sortBy.field === 'prix' ? "contained" : "outlined"}
                color="secondary"
                onClick={() => handleSortChange('prix')}
                endIcon={sortBy.field === 'prix' && (sortBy.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                size="small"
                sx={{ minWidth: 'auto', display: { xs: 'none', md: 'inline-flex' } }}
              >
                Prix
              </Button>
            </Box>

            {isAdmin && user && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMedicament}
              >
                Ajouter
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
                    color="secondary" 
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
                      variants={cardVariants}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3, pb: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" component="h2" noWrap>
                              {medicament.nom_commercial || medicament.nomCommercial || 'Sans nom'}
                            </Typography>
                            <Chip 
                              label={medicament.famille || 'Non catégorisé'} 
                              size="small" 
                              sx={{ bgcolor: theme.palette.primary.light, color: '#2E2E2E', fontWeight: 'medium' }} 
                            />
                          </Box>
                          
                          {medicament.prix && (
                            <Box sx={{ mt: 1, mb: 0.5 }}>
                              <Typography variant="body2" color="#2E2E2E" fontWeight="medium">
                              Prix: {medicament.prix} €
                            </Typography>
                            </Box>
                          )}
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ pt: 1, justifyContent: 'space-between', p: 2 }}>
                          <Button
                            size="small"
                            startIcon={<InfoIcon sx={{ color: theme.palette.text.primary }} />}
                            onClick={() => handleViewMedicament(medicament)}
                            sx={{ color: theme.palette.text.primary, fontWeight: 'medium' }}
                          >
                            Détails
                          </Button>
                          <Box>
                            {isAdmin && user && (
                            <>
                                <Button
                                size="small"
                                  startIcon={<EditIcon sx={{ color: theme.palette.text.primary }} />}
                                onClick={() => handleEditMedicament(medicament)}
                                  sx={{ color: theme.palette.text.primary, fontWeight: 'medium' }}
                              >
                                  Modifier
                                </Button>
                                <Button
                                size="small"
                                color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleDeleteMedicament(medicament)}
                                  sx={{ fontWeight: 'medium' }}
                              >
                                  Supprimer
                                </Button>
                            </>
                          )}
                          </Box>
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
        {/* Dialog d'ajout */}
        <Dialog 
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          fullWidth 
          maxWidth="md"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Ajouter un médicament
            <IconButton
              aria-label="close"
              onClick={() => setOpenAddDialog(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box component="form" sx={{ mt: 1 }}>
              <CustomGrid container spacing={2}>
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
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => setOpenAddDialog(false)} 
              startIcon={<ArrowBackIcon />}
              color="inherit"
            >
              Retour
            </Button>
            <Button
              onClick={handleSaveMedicament}
              variant="contained"
              color="primary"
              disabled={!formValues.nom_commercial || !formValues.id_famille}
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de modification */}
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Modifier un médicament
            <IconButton
              aria-label="close"
              onClick={() => setOpenEditDialog(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box component="form" sx={{ mt: 1 }}>
              <CustomGrid container spacing={2}>
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
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => setOpenEditDialog(false)} 
              startIcon={<ArrowBackIcon />}
              color="inherit"
            >
              Retour
            </Button>
            <Button onClick={handleSaveMedicament} variant="contained" color="primary">
              Mettre à jour
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