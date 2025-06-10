import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import CheckIcon from '@mui/icons-material/Check';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../contexts/AuthContext';
import { getRapportsByVisiteur, getAllUsers } from '../services/api';

// États des rapports selon le cahier des charges
const ETATS_RAPPORT = {
  CR: { label: 'En cours', color: 'warning' as const },
  VA: { label: 'Validé', color: 'success' as const },
  RB: { label: 'Remboursé', color: 'info' as const }
};

const MOIS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

interface Rapport {
  id: number;
  date: string;
  motif: string;
  bilan: string;
  etat: 'CR' | 'VA' | 'RB';
  visiteur: {
    id: string;
    nom: string;
    prenom: string;
  };
  medecin: {
    nom: string;
    prenom: string;
  };
  nbJustificatifs?: number;
  totalValide?: number;
  medicaments?: Array<{
    nom: string;
    quantite: number;
  }>;
}

interface ValidationData {
  nbJustificatifs: number;
  totalValide: number;
}

const ValidationRapports: React.FC = () => {
  const { user } = useAuth();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [visiteurs, setVisiteurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Filtres
  const [selectedMois, setSelectedMois] = useState(() => {
    const now = new Date();
    return now.getMonth().toString().padStart(2, '0');
  });
  const [selectedAnnee, setSelectedAnnee] = useState(() => {
    return new Date().getFullYear().toString();
  });

  // Dialog pour validation
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean;
    rapport: Rapport | null;
    data: ValidationData;
  }>({
    open: false,
    rapport: null,
    data: { nbJustificatifs: 0, totalValide: 0 }
  });

  // Dialog pour détail rapport
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    rapport: Rapport | null;
  }>({
    open: false,
    rapport: null
  });

  useEffect(() => {
    if (user?.type_utilisateur === 'comptable' || user?.type_utilisateur === 'responsable') {
      loadVisiteurs();
    }
  }, [user]);

  useEffect(() => {
    if (visiteurs.length > 0) {
      loadRapports();
    }
  }, [selectedMois, selectedAnnee, visiteurs]);

  const loadVisiteurs = async () => {
    try {
      const response = await getAllUsers();
      if (response.status === 'success') {
        setVisiteurs(response.data.filter((u: any) => u.type_utilisateur === 'visiteur'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des visiteurs:', error);
    }
  };

  const loadRapports = async () => {
    setLoading(true);
    try {
      const annéeMois = `${selectedAnnee}-${selectedMois}`;
      const allRapports: Rapport[] = [];

      // Charger les rapports pour tous les visiteurs du mois sélectionné
      for (const visiteur of visiteurs) {
        const response = await getRapportsByVisiteur(visiteur.id);
        if (response.status === 'success') {
          const rapportsFiltrés = response.data.filter((rapport: any) => {
            const rapportDate = new Date(rapport.date);
            const rapportMois = `${rapportDate.getFullYear()}-${(rapportDate.getMonth() + 1).toString().padStart(2, '0')}`;
            return rapportMois === annéeMois;
          }).map((rapport: any) => ({
            ...rapport,
            etat: rapport.etat || 'CR', // État par défaut
            nbJustificatifs: rapport.nbJustificatifs || 0,
            totalValide: rapport.totalValide || 0
          }));
          
          allRapports.push(...rapportsFiltrés);
        }
      }

      setRapports(allRapports);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des rapports' });
    } finally {
      setLoading(false);
    }
  };

  const openValidationDialog = (rapport: Rapport) => {
    setValidationDialog({
      open: true,
      rapport,
      data: {
        nbJustificatifs: rapport.nbJustificatifs || 0,
        totalValide: rapport.totalValide || 0
      }
    });
  };

  const closeValidationDialog = () => {
    setValidationDialog({
      open: false,
      rapport: null,
      data: { nbJustificatifs: 0, totalValide: 0 }
    });
  };

  const handleValidation = async () => {
    if (!validationDialog.rapport) return;

    try {
      // Simulation de l'API de validation
      // En réalité, vous feriez un appel API pour mettre à jour le rapport
      
      setRapports(prev => prev.map(rapport => 
        rapport.id === validationDialog.rapport!.id
          ? {
              ...rapport,
              etat: 'VA' as const,
              nbJustificatifs: validationDialog.data.nbJustificatifs,
              totalValide: validationDialog.data.totalValide
            }
          : rapport
      ));

      setMessage({
        type: 'success',
        text: `Rapport ${validationDialog.rapport.id} validé avec succès`
      });

      closeValidationDialog();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la validation du rapport' });
    }
  };

  const handleRemboursement = async (rapport: Rapport) => {
    try {
      // Simulation de l'API de remboursement
      setRapports(prev => prev.map(r => 
        r.id === rapport.id
          ? { ...r, etat: 'RB' as const }
          : r
      ));

      setMessage({
        type: 'success',
        text: `Rapport ${rapport.id} marqué comme remboursé`
      });
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
      setMessage({ type: 'error', text: 'Erreur lors du remboursement' });
    }
  };

  const openDetailDialog = (rapport: Rapport) => {
    setDetailDialog({
      open: true,
      rapport
    });
  };

  const closeDetailDialog = () => {
    setDetailDialog({
      open: false,
      rapport: null
    });
  };

  const getAnnees = () => {
    const currentYear = new Date().getFullYear();
    const années = [];
    for (let i = currentYear - 2; i <= currentYear; i++) {
      années.push(i.toString());
    }
    return années;
  };

  if (user?.type_utilisateur !== 'comptable' && user?.type_utilisateur !== 'responsable') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Accès non autorisé. Cette page est réservée aux comptables et responsables.
        </Alert>
      </Container>
    );
  }

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
              Validation des Rapports de Visite
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Validation et remboursement des frais de visite des visiteurs médicaux
            </Typography>
          </Box>

          {message && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 3 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          {/* Filtres */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Mois</InputLabel>
                  <Select
                    value={selectedMois}
                    onChange={(e) => setSelectedMois(e.target.value)}
                    label="Mois"
                  >
                    {MOIS.map((mois) => (
                      <MenuItem key={mois.value} value={mois.value}>
                        {mois.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Année</InputLabel>
                  <Select
                    value={selectedAnnee}
                    onChange={(e) => setSelectedAnnee(e.target.value)}
                    label="Année"
                  >
                    {getAnnees().map((annee) => (
                      <MenuItem key={annee} value={annee}>
                        {annee}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Tableau des rapports */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>État</strong></TableCell>
                  <TableCell><strong>Visiteur</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Médecin</strong></TableCell>
                  <TableCell><strong>Justificatifs</strong></TableCell>
                  <TableCell><strong>Total validé</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : rapports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucun rapport trouvé pour cette période
                    </TableCell>
                  </TableRow>
                ) : (
                  rapports.map((rapport) => (
                    <TableRow key={rapport.id}>
                      <TableCell>
                        <Chip
                          label={ETATS_RAPPORT[rapport.etat].label}
                          color={ETATS_RAPPORT[rapport.etat].color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {rapport.visiteur.prenom} {rapport.visiteur.nom}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          ID: {rapport.visiteur.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(rapport.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        Dr {rapport.medecin.prenom} {rapport.medecin.nom}
                      </TableCell>
                      <TableCell>
                        {rapport.etat === 'CR' ? (
                          <TextField
                            type="number"
                            size="small"
                            value={rapport.nbJustificatifs}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setRapports(prev => prev.map(r => 
                                r.id === rapport.id 
                                  ? { ...r, nbJustificatifs: value }
                                  : r
                              ));
                            }}
                            inputProps={{ min: 0 }}
                          />
                        ) : (
                          rapport.nbJustificatifs
                        )}
                      </TableCell>
                      <TableCell>
                        {rapport.etat === 'CR' ? (
                          <TextField
                            type="number"
                            size="small"
                            value={rapport.totalValide}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setRapports(prev => prev.map(r => 
                                r.id === rapport.id 
                                  ? { ...r, totalValide: value }
                                  : r
                              ));
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        ) : (
                          `${rapport.totalValide}€`
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => openDetailDialog(rapport)}
                          >
                            Détail
                          </Button>
                          
                          {rapport.etat === 'CR' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckIcon />}
                              onClick={() => openValidationDialog(rapport)}
                            >
                              Valider
                            </Button>
                          )}
                          
                          {rapport.etat === 'VA' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<PaymentIcon />}
                              onClick={() => handleRemboursement(rapport)}
                            >
                              Rembourser
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>

      {/* Dialog de validation */}
      <Dialog 
        open={validationDialog.open} 
        onClose={closeValidationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Validation du rapport</DialogTitle>
        <DialogContent>
          {validationDialog.rapport && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Visiteur:</strong> {validationDialog.rapport.visiteur.prenom} {validationDialog.rapport.visiteur.nom}
                <br />
                <strong>Date:</strong> {new Date(validationDialog.rapport.date).toLocaleDateString('fr-FR')}
                <br />
                <strong>Médecin:</strong> Dr {validationDialog.rapport.medecin.prenom} {validationDialog.rapport.medecin.nom}
              </Typography>
              
              <TextField
                fullWidth
                label="Nombre de justificatifs"
                type="number"
                value={validationDialog.data.nbJustificatifs}
                onChange={(e) => setValidationDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, nbJustificatifs: parseInt(e.target.value) || 0 }
                }))}
                margin="normal"
                inputProps={{ min: 0 }}
              />
              
              <TextField
                fullWidth
                label="Total validé (€)"
                type="number"
                value={validationDialog.data.totalValide}
                onChange={(e) => setValidationDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, totalValide: parseFloat(e.target.value) || 0 }
                }))}
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeValidationDialog}>Annuler</Button>
          <Button 
            onClick={handleValidation}
            variant="contained"
            color="success"
          >
            Valider
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détail */}
      <Dialog 
        open={detailDialog.open} 
        onClose={closeDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Détail du rapport</DialogTitle>
        <DialogContent>
          {detailDialog.rapport && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Informations générales</Typography>
                      <Typography><strong>Visiteur:</strong> {detailDialog.rapport.visiteur.prenom} {detailDialog.rapport.visiteur.nom}</Typography>
                      <Typography><strong>Date:</strong> {new Date(detailDialog.rapport.date).toLocaleDateString('fr-FR')}</Typography>
                      <Typography><strong>Médecin:</strong> Dr {detailDialog.rapport.medecin.prenom} {detailDialog.rapport.medecin.nom}</Typography>
                      <Typography><strong>Motif:</strong> {detailDialog.rapport.motif}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Validation</Typography>
                      <Typography><strong>État:</strong> 
                        <Chip
                          label={ETATS_RAPPORT[detailDialog.rapport.etat].label}
                          color={ETATS_RAPPORT[detailDialog.rapport.etat].color}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography><strong>Justificatifs:</strong> {detailDialog.rapport.nbJustificatifs}</Typography>
                      <Typography><strong>Total validé:</strong> {detailDialog.rapport.totalValide}€</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Bilan de la visite</Typography>
                      <Typography>{detailDialog.rapport.bilan}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ValidationRapports; 