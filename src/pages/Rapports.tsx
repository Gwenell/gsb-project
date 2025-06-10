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
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  useTheme,
  TablePagination,
  CircularProgress,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalHospital,
  Medication,
  Event,
  Description,
  Close as CloseIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRapportsByVisiteur, 
  getRapportById, 
  addRapport, 
  updateRapport, 
  getMedicamentsByRapport,
  addMedicamentOffert,
  getAllMedecins,
  getAllMedicaments,
  deleteRapport
} from '../services/api';
import Layout from '../components/Layout';
import CustomGrid from '../components/CustomGrid';
import { useNavigate } from 'react-router-dom';

// Crimson red for accents
const crimsonRed = '#DC143C';

// Types pour les données
interface Rapport {
  id: string;
  date: string;
  motif: string;
  bilan: string;
  idVisiteur: string;
  idMedecin: string;
  nomMedecin?: string; // Ajouté pour l'affichage
  prenomMedecin?: string; // Ajouté pour l'affichage
}

interface Medecin {
  id: string;
  nom: string;
  prenom: string;
}

interface Medicament {
  id: string;
  nom_commercial: string;
  quantite?: number;
}

interface FormValues {
  date: string;
  motif: string;
  bilan: string;
  idMedecin: string;
  medicaments: Array<{id: string, quantite: number}>;
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

const Rapports: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [filteredRapports, setFilteredRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentRapport, setCurrentRapport] = useState<Rapport | null>(null);
  const [filterMotif, setFilterMotif] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [openFilter, setOpenFilter] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [currentMedicaments, setCurrentMedicaments] = useState<Medicament[]>([]);
  
  // Ajout du state pour le tri
  const [sortBy, setSortBy] = useState<{
    field: keyof Rapport | '';
    order: 'asc' | 'desc';
  }>({
    field: 'date',
    order: 'desc'
  });
  
  // Form values for create/edit
  const [formValues, setFormValues] = useState<FormValues>({
    date: new Date().toISOString().split('T')[0],
    motif: 'periodicite',
    bilan: '',
    idMedecin: '',
    medicaments: []
  });
  
