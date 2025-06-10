import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
  Rating,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  LocalPharmacy as PharmacyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAllMedecins, 
  getAllMedicaments, 
  addRapport, 
  getMotifs 
} from '../services/api';

interface Motif {
  id: string;
  libelle: string;
  description: string;
  actif: boolean;
}

interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  adresse: string;
  tel: string;
  specialiteComplementaire?: string;
  departement: string;
}

interface Medicament {
  id: string;
  nomCommercial: string;
  composition: string;
  effets: string;
  contreIndications: string;
  famille: {
    id: string;
    libelle: string;
  };
}

const CompteRenduVisite: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // États pour le formulaire selon spécifications GSB
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [motif, setMotif] = useState('');
  const [motifAutre, setMotifAutre] = useState('');
  const [bilan, setBilan] = useState('');
  const [coefficientConfiance, setCoefficientConfiance] = useState<number>(3);
  const [medecinVisite, setMedecinVisite] = useState('');
  const [isRemplacant, setIsRemplacant] = useState(false);
  const [evaluationImpact, setEvaluationImpact] = useState<'faible' | 'moyen' | 'fort' | ''>('');
  const [observationsConcurrence, setObservationsConcurrence] = useState('');
  const [documentationDistribuee, setDocumentationDistribuee] = useState('');
  
  // États pour les données
  const [motifs, setMotifs] = useState<Motif[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [medecinSelectionne, setMedecinSelectionne] = useState<Medecin | null>(null);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [produitsPresentees, setProduitsPresentees] = useState<Medicament[]>([]);
  const [medicamentsOfferts, setMedicamentsOfferts] = useState<{medicament: Medicament, quantite: number}[]>([]);
  
  // États UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [motifsResult, medecinsResult, medicamentsResult] = await Promise.all([
          getMotifs(),
          getAllMedecins(),
          getAllMedicaments()
        ]);

        if (motifsResult.status === 'success') {
          setMotifs(motifsResult.data);
        }

        if (medecinsResult.status === 'success') {
          setMedecins(medecinsResult.data);
        }

        if (medicamentsResult.status === 'success') {
          setMedicaments(medicamentsResult.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
      }
    };

    loadData();
  }, []);

  // Gestion des produits présentés (max 2 selon GSB)
  const handleProduitPresenteAdd = (medicament: Medicament | null) => {
    if (medicament && produitsPresentees.length < 2 && !produitsPresentees.find(m => m.id === medicament.id)) {
      setProduitsPresentees([...produitsPresentees, medicament]);
    }
  };

  const handleProduitPresenteRemove = (medicamentId: string) => {
    setProduitsPresentees(produitsPresentees.filter(m => m.id !== medicamentId));
  };

  // Gestion des échantillons offerts (traçabilité obligatoire)
  const handleMedicamentOffertAdd = (medicament: Medicament | null) => {
    if (medicament && !medicamentsOfferts.find(m => m.medicament.id === medicament.id)) {
      setMedicamentsOfferts([...medicamentsOfferts, { medicament, quantite: 1 }]);
    }
  };

  const handleMedicamentOffertRemove = (medicamentId: string) => {
    setMedicamentsOfferts(medicamentsOfferts.filter(m => m.medicament.id !== medicamentId));
  };

  const handleQuantiteChange = (medicamentId: string, quantite: number) => {
    if (quantite >= 1 && quantite <= 100) { // Limitation selon GSB
      setMedicamentsOfferts(medicamentsOfferts.map(m => 
        m.medicament.id === medicamentId ? { ...m, quantite } : m
      ));
    }
  };

  const getMotifDescription = (motifId: string) => {
    const motifObj = motifs.find(m => m.id === motifId);
    return motifObj ? motifObj.description : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations métier GSB
    if (!medecinSelectionne) {
      setError('Veuillez sélectionner un médecin');
      return;
    }

    if (!motif) {
      setError('Veuillez sélectionner un motif de visite');
      return;
    }

    if (motif === 'AUTRE' && !motifAutre.trim()) {
      setError('Veuillez préciser le motif "Autre"');
      return;
    }

    if (!bilan.trim() || bilan.length < 10) {
      setError('Le bilan doit contenir au moins 10 caractères');
      return;
    }

    if (isRemplacant && !medecinVisite.trim()) {
      setError('Veuillez préciser le nom du médecin remplaçant visité');
      return;
    }

    if (produitsPresentees.length === 0) {
      setError('Veuillez sélectionner au moins un produit présenté (maximum 2)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rapportData = {
        date,
        motif,
        motifAutre: motif === 'AUTRE' ? motifAutre : '',
        bilan,
        idVisiteur: user?.id,
        idMedecin: medecinSelectionne.id,
        coefficientConfiance,
        medecinVisite: isRemplacant ? medecinVisite : '',
        isRemplacant,
        evaluationImpact: evaluationImpact || null,
        observationsConcurrence: observationsConcurrence || '',
        documentationDistribuee: documentationDistribuee || '',
        produitsPresentees: produitsPresentees.map(m => m.id),
        medicamentsOfferts: medicamentsOfferts.map(m => ({
          id: m.medicament.id,
          quantite: m.quantite
        }))
      };

      const result = await addRapport(rapportData);

      if (result.status === 'success') {
        setSuccess('Compte-rendu de visite enregistré avec succès');
        setTimeout(() => {
          navigate('/mes-rapports');
        }, 2000);
      } else {
        setError(result.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      setError('Erreur lors de l\'enregistrement du rapport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AssignmentIcon sx={{ mr: 2, color: '#1976d2', fontSize: 32 }} />
          <Typography variant="h4" component="h1" sx={{ color: '#1976d2' }}>
            Compte-Rendu de Visite GSB
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Section Informations de base */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1 }} />
                    Informations de base
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date de visite"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Motif de visite</InputLabel>
                        <Select
                          value={motif}
                          onChange={(e) => setMotif(e.target.value)}
                          label="Motif de visite"
                        >
                          {motifs.map((m) => (
                            <MenuItem key={m.id} value={m.id}>
                              <Box>
                                <Typography>{m.libelle}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {m.description}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {motif === 'AUTRE' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Précisez le motif"
                          value={motifAutre}
                          onChange={(e) => setMotifAutre(e.target.value)}
                          required
                          multiline
                          rows={2}
                          helperText="Veuillez détailler le motif de cette visite"
                        />
                      </Grid>
                    )}

                    {motif && motif !== 'AUTRE' && (
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <strong>Motif sélectionné :</strong> {getMotifDescription(motif)}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section Médecin */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                    <PersonAddIcon sx={{ mr: 1 }} />
                    Praticien visité
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={medecins}
                        getOptionLabel={(option) => `Dr ${option.nom} ${option.prenom} - ${option.departement}`}
                        value={medecinSelectionne}
                        onChange={(_, newValue) => setMedecinSelectionne(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Rechercher un médecin"
                            required
                            helperText="Saisissez le nom ou la ville du médecin"
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box>
                              <Typography variant="body1">
                                Dr {option.nom} {option.prenom}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {option.specialiteComplementaire} - {option.departement}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {option.adresse}
                              </Typography>
                            </Box>
                          </li>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isRemplacant}
                            onChange={(e) => setIsRemplacant(e.target.checked)}
                          />
                        }
                        label="J'ai rencontré un médecin remplaçant"
                      />
                    </Grid>

                    {isRemplacant && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Nom du médecin remplaçant visité"
                          value={medecinVisite}
                          onChange={(e) => setMedecinVisite(e.target.value)}
                          required={isRemplacant}
                          helperText="Précisez le nom du remplaçant effectivement rencontré"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">Dr</InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section Produits présentés */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                    <PharmacyIcon sx={{ mr: 1 }} />
                    Produits présentés
                    <Tooltip title="Maximum 2 produits selon les spécifications GSB">
                      <InfoIcon sx={{ ml: 1, fontSize: 16, color: '#757575' }} />
                    </Tooltip>
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Règle GSB :</strong> Maximum 2 produits peuvent être présentés en détail par visite.
                        Au-delà, le praticien ne retient pas l'information.
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <Autocomplete
                        options={medicaments.filter(m => !produitsPresentees.find(p => p.id === m.id))}
                        getOptionLabel={(option) => `${option.nomCommercial} (${option.famille.libelle})`}
                        onChange={(_, newValue) => handleProduitPresenteAdd(newValue)}
                        disabled={produitsPresentees.length >= 2}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Ajouter un produit présenté (${produitsPresentees.length}/2)`}
                            helperText={produitsPresentees.length >= 2 ? "Limite de 2 produits atteinte" : "Sélectionnez un produit à présenter"}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {produitsPresentees.map((medicament) => (
                          <Chip
                            key={medicament.id}
                            label={`${medicament.nomCommercial} (${medicament.famille.libelle})`}
                            onDelete={() => handleProduitPresenteRemove(medicament.id)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section Échantillons offerts */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                    <PharmacyIcon sx={{ mr: 1 }} />
                    Échantillons offerts
                    <Tooltip title="Traçabilité obligatoire selon la réglementation GSB">
                      <InfoIcon sx={{ ml: 1, fontSize: 16, color: '#757575' }} />
                    </Tooltip>
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <strong>Obligation légale :</strong> Le nombre d'échantillons distribués doit être enregistré 
                        à l'unité près pour la comptabilité et les contrôles de stock.
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <Autocomplete
                        options={medicaments.filter(m => !medicamentsOfferts.find(o => o.medicament.id === m.id))}
                        getOptionLabel={(option) => `${option.nomCommercial} (${option.famille.libelle})`}
                        onChange={(_, newValue) => handleMedicamentOffertAdd(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Ajouter un échantillon offert"
                            helperText="Sélectionnez un médicament pour lequel vous avez distribué des échantillons"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      {medicamentsOfferts.map((item) => (
                        <Box key={item.medicament.id} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Typography sx={{ flexGrow: 1 }}>
                            {item.medicament.nomCommercial} ({item.medicament.famille.libelle})
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantiteChange(item.medicament.id, item.quantite - 1)}
                              disabled={item.quantite <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                            
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantite}
                              onChange={(e) => handleQuantiteChange(item.medicament.id, parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1, max: 100, style: { width: 60, textAlign: 'center' } }}
                              variant="outlined"
                            />
                            
                            <IconButton
                              size="small"
                              onClick={() => handleQuantiteChange(item.medicament.id, item.quantite + 1)}
                              disabled={item.quantite >= 100}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                          
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleMedicamentOffertRemove(item.medicament.id)}
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section Évaluation */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1 }} />
                    Évaluation de la visite
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography component="legend" gutterBottom>
                        Coefficient de confiance du médecin (1-5) *
                      </Typography>
                      <Rating
                        value={coefficientConfiance}
                        onChange={(_, newValue) => setCoefficientConfiance(newValue || 1)}
                        max={5}
                        size="large"
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Évaluez la confiance du médecin dans nos produits par rapport à la concurrence
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Impact de la visite</InputLabel>
                        <Select
                          value={evaluationImpact}
                          onChange={(e) => setEvaluationImpact(e.target.value as 'faible' | 'moyen' | 'fort')}
                          label="Impact de la visite"
                        >
                          <MenuItem value="faible">Faible (peu d'intérêt manifesté)</MenuItem>
                          <MenuItem value="moyen">Moyen (intérêt modéré)</MenuItem>
                          <MenuItem value="fort">Fort (très intéressé, questions pertinentes)</MenuItem>
                        </Select>
                      </FormControl>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Permet de planifier le délai de la prochaine visite
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section Bilan et observations */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                    Bilan et observations
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bilan de la visite *"
                        value={bilan}
                        onChange={(e) => setBilan(e.target.value)}
                        required
                        multiline
                        rows={4}
                        helperText={`Détaillez le déroulement de la visite et les échanges (minimum 10 caractères) - ${bilan.length} caractères`}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Observations sur la concurrence"
                        value={observationsConcurrence}
                        onChange={(e) => setObservationsConcurrence(e.target.value)}
                        multiline
                        rows={2}
                        helperText="Prospectus d'autres labos, affiches, échantillons observés, positionnement de nos produits"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Documentation distribuée"
                        value={documentationDistribuee}
                        onChange={(e) => setDocumentationDistribuee(e.target.value)}
                        multiline
                        rows={2}
                        helperText="Documentation remise au praticien ou à sa patientèle (non comptabilisée)"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Boutons d'action */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/mes-rapports')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CompteRenduVisite; 