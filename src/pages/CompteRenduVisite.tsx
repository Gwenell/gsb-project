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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
              Nouveau Compte-Rendu de Visite
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Saisissez les informations de votre visite médicale
            </Typography>
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Informations générales */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informations générales
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Date de visite"
                  value={formData.date.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setFormData(prev => ({ ...prev, date: newDate }));
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Motif de la visite</InputLabel>
                  <Select
                    value={formData.motif}
                    onChange={(e) => setFormData(prev => ({ ...prev, motif: e.target.value }))}
                    label="Motif de la visite"
                  >
                    {MOTIFS_VISITE.map((motif) => (
                      <MenuItem key={motif} value={motif}>
                        {motif}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {formData.motif === 'Autre' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Précisez le motif"
                    value={formData.motifAutre}
                    onChange={(e) => setFormData(prev => ({ ...prev, motifAutre: e.target.value }))}
                    required
                  />
                </Grid>
              )}

              {/* Médecin */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Médecin visité
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={medecins}
                  getOptionLabel={(option) => `Dr ${option.prenom} ${option.nom} - ${option.adresse}`}
                  value={selectedMedecin}
                  onChange={(_, newValue) => setSelectedMedecin(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Rechercher un médecin"
                      placeholder="Tapez le nom, prénom ou adresse..."
                      required
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">
                          Dr {option.prenom} {option.nom}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.adresse} - {option.specialitecomplementaire || 'Médecine générale'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Médecin effectivement vu (si remplaçant)"
                  value={formData.medecinVisite}
                  onChange={(e) => setFormData(prev => ({ ...prev, medecinVisite: e.target.value }))}
                  helperText="Laissez vide si vous avez vu le médecin titulaire"
                />
              </Grid>

              {/* Bilan */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Bilan de la visite
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Bilan de la visite"
                  value={formData.bilan}
                  onChange={(e) => setFormData(prev => ({ ...prev, bilan: e.target.value }))}
                  required
                  helperText="Décrivez l'impact de votre visite, les observations sur la concurrence, etc."
                />
              </Grid>

              {/* Médicaments offerts */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Échantillons offerts
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                  >
                    Ajouter un médicament
                  </Button>
                </Box>

                {medicamentsOfferts.length > 0 ? (
                  <Card variant="outlined">
                    <CardContent>
                      <List>
                        {medicamentsOfferts.map((medicament, index) => (
                          <ListItem
                            key={medicament.id}
                            divider={index < medicamentsOfferts.length - 1}
                            secondaryAction={
                              <Button
                                color="error"
                                onClick={() => supprimerMedicamentOffert(medicament.id)}
                              >
                                Supprimer
                              </Button>
                            }
                          >
                            <ListItemText
                              primary={medicament.nom}
                              secondary={
                                <Chip
                                  size="small"
                                  label={`${medicament.quantite} échantillon${medicament.quantite > 1 ? 's' : ''}`}
                                  color="primary"
                                  variant="outlined"
                                />
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="info" icon={<MedicationIcon />}>
                    Aucun échantillon ajouté pour cette visite
                  </Alert>
                )}
              </Grid>

              {/* Boutons d'action */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </motion.div>

      {/* Dialog pour ajouter un médicament */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un échantillon</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Autocomplete
              options={medicaments}
              getOptionLabel={(option) => option.nomCommercial}
              value={selectedMedicamentPourOffre}
              onChange={(_, newValue) => setSelectedMedicamentPourOffre(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Médicament"
                  placeholder="Rechercher un médicament..."
                  fullWidth
                  margin="normal"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">{option.nomCommercial}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.famille?.libelle}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            
            <TextField
              fullWidth
              type="number"
              label="Quantité d'échantillons"
              value={quantiteOfferte}
              onChange={(e) => setQuantiteOfferte(Math.max(1, parseInt(e.target.value) || 1))}
              margin="normal"
              inputProps={{ min: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={ajouterMedicamentOffert}
            variant="contained"
            disabled={!selectedMedicamentPourOffre}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CompteRenduVisite; 