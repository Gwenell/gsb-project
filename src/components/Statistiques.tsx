import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';
import { getStatistiques, getRapportsEquipe } from '../services/api';

// Couleurs pour les graphiques
const COLORS = ['#ff9800', '#4caf50', '#2196f3', '#f44336', '#9c27b0'];

interface StatistiquesData {
  total_rapports: number;
  rapports_en_cours: number;
  rapports_valides: number;
  rapports_rembourses: number;
  par_visiteur: Array<{
    visiteur: string;
    total: number;
    en_cours: number;
    valides: number;
    rembourses: number;
  }>;
  par_motif: Array<{
    motif: string;
    count: number;
  }>;
}

interface RapportEquipe {
  id: string;
  visiteur: string;
  motif: string;
  medecin: string;
  date_visite: string;
  etat: string;
  total: number;
}

const Statistiques: React.FC = () => {
  const { user } = useAuth();
  
  // États pour le formulaire
  const [periode, setPeriode] = useState('mois');
  const [dateSelectionne, setDateSelectionne] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [tabValue, setTabValue] = useState(0);
  
  // États pour les données
  const [statistiques, setStatistiques] = useState<StatistiquesData | null>(null);
  const [rapportsEquipe, setRapportsEquipe] = useState<RapportEquipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatistiques = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getStatistiques(periode, dateSelectionne);
      
      if (result.status === 'success') {
        setStatistiques(result.data);
      } else {
        setError(result.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const loadRapportsEquipe = async () => {
    if (user?.type_utilisateur === 'delegue' || user?.type_utilisateur === 'responsable') {
      try {
        const result = await getRapportsEquipe(dateSelectionne);
        
        if (result.status === 'success') {
          setRapportsEquipe(result.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des rapports équipe:', error);
      }
    }
  };

  useEffect(() => {
    loadStatistiques();
    loadRapportsEquipe();
  }, [periode, dateSelectionne, user]);

  const generateDateOptions = () => {
    const options = [];
    const now = new Date();
    
    if (periode === 'mois') {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const value = `${year}-${month}`;
        const label = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        
        options.push({ value, label });
      }
    } else if (periode === 'annee') {
      for (let i = 0; i < 3; i++) {
        const year = now.getFullYear() - i;
        options.push({ value: year.toString(), label: year.toString() });
      }
    }
    
    return options;
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getEtatColor = (etat: string) => {
    switch (etat) {
      case 'CR': return '#ff9800';
      case 'VA': return '#4caf50';
      case 'RB': return '#2196f3';
      default: return '#757575';
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement des statistiques...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        Tableau de Bord - {user?.type_utilisateur === 'visiteur' ? 'Mon Activité' : 'Supervision'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtres */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Période</InputLabel>
              <Select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                label="Période"
              >
                <MenuItem value="mois">Par mois</MenuItem>
                <MenuItem value="annee">Par année</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>
                {periode === 'mois' ? 'Mois' : 'Année'}
              </InputLabel>
              <Select
                value={dateSelectionne}
                onChange={(e) => setDateSelectionne(e.target.value)}
                label={periode === 'mois' ? 'Mois' : 'Année'}
              >
                {generateDateOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {statistiques && (
        <>
          {/* Cartes de synthèse */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Rapports
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#1976d2' }}>
                    {statistiques.total_rapports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    En cours
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: COLORS[0] }}>
                    {statistiques.rapports_en_cours}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculatePercentage(statistiques.rapports_en_cours, statistiques.total_rapports)}
                    sx={{ mt: 1, backgroundColor: '#e0e0e0' }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {calculatePercentage(statistiques.rapports_en_cours, statistiques.total_rapports)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Validés
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: COLORS[1] }}>
                    {statistiques.rapports_valides}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculatePercentage(statistiques.rapports_valides, statistiques.total_rapports)}
                    sx={{ mt: 1, backgroundColor: '#e0e0e0' }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {calculatePercentage(statistiques.rapports_valides, statistiques.total_rapports)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Remboursés
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: COLORS[2] }}>
                    {statistiques.rapports_rembourses}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculatePercentage(statistiques.rapports_rembourses, statistiques.total_rapports)}
                    sx={{ mt: 1, backgroundColor: '#e0e0e0' }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {calculatePercentage(statistiques.rapports_rembourses, statistiques.total_rapports)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Onglets */}
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="statistiques tabs">
              <Tab label="Vue d'ensemble" />
              {statistiques.par_visiteur.length > 0 && <Tab label="Par visiteur" />}
              {statistiques.par_motif.length > 0 && <Tab label="Par motif" />}
              {(user?.type_utilisateur === 'delegue' || user?.type_utilisateur === 'responsable') && (
                <Tab label="Équipe" />
              )}
            </Tabs>
          </Paper>

          {/* Contenu des onglets */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              {/* Résumé de la période */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Résumé de la période
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" paragraph>
                      <strong>Période analysée :</strong> {generateDateOptions().find(opt => opt.value === dateSelectionne)?.label}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Taux de validation :
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS[1] }}>
                          {calculatePercentage(statistiques.rapports_valides, statistiques.total_rapports)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Taux de remboursement :
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS[2] }}>
                          {calculatePercentage(statistiques.rapports_rembourses, statistiques.total_rapports)}%
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {statistiques.par_visiteur.length > 0 && (
                      <>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Visiteur le plus actif :
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {statistiques.par_visiteur.reduce((prev, current) => 
                            (prev.total > current.total) ? prev : current
                          ).visiteur}
                        </Typography>
                      </>
                    )}

                    {statistiques.par_motif.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Motif principal :
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {statistiques.par_motif.reduce((prev, current) => 
                            (prev.count > current.count) ? prev : current
                          ).motif}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Répartition visuelle */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Répartition des états
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">En cours</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {statistiques.rapports_en_cours} ({calculatePercentage(statistiques.rapports_en_cours, statistiques.total_rapports)}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePercentage(statistiques.rapports_en_cours, statistiques.total_rapports)} 
                        sx={{ height: 10, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: COLORS[0] } }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Validés</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {statistiques.rapports_valides} ({calculatePercentage(statistiques.rapports_valides, statistiques.total_rapports)}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePercentage(statistiques.rapports_valides, statistiques.total_rapports)} 
                        sx={{ height: 10, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: COLORS[1] } }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Remboursés</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {statistiques.rapports_rembourses} ({calculatePercentage(statistiques.rapports_rembourses, statistiques.total_rapports)}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePercentage(statistiques.rapports_rembourses, statistiques.total_rapports)} 
                        sx={{ height: 10, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: COLORS[2] } }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {tabValue === 1 && statistiques.par_visiteur.length > 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Activité par visiteur
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Visiteur</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">En cours</TableCell>
                          <TableCell align="right">Validés</TableCell>
                          <TableCell align="right">Remboursés</TableCell>
                          <TableCell align="right">Taux validation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {statistiques.par_visiteur.map((row) => (
                          <TableRow key={row.visiteur}>
                            <TableCell component="th" scope="row">
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {row.visiteur}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={row.total} 
                                size="small" 
                                sx={{ bgcolor: '#1976d2', color: 'white' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={row.en_cours} 
                                size="small" 
                                sx={{ bgcolor: COLORS[0], color: 'white' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={row.valides} 
                                size="small" 
                                sx={{ bgcolor: COLORS[1], color: 'white' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={row.rembourses} 
                                size="small" 
                                sx={{ bgcolor: COLORS[2], color: 'white' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {calculatePercentage(row.valides, row.total)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Visualisation simplifiée par visiteur */}
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Progression par visiteur
                  </Typography>
                  <Grid container spacing={2}>
                    {statistiques.par_visiteur.map((visiteur, index) => (
                      <Grid item xs={12} md={6} lg={4} key={visiteur.visiteur}>
                        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {visiteur.visiteur}
                          </Typography>
                          <Typography variant="h4" sx={{ color: '#1976d2', mb: 2 }}>
                            {visiteur.total}
                          </Typography>
                          
                          <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">En cours</Typography>
                              <Typography variant="body2">{visiteur.en_cours}</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={calculatePercentage(visiteur.en_cours, visiteur.total)} 
                              sx={{ height: 6, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: COLORS[0] } }}
                            />
                          </Box>
                          
                          <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">Validés</Typography>
                              <Typography variant="body2">{visiteur.valides}</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={calculatePercentage(visiteur.valides, visiteur.total)} 
                              sx={{ height: 6, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: COLORS[1] } }}
                            />
                          </Box>
                          
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">Remboursés</Typography>
                              <Typography variant="body2">{visiteur.rembourses}</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={calculatePercentage(visiteur.rembourses, visiteur.total)} 
                              sx={{ height: 6, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: COLORS[2] } }}
                            />
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {tabValue === 2 && statistiques.par_motif.length > 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Répartition par motif de visite
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {statistiques.par_motif.map((motif, index) => (
                      <Box key={motif.motif} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {motif.motif}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {motif.count} ({calculatePercentage(motif.count, statistiques.total_rapports)}%)
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={calculatePercentage(motif.count, statistiques.total_rapports)} 
                          sx={{ 
                            height: 12, 
                            backgroundColor: '#e0e0e0', 
                            '& .MuiLinearProgress-bar': { bgcolor: COLORS[index % COLORS.length] }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Détails par motif
                  </Typography>
                  <List>
                    {statistiques.par_motif.map((motif) => (
                      <ListItem key={motif.motif} sx={{ px: 0 }}>
                        <ListItemText
                          primary={motif.motif}
                          secondary={`${motif.count} visites`}
                        />
                        <Chip 
                          label={`${calculatePercentage(motif.count, statistiques.total_rapports)}%`}
                          size="small"
                          color="primary"
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}

          {tabValue === 3 && (user?.type_utilisateur === 'delegue' || user?.type_utilisateur === 'responsable') && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Rapports de l'équipe
                  </Typography>
                  {rapportsEquipe.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Visiteur</TableCell>
                            <TableCell>Médecin</TableCell>
                            <TableCell>Motif</TableCell>
                            <TableCell>État</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rapportsEquipe.map((rapport) => (
                            <TableRow key={rapport.id}>
                              <TableCell>
                                {new Date(rapport.date_visite).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>{rapport.visiteur}</TableCell>
                              <TableCell>{rapport.medecin}</TableCell>
                              <TableCell>{rapport.motif}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={getEtatLabel(rapport.etat)} 
                                  size="small"
                                  sx={{ 
                                    bgcolor: getEtatColor(rapport.etat), 
                                    color: 'white' 
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                {rapport.total ? `${rapport.total}€` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">
                      Aucun rapport trouvé pour cette période.
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {!statistiques && !loading && (
        <Alert severity="info">
          Aucune donnée statistique disponible pour la période sélectionnée.
        </Alert>
      )}
    </Container>
  );
};

export default Statistiques; 