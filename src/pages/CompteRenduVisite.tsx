import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
// Date picker HTML5 simple
import { motion } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import MedicationIcon from '@mui/icons-material/Medication';
import { useAuth } from '../contexts/AuthContext';
import { getAllMedecins, addRapport, getAllMedicaments, addMedicamentOffert } from '../services/api';
import Layout from '../components/Layout';

// Motifs de visite prédéfinis selon la documentation
const MOTIFS_VISITE = [
  'Périodicité (6-8 mois)',
  'Nouveauté/Actualisation produit',
  'Baisse de prescription détectée',
  'Sollicitation du médecin',
  'Information complémentaire demandée',
  'Effets secondaires signalés',
  'Autre'
];

interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  adresse: string;
  tel?: string;
  specialitecomplementaire?: string;
  departement: number;
}

interface Medicament {
  id: string;
  nomCommercial: string;
  famille?: {
    libelle: string;
  };
}

interface MedicamentOffert {
  id: string;
  quantite: number;
  nom: string;
}

const CompteRenduVisite: React.FC = () => {
  const { user } = useAuth();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState<Medecin | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Formulaire principal
  const [formData, setFormData] = useState({
    date: new Date(),
    motif: '',
    motifAutre: '',
    bilan: '',
    medecinVisite: '', // Pour le cas des remplaçants
  });

  // Médicaments offerts
  const [medicamentsOfferts, setMedicamentsOfferts] = useState<MedicamentOffert[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMedicamentPourOffre, setSelectedMedicamentPourOffre] = useState<Medicament | null>(null);
  const [quantiteOfferte, setQuantiteOfferte] = useState(1);

  useEffect(() => {
    loadMedecins();
    loadMedicaments();
  }, []);

  const loadMedecins = async () => {
    try {
      const response = await getAllMedecins();
      if (response.status === 'success') {
        setMedecins(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
    }
  };

  const loadMedicaments = async () => {
    try {
      const response = await getAllMedicaments();
      if (response.status === 'success') {
        setMedicaments(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des médicaments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMedecin) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un médecin' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const motifFinal = formData.motif === 'Autre' ? formData.motifAutre : formData.motif;
      
      const rapportData = {
        date: formData.date.toISOString().split('T')[0],
        motif: motifFinal,
        bilan: formData.bilan,
        idVisiteur: user?.id,
        idMedecin: selectedMedecin.id,
        medecinVisite: formData.medecinVisite || null
      };

      const response = await addRapport(rapportData);
      
      if (response.status === 'success') {
        const rapportId = response.data.id;
        
        // Ajouter les médicaments offerts
        for (const medicament of medicamentsOfferts) {
          await addMedicamentOffert(rapportId, {
            idMedicament: medicament.id,
            quantite: medicament.quantite
          });
        }
        
        setMessage({ type: 'success', text: 'Compte-rendu enregistré avec succès' });
        
        // Réinitialiser le formulaire
        setFormData({
          date: new Date(),
          motif: '',
          motifAutre: '',
          bilan: '',
          medecinVisite: ''
        });
        setSelectedMedecin(null);
        setMedicamentsOfferts([]);
      } else {
        setMessage({ type: 'error', text: response.message || 'Erreur lors de l\'enregistrement' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement du compte-rendu' });
    } finally {
      setLoading(false);
    }
  };

  const ajouterMedicamentOffert = () => {
    if (!selectedMedicamentPourOffre) return;
    
    const nouveauMedicament: MedicamentOffert = {
      id: selectedMedicamentPourOffre.id,
      quantite: quantiteOfferte,
      nom: selectedMedicamentPourOffre.nomCommercial
    };
    
    setMedicamentsOfferts(prev => {
      const existing = prev.find(m => m.id === nouveauMedicament.id);
      if (existing) {
        return prev.map(m => 
          m.id === nouveauMedicament.id 
            ? { ...m, quantite: m.quantite + quantiteOfferte }
            : m
        );
      }
      return [...prev, nouveauMedicament];
    });
    
    setDialogOpen(false);
    setSelectedMedicamentPourOffre(null);
    setQuantiteOfferte(1);
  };

  const supprimerMedicamentOffert = (id: string) => {
    setMedicamentsOfferts(prev => prev.filter(m => m.id !== id));
  };

  return (
    <Layout title="Nouveau Compte-Rendu de Visite">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Sélection du médecin */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={medecins}
                getOptionLabel={(option) => `${option.prenom} ${option.nom}`}
                value={selectedMedecin}
                onChange={(_, newValue) => {
                  setSelectedMedecin(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sélectionner un médecin"
                    variant="outlined"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            
            {/* Champ pour médecin remplaçant */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Médecin remplaçant (si applicable)"
                variant="outlined"
                fullWidth
                value={formData.medecinVisite}
                onChange={(e) => setFormData({ ...formData, medecinVisite: e.target.value })}
                helperText="Indiquez le nom du remplaçant si le médecin habituel n'a pas été rencontré"
              />
            </Grid>
            
            {/* Date de visite */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de visite"
                type="date"
                fullWidth
                required
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Motif de visite */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="motif-label">Motif de visite</InputLabel>
                <Select
                  labelId="motif-label"
                  value={formData.motif}
                  label="Motif de visite"
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                >
                  {MOTIFS_VISITE.map((motif) => (
                    <MenuItem key={motif} value={motif}>{motif}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Champ supplémentaire si "Autre" sélectionné */}
            {formData.motif === 'Autre' && (
              <Grid item xs={12}>
                <TextField
                  label="Précisez le motif"
                  variant="outlined"
                  fullWidth
                  required
                  value={formData.motifAutre}
                  onChange={(e) => setFormData({ ...formData, motifAutre: e.target.value })}
                />
              </Grid>
            )}
            
            {/* Bilan de la visite */}
            <Grid item xs={12}>
              <TextField
                label="Bilan de la visite"
                variant="outlined"
                fullWidth
                required
                multiline
                rows={4}
                value={formData.bilan}
                onChange={(e) => setFormData({ ...formData, bilan: e.target.value })}
              />
            </Grid>

            {/* Section des médicaments offerts */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      Médicaments offerts
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setDialogOpen(true)}
                      color="secondary"
                    >
                      Ajouter
                    </Button>
                  </Box>
                  
                  {medicamentsOfferts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aucun médicament offert pour cette visite.
                    </Typography>
                  ) : (
                    <List>
                      {medicamentsOfferts.map((med) => (
                        <ListItem key={med.id} divider>
                          <ListItemText 
                            primary={med.nom} 
                            secondary={`Quantité: ${med.quantite}`} 
                          />
                          <Button
                            color="error"
                            size="small"
                            onClick={() => supprimerMedicamentOffert(med.id)}
                          >
                            Supprimer
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Bouton de soumission */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Dialog pour ajouter un médicament */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Ajouter un médicament offert</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, width: 400, maxWidth: '100%' }}>
            <Autocomplete
              options={medicaments}
              getOptionLabel={(option) => `${option.nomCommercial}${option.famille ? ` (${option.famille.libelle})` : ''}`}
              value={selectedMedicamentPourOffre}
              onChange={(_, newValue) => {
                setSelectedMedicamentPourOffre(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sélectionner un médicament"
                  variant="outlined"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
              )}
            />
            
            <TextField
              label="Quantité"
              type="number"
              fullWidth
              value={quantiteOfferte}
              onChange={(e) => setQuantiteOfferte(parseInt(e.target.value) || 1)}
              InputProps={{ inputProps: { min: 1 } }}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={() => {
              ajouterMedicamentOffert();
              setDialogOpen(false);
              setSelectedMedicamentPourOffre(null);
              setQuantiteOfferte(1);
            }}
            color="primary"
            startIcon={<MedicationIcon />}
            disabled={!selectedMedicamentPourOffre}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CompteRenduVisite; 