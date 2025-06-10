import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRapportsToValidate, 
  validerRapport, 
  rembourserRapport 
} from '../services/api';

interface Rapport {
  id: string;
  date: string;
  motif: string;
  bilan: string;
  etat: 'CR' | 'VA' | 'RB';
  dateModif?: string;
  coefficientConfiance?: number;
  nbJustificatifs?: number;
  totalValide?: number;
  visiteur: {
    id: string;
    nom: string;
    prenom: string;
  };
  medecin: {
    id: number;
    nom: string;
    prenom: string;
    departement: string;
  };
  medicamentsOfferts: Array<{
    id: string;
    quantite: number;
    medicament: {
      id: string;
      nomCommercial: string;
    };
  }>;
}

const ValidationRapports: React.FC = () => {
  const { user } = useAuth();
  
  // États pour le formulaire
  const [moisSelectionne, setMoisSelectionne] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // États pour les données
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour la validation
  const [rapportEnValidation, setRapportEnValidation] = useState<Rapport | null>(null);
  const [nbJustificatifs, setNbJustificatifs] = useState<number>(0);
  const [totalValide, setTotalValide] = useState<number>(0);
  const [validationDialog, setValidationDialog] = useState(false);
  const [remboursementDialog, setRemboursementDialog] = useState(false);
  const [rapportEnRemboursement, setRapportEnRemboursement] = useState<Rapport | null>(null);

  // Générer les options de mois (12 derniers mois)
  const generateMoisOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      
      options.push({ value, label });
    }
    
    return options;
  };

  const loadRapports = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getRapportsToValidate(moisSelectionne);
      
      if (result.status === 'success') {
        setRapports(result.data);
      } else {
        setError(result.message || 'Erreur lors du chargement des rapports');
      }
    } catch (error) {
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRapports();
  }, [moisSelectionne]);

  const getEtatColor = (etat: string) => {
    switch (etat) {
      case 'CR': return 'warning';
      case 'VA': return 'info';
      case 'RB': return 'success';
      default: return 'default';
    }
  };

  const getEtatLabel = (etat: string) => {
    switch (etat) {
      case 'CR': return 'En cours';
      case 'VA': return 'Validé';
      case 'RB': return 'Remboursé';
      default: return etat;
    }
  };

  const handleOuvrirValidation = (rapport: Rapport) => {
    setRapportEnValidation(rapport);
    setNbJustificatifs(rapport.nbJustificatifs || 0);
    setTotalValide(rapport.totalValide || 0);
    setValidationDialog(true);
  };

  const handleValider = async () => {
    if (!rapportEnValidation) return;

    setLoading(true);
    setError('');

    try {
      const result = await validerRapport(rapportEnValidation.id, {
        nbJustificatifs,
        totalValide
      });

      if (result.status === 'success') {
        setSuccess('Rapport validé avec succès');
        setValidationDialog(false);
        setRapportEnValidation(null);
        await loadRapports(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      setError('Erreur lors de la validation du rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleOuvrirRemboursement = (rapport: Rapport) => {
    setRapportEnRemboursement(rapport);
    setRemboursementDialog(true);
  };

  const handleRembourser = async () => {
    if (!rapportEnRemboursement) return;

    setLoading(true);
    setError('');

    try {
      const result = await rembourserRapport(rapportEnRemboursement.id);

      if (result.status === 'success') {
        setSuccess('Rapport remboursé avec succès');
        setRemboursementDialog(false);
        setRapportEnRemboursement(null);
        await loadRapports(); // Recharger la liste
      } else {
        setError(result.message || 'Erreur lors du remboursement');
      }
    } catch (error) {
      setError('Erreur lors du remboursement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (rapport: Rapport) => {
    // Calcul fictif du total basé sur les médicaments offerts
    return rapport.medicamentsOfferts.reduce((total, item) => total + (item.quantite * 10), 0);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
          Validation des Rapports de Visite
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Sélection du mois */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Mois de validation</InputLabel>
              <Select
                value={moisSelectionne}
                onChange={(e) => setMoisSelectionne(e.target.value)}
                label="Mois de validation"
              >
                {generateMoisOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              Les mois correspondent aux 12 derniers mois précédents la validation. 
              Seuls les rapports en état "CR" (en cours) sont affichés pour validation.
            </Typography>
          </Grid>
        </Grid>

        {/* Tableau des rapports */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>État</strong></TableCell>
                <TableCell><strong>Visiteur</strong></TableCell>
                <TableCell><strong>Mois</strong></TableCell>
                <TableCell><strong>Médecin</strong></TableCell>
                <TableCell><strong>Motif</strong></TableCell>
                <TableCell><strong>Nb. Justificatifs</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Chargement des rapports...
                  </TableCell>
                </TableRow>
              ) : rapports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Aucun rapport en attente de validation pour ce mois
                  </TableCell>
                </TableRow>
              ) : (
                rapports.map((rapport) => (
                  <TableRow key={rapport.id} hover>
                    <TableCell>
                      <Chip 
                        label={getEtatLabel(rapport.etat)}
                        color={getEtatColor(rapport.etat) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {rapport.visiteur.nom} {rapport.visiteur.prenom}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {rapport.visiteur.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(rapport.date).toLocaleDateString('fr-FR', { 
                        year: 'numeric', 
                        month: '2-digit' 
                      })}
                    </TableCell>
                    <TableCell>
                      Dr {rapport.medecin.nom} {rapport.medecin.prenom}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {rapport.medecin.departement}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {rapport.motif}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {rapport.etat === 'CR' ? (
                        <TextField
                          type="number"
                          size="small"
                          value={rapport.nbJustificatifs || 0}
                          onChange={(e) => {
                            const newRapports = rapports.map(r => 
                              r.id === rapport.id 
                                ? { ...r, nbJustificatifs: parseInt(e.target.value) || 0 }
                                : r
                            );
                            setRapports(newRapports);
                          }}
                          inputProps={{ min: 0, max: 99 }}
                          sx={{ width: 80 }}
                        />
                      ) : (
                        rapport.nbJustificatifs || 0
                      )}
                    </TableCell>
                    <TableCell>
                      {rapport.etat === 'CR' ? (
                        <TextField
                          type="number"
                          size="small"
                          value={rapport.totalValide || calculateTotal(rapport)}
                          onChange={(e) => {
                            const newRapports = rapports.map(r => 
                              r.id === rapport.id 
                                ? { ...r, totalValide: parseFloat(e.target.value) || 0 }
                                : r
                            );
                            setRapports(newRapports);
                          }}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 100 }}
                        />
                      ) : (
                        `${rapport.totalValide || calculateTotal(rapport)} €`
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleOuvrirValidation(rapport)}
                          disabled={rapport.etat !== 'CR' || loading}
                        >
                          Valider
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleOuvrirRemboursement(rapport)}
                          disabled={rapport.etat !== 'VA' || loading}
                        >
                          Rembourser
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog de confirmation de validation */}
        <Dialog open={validationDialog} onClose={() => setValidationDialog(false)}>
          <DialogTitle>Confirmer la validation</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Êtes-vous sûr de vouloir valider ce rapport de visite ? 
              Cette action changera l'état du rapport de "CR" (En cours) à "VA" (Validé).
            </DialogContentText>
            {rapportEnValidation && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rapport de {rapportEnValidation.visiteur.nom} {rapportEnValidation.visiteur.prenom}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Médecin: Dr {rapportEnValidation.medecin.nom} {rapportEnValidation.medecin.prenom}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(rapportEnValidation.date).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setValidationDialog(false)}>Annuler</Button>
            <Button onClick={handleValider} variant="contained" autoFocus>
              Confirmer la validation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de confirmation de remboursement */}
        <Dialog open={remboursementDialog} onClose={() => setRemboursementDialog(false)}>
          <DialogTitle>Confirmer le remboursement</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Êtes-vous sûr de vouloir marquer ce rapport comme remboursé ? 
              Cette action changera l'état du rapport de "VA" (Validé) à "RB" (Remboursé).
            </DialogContentText>
            {rapportEnRemboursement && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rapport de {rapportEnRemboursement.visiteur.nom} {rapportEnRemboursement.visiteur.prenom}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Montant: {rapportEnRemboursement.totalValide || calculateTotal(rapportEnRemboursement)} €
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRemboursementDialog(false)}>Annuler</Button>
            <Button onClick={handleRembourser} variant="contained" color="success" autoFocus>
              Confirmer le remboursement
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ValidationRapports; 