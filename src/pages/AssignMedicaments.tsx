import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Box, Button,
  CircularProgress, Alert, FormControl, InputLabel,
  Select, MenuItem, SelectChangeEvent, Checkbox,
  FormGroup, FormControlLabel, Card, CardContent,
  CardMedia, Chip, Divider, Snackbar
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAllMedicaments, 
  getRecentMedicaments, 
  assignMedicamentsToVisiteurs, 
  getVisiteursInRegion 
} from '../services/api';

interface Medicament {
  id: string;
  nomCommercial: string;
  famille: {
    id: string;
    libelle: string;
  };
  composition: string;
  effets: string;
  contreIndications: string;
  image_url?: string;
  description?: string;
  niveau_dangerosité?: number;
  date_sortie?: string;
}

interface Visiteur {
  id: string;
  nom: string;
  prenom: string;
  type_utilisateur: string;
  idRegion: string;
}

const AssignMedicaments: React.FC = () => {
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [selectedMedicaments, setSelectedMedicaments] = useState<string[]>([]);
  const [visiteurs, setVisiteurs] = useState<Visiteur[]>([]);
  const [selectedVisiteurs, setSelectedVisiteurs] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [months, setMonths] = useState<{value: string, label: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Generate list of available months (current + 6 months)
  useEffect(() => {
    const generateMonths = () => {
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      const availableMonths = [];
      const currentDate = new Date();
      
      // Start from next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      for (let i = 0; i < 6; i++) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthValue = `${year}${(month + 1).toString().padStart(2, '0')}`;
        availableMonths.push({
          value: monthValue,
          label: `${monthNames[month]} ${year}`
        });
        currentDate.setMonth(month + 1);
      }
      
      setMonths(availableMonths);
      // Set first available month as default
      if (availableMonths.length > 0) {
        setSelectedMonth(availableMonths[0].value);
      }
    };
    
    generateMonths();
  }, []);

  // Load medicaments and visiteurs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get recent medicaments (released in the last 6 months)
        const medicamentsResponse = await getRecentMedicaments();
        if (medicamentsResponse.status === 'success') {
          setMedicaments(medicamentsResponse.data);
        } else {
          setError('Erreur lors de la récupération des médicaments');
        }
        
        // Get visiteurs from this region
        const visiteursResponse = await getVisiteursInRegion();
        if (visiteursResponse.status === 'success') {
          setVisiteurs(visiteursResponse.data);
        } else {
          setError('Erreur lors de la récupération des visiteurs');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Une erreur est survenue lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleMonthChange = (event: SelectChangeEvent) => {
    setSelectedMonth(event.target.value);
  };

  const handleVisiteurChange = (visiteurId: string) => {
    setSelectedVisiteurs(prev => {
      if (prev.includes(visiteurId)) {
        return prev.filter(id => id !== visiteurId);
      } else {
        return [...prev, visiteurId];
      }
    });
  };

  const handleMedicamentChange = (medicamentId: string) => {
    setSelectedMedicaments(prev => {
      if (prev.includes(medicamentId)) {
        return prev.filter(id => id !== medicamentId);
      } else {
        return [...prev, medicamentId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedVisiteurs.length === 0) {
      setError('Veuillez sélectionner au moins un visiteur');
      return;
    }
    
    if (selectedMedicaments.length === 0) {
      setError('Veuillez sélectionner au moins un médicament');
      return;
    }
    
    if (!selectedMonth) {
      setError('Veuillez sélectionner un mois');
      return;
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      const response = await assignMedicamentsToVisiteurs({
        annee_mois: selectedMonth,
        visiteurs: selectedVisiteurs,
        medicaments: selectedMedicaments
      });
      
      if (response.status === 'success') {
        setSuccess('Médicaments assignés avec succès');
        // Reset selections
        setSelectedMedicaments([]);
        setSelectedVisiteurs([]);
      } else {
        setError(response.message || 'Erreur lors de l\'assignation des médicaments');
      }
    } catch (err) {
      console.error('Error assigning medicaments:', err);
      setError('Une erreur est survenue lors de l\'assignation des médicaments');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Assigner des médicaments aux visiteurs
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Select Month */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="month-select-label">Mois</InputLabel>
                <Select
                  labelId="month-select-label"
                  value={selectedMonth}
                  label="Mois"
                  onChange={handleMonthChange}
                >
                  {months.map(month => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            
            {/* Select Visiteurs */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Visiteurs
              </Typography>
              <FormGroup>
                {visiteurs.map(visiteur => (
                  <FormControlLabel
                    key={visiteur.id}
                    control={
                      <Checkbox 
                        checked={selectedVisiteurs.includes(visiteur.id)}
                        onChange={() => handleVisiteurChange(visiteur.id)}
                      />
                    }
                    label={`${visiteur.prenom} ${visiteur.nom}`}
                  />
                ))}
              </FormGroup>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            
            {/* Select Medicaments */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Médicaments à présenter ({medicaments.length} disponibles)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Les médicaments ci-dessous ont été commercialisés dans les 6 derniers mois.
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {medicaments.map(medicament => (
                  <Grid item xs={12} sm={6} md={4} key={medicament.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        outline: selectedMedicaments.includes(medicament.id) 
                          ? '2px solid #1976d2' 
                          : 'none'
                      }}
                      onClick={() => handleMedicamentChange(medicament.id)}
                    >
                      {medicament.image_url && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={medicament.image_url}
                          alt={medicament.nomCommercial}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {medicament.nomCommercial}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                          <Chip
                            label={medicament.famille.libelle}
                            size="small"
                            color="primary"
                          />
                          {medicament.niveau_dangerosité && (
                            <Chip
                              label={`Dangerosité: ${medicament.niveau_dangerosité}`}
                              size="small"
                              color={
                                medicament.niveau_dangerosité === 3 ? 'error' :
                                medicament.niveau_dangerosité === 2 ? 'warning' : 'success'
                              }
                            />
                          )}
                        </Box>
                        {medicament.description && (
                          <Typography variant="body2" color="text.secondary">
                            {medicament.description.substring(0, 100)}
                            {medicament.description.length > 100 ? '...' : ''}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={submitting || selectedVisiteurs.length === 0 || selectedMedicaments.length === 0}
              >
                {submitting ? <CircularProgress size={24} /> : 'Assigner les médicaments sélectionnés'}
              </Button>
            </Grid>
          </Grid>
          
          {/* Success message */}
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess(null)}
            message={success}
          />
        </>
      )}
    </Container>
  );
};

export default AssignMedicaments; 