  // New medicament to add to the report
  const [newMedicament, setNewMedicament] = useState({
    id: '',
    quantite: 1
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedecins = async () => {
      try {
        console.log("Récupération des médecins...");
        const response = await getAllMedecins();
        console.log("Réponse brute des médecins:", response);
        console.log("Données des médecins:", response.data);
        
        // Handle different response formats
        let medecinsData = [];
        if (Array.isArray(response.data)) {
          // Direct array response
          console.log("Format de réponse medecins: tableau direct");
          medecinsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Nested data property
          console.log("Format de réponse medecins: data.data");
          medecinsData = response.data.data;
        } else if (response.data && response.data.status === "success" && Array.isArray(response.data.medecins)) {
          // Status + medecins format
          console.log("Format de réponse medecins: status + medecins");
          medecinsData = response.data.medecins;
        } else {
          // Try to extract any array in the response
          console.log("Tentative d'extraction des données de médecins");
          const possibleArrays = Object.values(response.data || {}).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            medecinsData = possibleArrays[0] as any[];
            console.log("Données médecins extraites:", medecinsData);
          } else {
            console.warn("Format de données médecins inattendu:", response.data);
            setMedecins([]);
          }
        }
        
        if (medecinsData.length > 0) {
          console.log(`${medecinsData.length} médecins trouvés`);
          setMedecins(medecinsData);
        } else {
          console.warn("Aucun médecin trouvé dans les données");
          setMedecins([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des médecins:', error);
        setMedecins([]);
      }
    };

    const fetchMedicaments = async () => {
      try {
        console.log("Récupération des médicaments...");
        const response = await getAllMedicaments();
        console.log("Réponse brute des médicaments:", response);
        console.log("Données des médicaments:", response.data);
        
        // Handle different response formats
        let medicamentsData = [];
        if (Array.isArray(response.data)) {
          // Direct array response
          console.log("Format de réponse medicaments: tableau direct");
          medicamentsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Nested data property
          console.log("Format de réponse medicaments: data.data");
          medicamentsData = response.data.data;
        } else if (response.data && response.data.status === "success" && Array.isArray(response.data.medicaments)) {
          // Status + medicaments format
          console.log("Format de réponse medicaments: status + medicaments");
          medicamentsData = response.data.medicaments;
        } else {
          // Try to extract any array in the response
          console.log("Tentative d'extraction des données de médicaments");
          const possibleArrays = Object.values(response.data || {}).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            medicamentsData = possibleArrays[0] as any[];
            console.log("Données médicaments extraites:", medicamentsData);
          } else {
            console.warn("Format de données médicaments inattendu:", response.data);
            setMedicaments([]);
          }
        }
        
        if (medicamentsData.length > 0) {
          console.log(`${medicamentsData.length} médicaments trouvés`);
          setMedicaments(medicamentsData);
        } else {
          console.warn("Aucun médicament trouvé dans les données");
          setMedicaments([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des médicaments:', error);
        setMedicaments([]);
      }
    };

    fetchMedecins();
    fetchMedicaments();
  }, []);

  useEffect(() => {
    const fetchRapports = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          console.log("Récupération des rapports pour l'utilisateur:", user.id);
          const response = await getRapportsByVisiteur(user.id);
          console.log("Réponse brute de l'API:", response);
          console.log("Rapports data:", response.data);
          
          // Check if data exists and is valid
          if (!response.data) {
            console.error("Pas de données reçues de l'API");
            setError("Aucune donnée reçue du serveur");
            setRapports([]);
            setFilteredRapports([]);
            return;
          }
          
          // Handle different response formats
          let rapportsData = [];
          if (Array.isArray(response.data)) {
            // Direct array response
            console.log("Format de réponse: tableau direct");
            rapportsData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Nested data property
            console.log("Format de réponse: data.data");
            rapportsData = response.data.data;
          } else if (response.data.status === "success" && response.data.rapports) {
            // Status + rapports format
            console.log("Format de réponse: status + rapports");
            rapportsData = response.data.rapports;
          } else {
            // Try to extract any array in the response
            console.log("Tentative d'extraction des données de rapport");
            const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              rapportsData = possibleArrays[0] as any[];
              console.log("Données extraites:", rapportsData);
            } else {
              console.warn("Format de données inattendu:", response.data);
              setRapports([]);
              setFilteredRapports([]);
              setError('Aucun rapport trouvé ou format de données incorrect');
              return;
            }
          }
          
          if (rapportsData.length > 0) {
            // Add doctor names from the medecins list
            const enrichedData = rapportsData.map((rapport: any) => {
              // Ensure rapport has all required fields
              if (!rapport.id || !rapport.date || !rapport.motif) {
                console.warn("Rapport incomplet trouvé:", rapport);
              }
              
              const medecin = medecins.find(m => m.id === rapport.idMedecin);
              return {
                ...rapport,
                // Default values for potentially missing fields
                id: rapport.id || `temp-${Date.now()}`,
                date: rapport.date || new Date().toISOString().split('T')[0],
                motif: rapport.motif || 'periodicite',
                bilan: rapport.bilan || '',
                nomMedecin: medecin ? medecin.nom : 'Inconnu',
                prenomMedecin: medecin ? medecin.prenom : ''
              };
            });
            
            console.log("Données enrichies:", enrichedData);
            setRapports(enrichedData);
            setFilteredRapports(enrichedData);
          } else {
            console.log("Aucun rapport trouvé");
            setRapports([]);
            setFilteredRapports([]);
            setError('Aucun rapport trouvé');
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des rapports:', err);
        setError('Erreur lors du chargement des rapports. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch reports even if there are no medecins
    fetchRapports();
  }, [user, medecins]);

  useEffect(() => {
    filterRapports();
  }, [searchTerm, filterMotif, filterDateStart, filterDateEnd, rapports]);

  const filterRapports = () => {
    if (rapports.length > 0) {
      let result = [...rapports];

    // Filtre par terme de recherche
    if (searchTerm) {
        const search = searchTerm.toLowerCase();
        result = result.filter(
          (rapport) =>
            rapport.motif?.toLowerCase().includes(search) ||
            rapport.bilan?.toLowerCase().includes(search) ||
            rapport.nomMedecin?.toLowerCase().includes(search) ||
            rapport.prenomMedecin?.toLowerCase().includes(search)
      );
    }

    // Filtre par motif
    if (filterMotif) {
        result = result.filter(
          (rapport) => rapport.motif === filterMotif
      );
    }

      // Filtre par date
      if (filterDateStart && filterDateEnd) {
        result = result.filter(
          (rapport) => {
            const reportDate = new Date(rapport.date);
            const startDate = new Date(filterDateStart);
            const endDate = new Date(filterDateEnd);
            endDate.setHours(23, 59, 59, 999); // Fin de journée
            return reportDate >= startDate && reportDate <= endDate;
          }
        );
      } else if (filterDateStart) {
        result = result.filter(
          (rapport) => new Date(rapport.date) >= new Date(filterDateStart)
        );
      } else if (filterDateEnd) {
        const endDate = new Date(filterDateEnd);
        endDate.setHours(23, 59, 59, 999); // Fin de journée
        result = result.filter(
          (rapport) => new Date(rapport.date) <= endDate
        );
      }

      // Tri des résultats
      if (sortBy.field) {
        result.sort((a, b) => {
          // Pour gérer différents types de champs
          let valueA = a[sortBy.field as keyof Rapport];
          let valueB = b[sortBy.field as keyof Rapport];
          
          // Traitement spécial pour la date
          if (sortBy.field === 'date') {
            const timeA = new Date(valueA as string).getTime();
            const timeB = new Date(valueB as string).getTime();
            return sortBy.order === 'asc' ? timeA - timeB : timeB - timeA;
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

      setFilteredRapports(result);
    }
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
  const paginatedRapports = filteredRapports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleAddRapport = () => {
    setFormValues({
      date: new Date().toISOString().split('T')[0],
      motif: 'periodicite',
      bilan: '',
      idMedecin: '',
      medicaments: []
    });
    setCurrentMedicaments([]);
    setOpenAddDialog(true);
  };

  const handleEditRapport = async (rapport: Rapport) => {
    try {
      setLoading(true);
      // Fetch the rapport details
      const response = await getRapportById(rapport.id);
      
      if (response.data && response.data.data) {
        const rapportData = response.data.data;
        setCurrentRapport(rapportData);
        
        // Fetch medicaments for this rapport
        const medsResponse = await getMedicamentsByRapport(rapport.id);
        if (medsResponse.data && medsResponse.data.data) {
          setCurrentMedicaments(medsResponse.data.data);
          
          // Set form values
          setFormValues({
            date: rapportData.date || new Date().toISOString().split('T')[0],
            motif: rapportData.motif || 'periodicite',
            bilan: rapportData.bilan || '',
            idMedecin: rapportData.idMedecin || '',
            medicaments: medsResponse.data.data.map((med: any) => ({
              id: med.id,
              quantite: med.quantite || 1
            }))
          });
          
          setOpenEditDialog(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du rapport:", error);
      setSnackbar({ open: true, message: 'Erreur lors de la récupération des détails', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRapport = (rapport: Rapport) => {
    setCurrentRapport(rapport);
    setOpenDeleteDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name as string]: value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleMedicamentQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setNewMedicament({
      ...newMedicament,
      quantite: value
    });
  };

  const handleMedicamentInputChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    // Handle numeric conversion for quantity
    if (name === 'quantite' && typeof value === 'string') {
      setNewMedicament({
        ...newMedicament,
        [name]: parseInt(value) || 1
      });
    } else {
      setNewMedicament({
        ...newMedicament,
        [name as string]: value
      });
    }
  };

  const handleAddMedicamentToRapport = () => {
    if (newMedicament.id && newMedicament.quantite > 0) {
      const updatedMeds = [...formValues.medicaments];
      
      // Check if medicament already exists in the list
      const existingIndex = updatedMeds.findIndex(m => m.id === newMedicament.id);
      
      if (existingIndex >= 0) {
        // Update quantity if it already exists
        updatedMeds[existingIndex].quantite += newMedicament.quantite;
      } else {
        // Add new medicament
        updatedMeds.push({
          id: newMedicament.id,
          quantite: newMedicament.quantite
        });
      }
      
      setFormValues({
        ...formValues,
        medicaments: updatedMeds
      });
      
      // Reset the new medicament form
      setNewMedicament({
        id: '',
        quantite: 1
      });
    }
  };

  const handleRemoveMedicamentFromRapport = (medId: string) => {
    const updatedMeds = formValues.medicaments.filter(m => m.id !== medId);
    setFormValues({
      ...formValues,
      medicaments: updatedMeds
    });
  };

  const handleSaveRapport = async () => {
    if (!user?.id || !formValues.idMedecin || !formValues.date || !formValues.motif) {
      setSnackbar({ open: true, message: 'Veuillez remplir tous les champs obligatoires', severity: 'error' });
      return;
    }
    
    try {
      let rapportId = '';
      
      if (openAddDialog) {
        // Add new rapport
        console.log("Ajout d'un nouveau rapport avec les données:", {
          date: formValues.date,
          motif: formValues.motif,
          bilan: formValues.bilan,
          idVisiteur: user.id.toString(),
          idMedecin: formValues.idMedecin
        });
        
        const response = await addRapport({
          date: formValues.date,
          motif: formValues.motif,
          bilan: formValues.bilan,
          idVisiteur: user.id.toString(),
          idMedecin: formValues.idMedecin
        });
        
        console.log("Réponse de l'API pour l'ajout:", response.data);
        
        if (response.data && response.data.status === "success") {
          rapportId = response.data.data.id || response.data.data;
          console.log("ID du rapport créé:", rapportId);
          
          // Add medicaments if we have the rapport ID
          if (rapportId && formValues.medicaments.length > 0) {
            for (const med of formValues.medicaments) {
              console.log("Ajout du médicament au rapport:", {
                rapportId,
                medicamentId: med.id,
                quantite: med.quantite
              });
              
              const offreResponse = await addMedicamentOffert(
                rapportId,
                {
                  idMedicament: med.id,
                  quantite: med.quantite.toString()
                }
              );
              
              console.log("Réponse de l'API pour l'ajout du médicament:", offreResponse.data);
            }
          }
          
          setSnackbar({ open: true, message: 'Rapport ajouté avec succès', severity: 'success' });
        } else {
          console.error("Erreur dans la réponse de l'API:", response.data);
          setSnackbar({ open: true, message: `Erreur lors de l'ajout du rapport: ${response.data?.message || 'Erreur inconnue'}`, severity: 'error' });
        }
      } else if (currentRapport) {
        // Update existing rapport
        console.log("Mise à jour du rapport avec les données:", {
          id: currentRapport.id,
          date: formValues.date,
          motif: formValues.motif,
          bilan: formValues.bilan,
          idMedecin: formValues.idMedecin
        });
        
        const response = await updateRapport(
          currentRapport.id,
          {
            date: formValues.date,
            motif: formValues.motif,
            bilan: formValues.bilan,
            idMedecin: formValues.idMedecin
          }
        );
        
        console.log("Réponse de l'API pour la mise à jour:", response.data);
        
        if (response.data && response.data.status === "success") {
          rapportId = currentRapport.id;
          
          // For medicaments, we would need to handle additions and removals
          // Since the API might not support updating offerings, we'd typically remove all and re-add
          // This is a simplification - in a real app you'd need proper endpoints for this
          
          setSnackbar({ open: true, message: 'Rapport mis à jour avec succès', severity: 'success' });
        } else {
          console.error("Erreur dans la réponse de l'API:", response.data);
          setSnackbar({ open: true, message: `Erreur lors de la mise à jour du rapport: ${response.data?.message || 'Erreur inconnue'}`, severity: 'error' });
        }
      }
      
      // Refresh the rapports list
      if (user && user.id) {
        console.log("Actualisation de la liste des rapports");
        const updatedResponse = await getRapportsByVisiteur(user.id);
        console.log("Réponse de l'API pour la liste actualisée:", updatedResponse.data);
        
        if (updatedResponse.data && updatedResponse.data.data) {
          // Add doctor names
          const enrichedData = updatedResponse.data.data.map((rapport: Rapport) => {
            const medecin = medecins.find(m => m.id === rapport.idMedecin);
            return {
              ...rapport,
              nomMedecin: medecin ? medecin.nom : 'Inconnu',
              prenomMedecin: medecin ? medecin.prenom : ''
            };
          });
          
          setRapports(enrichedData);
          setFilteredRapports(enrichedData);
        } else {
          console.warn("Pas de données de rapports reçues après l'opération");
        }
      }
      
      // Close dialogs
      setOpenAddDialog(false);
      setOpenEditDialog(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement du rapport', severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (currentRapport) {
      try {
        console.log("Suppression du rapport:", currentRapport.id);
        const response = await deleteRapport(currentRapport.id);
        console.log("Réponse de l'API pour la suppression:", response);
        
        if (response.status === "success") {
          // Remove from local state
          const updatedRapports = rapports.filter(r => r.id !== currentRapport.id);
          setRapports(updatedRapports);
          setFilteredRapports(updatedRapports);
          setSnackbar({ open: true, message: 'Rapport supprimé avec succès', severity: 'success' });
        } else {
          console.error("Erreur dans la réponse de l'API:", response);
          setSnackbar({ 
            open: true, 
            message: `Erreur lors de la suppression: ${response.message || 'Erreur inconnue'}`, 
            severity: 'error' 
          });
        }
        setOpenDeleteDialog(false);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setSnackbar({ open: true, message: 'Erreur lors de la suppression du rapport', severity: 'error' });
      }
    }
  };

  const clearFilters = () => {
    setFilterMotif('');
    setFilterDateStart('');
    setFilterDateEnd('');
    setSearchTerm('');
    setOpenFilter(false);
    // Réinitialiser le tri aux valeurs par défaut
    setSortBy({
      field: 'date',
      order: 'desc'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const getMotifLabel = (motif: string) => {
    switch (motif) {
      case 'periodicite': return 'Périodicité';
      case 'actualisation': return 'Actualisation';
      case 'nouveaute': return 'Nouveauté';
      case 'remontage': return 'Remontage';
      case 'demande': return 'Demande du médecin';
      default: return motif;
    }
  };

  const handleViewRapport = async (rapport: Rapport) => {
    try {
      setLoading(true);
      // Fetch the rapport details
      const response = await getRapportById(rapport.id);
      
      if (response.data && response.data.data) {
        const rapportData = response.data.data;
        setCurrentRapport(rapportData);
        
        // Fetch medicaments for this rapport
        const medsResponse = await getMedicamentsByRapport(rapport.id);
        if (medsResponse.data && medsResponse.data.data) {
          setCurrentMedicaments(medsResponse.data.data);
          
          // Set form values for display only
          setFormValues({
            date: rapportData.date || new Date().toISOString().split('T')[0],
            motif: rapportData.motif || 'periodicite',
            bilan: rapportData.bilan || '',
            idMedecin: rapportData.idMedecin || '',
            medicaments: medsResponse.data.data.map((med: any) => ({
              id: med.id,
              quantite: med.quantite || 1
            }))
          });
          
          setOpenViewDialog(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du rapport:", error);
      setSnackbar({ open: true, message: 'Erreur lors de la récupération des détails', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Ajouter cette nouvelle fonction pour gérer les changements de tri
  const handleSortChange = (field: keyof Rapport) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Layout title="Rapports de visite">
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
              placeholder="Rechercher par motif, bilan ou médecin..."
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
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/rapports/nouveau')}
              sx={{
                fontWeight: 500,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              Nouveau Rapport
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setOpenFilter(!openFilter)}
              sx={{
                fontWeight: 'medium'
              }}
            >
              Filtres
            </Button>
          </Box>
        </Box>

        {/* Options de tri */}
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
            Trier par:
          </Typography>
          <Button
            variant={sortBy.field === 'date' ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleSortChange('date')}
            endIcon={sortBy.field === 'date' && (sortBy.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Date
          </Button>
          <Button
            variant={sortBy.field === 'motif' ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleSortChange('motif')}
            endIcon={sortBy.field === 'motif' && (sortBy.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Motif
          </Button>
          <Button
            variant={sortBy.field === 'nomMedecin' ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleSortChange('nomMedecin')}
            endIcon={sortBy.field === 'nomMedecin' && (sortBy.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Médecin
          </Button>
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
                <CustomGrid container spacing={2}>
                  <CustomGrid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Motif</InputLabel>
                      <Select
                        label="Motif"
                        value={filterMotif}
                        onChange={(e) => setFilterMotif(e.target.value as string)}
                      >
                        <MenuItem value="">Tous</MenuItem>
                        <MenuItem value="periodicite">Périodicité</MenuItem>
                        <MenuItem value="actualisation">Actualisation</MenuItem>
                        <MenuItem value="nouveaute">Nouveauté</MenuItem>
                        <MenuItem value="remontage">Remontage</MenuItem>
                        <MenuItem value="demande">Demande du médecin</MenuItem>
                      </Select>
                    </FormControl>
                  </CustomGrid>
                  <CustomGrid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Date de début"
                      type="date"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </CustomGrid>
                  <CustomGrid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Date de fin"
                      type="date"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </CustomGrid>
                  <CustomGrid item xs={12} sm={6} md={3}>
                    <Button 
                      color="primary" 
                      onClick={clearFilters} 
                      fullWidth
                      sx={{ height: '100%' }}
                    >
                      Réinitialiser
                    </Button>
                  </CustomGrid>
                </CustomGrid>
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
              {filteredRapports.length === 0 ? (
                <CustomGrid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                      <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Aucun rapport trouvé
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
                        {error ? error : 'Vous n\'avez pas encore de rapports de visite. Utilisez le bouton "Nouveau Rapport" pour en créer un.'}
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/rapports/nouveau')}
                      >
                        Créer un nouveau rapport
                      </Button>
                    </Box>
                  </Paper>
                </CustomGrid>
              ) : (
                paginatedRapports.map((rapport, index) => (
                  <CustomGrid item xs={12} sm={6} key={rapport.id}>
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
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Chip 
                              icon={<Event />}
                              label={formatDate(rapport.date)}
                              size="small"
                              color="primary"
                              sx={{ borderColor: crimsonRed }}
                            />
                            <Chip 
                              icon={<PersonIcon />}
                              label={`${rapport.prenomMedecin} ${rapport.nomMedecin}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>

                          <Typography variant="h6" gutterBottom>
                            {getMotifLabel(rapport.motif)}
                          </Typography>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Typography variant="body2" color="text.secondary">
                            {rapport.bilan.substring(0, 150)}
                            {rapport.bilan.length > 150 ? '...' : ''}
                          </Typography>
                        </CardContent>
                        
                        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewRapport(rapport)}
                            color="info"
                            title="Voir les détails"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditRapport(rapport)}
                            color="primary"
                            title="Modifier"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRapport(rapport)}
                            color="error"
                            title="Supprimer"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </CustomGrid>
                ))
              )}
            </CustomGrid>
            
            {/* Pagination */}
            {filteredRapports.length > 0 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div"
                  count={filteredRapports.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[6, 12, 24, 48]}
                  labelRowsPerPage="Rapports par page:"
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
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {openAddDialog ? 'Nouveau Rapport de Visite' : 'Modifier le Rapport'}
            <IconButton
              aria-label="close"
              onClick={() => {
                setOpenAddDialog(false);
                setOpenEditDialog(false);
              }}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <CustomGrid container spacing={3}>
              <CustomGrid item xs={12} sm={6}>
                <TextField
                  label="Date de visite"
                  type="date"
                  fullWidth
                  name="date"
                  InputLabelProps={{ shrink: true }}
                  value={formValues.date}
                  onChange={handleInputChange}
                  required
                />
              </CustomGrid>
              <CustomGrid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Médecin</InputLabel>
                  <Select
                    name="idMedecin"
                    value={formValues.idMedecin}
                    onChange={handleSelectChange}
                    label="Médecin"
                    error={medecins.length === 0}
                  >
                    {medecins.length === 0 ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Chargement des médecins...
                        </Box>
                      </MenuItem>
                    ) : (
                      medecins.map((medecin) => (
                        <MenuItem key={medecin.id} value={medecin.id}>
                          Dr. {medecin.prenom} {medecin.nom}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {medecins.length === 0 && (
                    <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                      Aucun médecin disponible. Veuillez réessayer plus tard.
                    </Typography>
                  )}
                </FormControl>
              </CustomGrid>
              <CustomGrid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Motif</InputLabel>
                  <Select
                    name="motif"
                    value={formValues.motif}
                    onChange={handleSelectChange}
                    label="Motif"
                  >
                    <MenuItem value="periodicite">Périodicité</MenuItem>
                    <MenuItem value="actualisation">Actualisation</MenuItem>
                    <MenuItem value="nouveaute">Nouveauté</MenuItem>
                    <MenuItem value="remontage">Remontage</MenuItem>
                    <MenuItem value="demande">Demande du médecin</MenuItem>
                  </Select>
                </FormControl>
              </CustomGrid>
              <CustomGrid item xs={12}>
                <TextField
                  label="Bilan"
                  multiline
                  rows={4}
                  fullWidth
                  name="bilan"
                  value={formValues.bilan}
                  onChange={handleInputChange}
                />
              </CustomGrid>

              <CustomGrid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Échantillons distribués
                </Typography>
                <CustomGrid container spacing={2}>
                  <CustomGrid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Médicament</InputLabel>
                      <Select
                        label="Médicament"
                        name="id"
                        value={newMedicament.id}
                        onChange={handleMedicamentInputChange as (event: SelectChangeEvent<string>) => void}
                      >
                        <MenuItem value="">Sélectionner un médicament</MenuItem>
                        {medicaments.length === 0 ? (
                          <MenuItem disabled>Aucun médicament disponible</MenuItem>
                        ) : (
                          medicaments.map((med) => (
                            <MenuItem key={med.id} value={med.id}>
                              {med.nom_commercial}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </CustomGrid>
                  <CustomGrid item xs={12} sm={4}>
                    <TextField
                      label="Quantité"
                      type="number"
                      fullWidth
                      size="small"
                      name="quantite"
                      value={newMedicament.quantite}
                      onChange={handleMedicamentQuantityChange}
                      inputProps={{ min: 1 }}
                    />
                  </CustomGrid>
                  <CustomGrid item xs={12} sm={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddMedicamentToRapport}
                      disabled={!newMedicament.id}
                    >
                      Ajouter
                    </Button>
                  </CustomGrid>
                </CustomGrid>
              </CustomGrid>

              <CustomGrid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Échantillons ajoutés:
                  </Typography>
                  {formValues.medicaments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aucun échantillon ajouté
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formValues.medicaments.map((med) => {
                        const medicament = medicaments.find(m => m.id === med.id);
                        return (
                          <Chip 
                            key={med.id}
                            label={`${medicament?.nom_commercial || 'Médicament'} x ${med.quantite}`}
                            onDelete={() => handleRemoveMedicamentFromRapport(med.id)}
                            sx={{ m: 0.5 }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Paper>
              </CustomGrid>
            </CustomGrid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenAddDialog(false);
              setOpenEditDialog(false);
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveRapport}
              variant="contained" 
              color="primary"
            >
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
          <DialogTitle>Confirmation de suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer ce rapport de visite ? Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              color="error"
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de vue détaillée */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Détails du Rapport
            <IconButton
              aria-label="close"
              onClick={() => setOpenViewDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {currentRapport && (
              <CustomGrid container spacing={3}>
                <CustomGrid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Date de visite
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(currentRapport.date)}
                  </Typography>
                </CustomGrid>
                <CustomGrid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Médecin
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Dr. {currentRapport.prenomMedecin} {currentRapport.nomMedecin}
                  </Typography>
                </CustomGrid>
                <CustomGrid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Motif
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {getMotifLabel(currentRapport.motif)}
                  </Typography>
                </CustomGrid>
                <CustomGrid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Bilan
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ p: 2, bgcolor: 'background.default', minHeight: '100px' }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {currentRapport.bilan || 'Aucun bilan fourni.'}
                    </Typography>
                  </Paper>
                </CustomGrid>
                
                <CustomGrid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
                    Échantillons distribués
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {currentMedicaments.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucun échantillon distribué
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {currentMedicaments.map((med) => (
                          <Chip 
                            key={med.id}
                            label={`${med.nom_commercial} x ${med.quantite || 1}`}
                            color="primary"
                            variant="outlined"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </CustomGrid>
              </CustomGrid>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenViewDialog(false)}
            >
              Fermer
            </Button>
            <Button 
              onClick={() => {
                setOpenViewDialog(false);
                if (currentRapport) {
                  handleEditRapport(currentRapport);
                }
              }}
              variant="contained" 
              color="primary"
            >
              Modifier
            </Button>
          </DialogActions>
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

export default Rapports; 